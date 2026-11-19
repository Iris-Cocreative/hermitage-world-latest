-- 0001_init · Hermitage World app · 2026-11-07
--
-- The first schema: who people are, what the Hermitage sells, who owns what,
-- and the free writing the team publishes. Memberships and the LMS come
-- later on top of entitlements (a membership will be one more source).
--
-- Rules the policies follow:
--   anyone        reads active products and published posts
--   a member      reads their own profile, orders and entitlements, and the
--                 files of products they own
--   staff/admin   read and write products, files and posts; read every order
--   the server    (service role) writes orders and entitlements from Stripe
--                 events, and signs media URLs after checking an entitlement

-- ---------------------------------------------------------------- helpers

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles

create type public.app_role as enum ('member', 'staff', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        public.app_role not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index profiles_email_idx on public.profiles (lower(email));

comment on table public.profiles is 'One row per auth user, created by trigger. role decides what the app lets a person do.';

-- A profile appears with the auth user and follows its email.
create or replace function public.handle_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_auth_user();

-- Staff checks that policies can call without recursing into profiles.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Nobody promotes themselves: a role changes only by an admin or the server.
create or replace function public.guard_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role
     and not (current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin()) then
    raise exception 'only an admin can change a role';
  end if;
  return new;
end $$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: own or staff read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "profiles: own update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin update" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------- products

create type public.product_kind as enum ('track', 'album', 'book', 'video', 'program', 'bundle', 'other');
create type public.product_status as enum ('draft', 'active', 'archived');

create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  kind               public.product_kind not null default 'other',
  title              text not null,
  subtitle           text not null default '',
  description        text not null default '',   -- markdown
  price_cents        integer not null default 0 check (price_cents >= 0),
  currency           text not null default 'usd' check (currency = lower(currency)),
  status             public.product_status not null default 'draft',
  cover_path         text,                       -- object path in the public 'covers' bucket
  sort               integer not null default 0,
  meta               jsonb not null default '{}'::jsonb, -- vol, track, voice, people, year, occasion… (CMS-shaped, from the catalog)
  stripe_product_id  text,
  stripe_price_id    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index products_status_idx on public.products (status, kind, sort);

comment on table public.products is 'Everything the Hermitage offers for a price or for free: tracks, albums, books, videos, programs. price_cents = 0 is free.';

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;


create policy "products: staff write" on public.products
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ------------------------------------------------------------ product files
-- What a buyer receives: the files in the private media bucket.

create type public.file_kind as enum ('audio', 'video', 'pdf', 'image', 'other');

create table public.product_files (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  kind              public.file_kind not null default 'audio',
  label             text not null,
  path              text not null unique,        -- object path in the private media bucket
  size_bytes        bigint,
  duration_seconds  integer,
  sort              integer not null default 0,
  created_at        timestamptz not null default now()
);
create index product_files_product_idx on public.product_files (product_id, sort);

alter table public.product_files enable row level security;

create policy "product_files: staff read" on public.product_files
  for select to authenticated
  using ((select public.is_staff()));

create policy "product_files: staff write" on public.product_files
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ------------------------------------------------------------------ orders
-- Written by the server only. A pending order is created when checkout
-- starts; the Stripe webhook marks it paid and grants the entitlements.

create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded', 'canceled');

create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.profiles (id) on delete set null,
  email                       text,
  status                      public.order_status not null default 'pending',
  total_cents                 integer not null default 0 check (total_cents >= 0),
  currency                    text not null default 'usd',
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  title       text not null,                      -- snapshot at purchase
  unit_cents  integer not null check (unit_cents >= 0),
  quantity    integer not null default 1 check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders: own or staff read" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy "order_items: own or staff read" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = (select auth.uid()) or (select public.is_staff()))
  ));

-- ------------------------------------------------------------ entitlements
-- Who may open what. One row per person and product, whatever the source.

create type public.entitlement_source as enum ('purchase', 'free', 'grant');

create table public.entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  source      public.entitlement_source not null,
  order_id    uuid references public.orders (id) on delete set null,
  granted_at  timestamptz not null default now(),
  unique (user_id, product_id)
);
create index entitlements_user_idx on public.entitlements (user_id, granted_at desc);

alter table public.entitlements enable row level security;

create policy "products: active are public" on public.products
  for select to anon, authenticated
  using (
    status = 'active'
    or (select public.is_staff())
    -- what a person owns stays visible to them, even once it is archived
    or exists (
      select 1 from public.entitlements e
      where e.product_id = products.id and e.user_id = (select auth.uid())
    )
  );

create policy "product_files: owners read" on public.product_files
  for select to authenticated
  using (exists (
    select 1 from public.entitlements e
    where e.product_id = product_files.product_id and e.user_id = (select auth.uid())
  ));

create policy "entitlements: own or staff read" on public.entitlements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy "entitlements: staff grant" on public.entitlements
  for insert to authenticated
  with check ((select public.is_staff()));

create policy "entitlements: staff revoke" on public.entitlements
  for delete to authenticated
  using ((select public.is_staff()));

-- ------------------------------------------------------------ stripe events
-- Every event Stripe delivers, once. The webhook inserts first; a duplicate
-- delivery finds its id here and is acknowledged without a second fulfillment.

create table public.stripe_events (
  id            text primary key,
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  error         text
);

alter table public.stripe_events enable row level security;
-- no policies: the service role alone reads and writes this table

-- ------------------------------------------------------------------- posts
-- Free writing: posts, the weekly letter, news, teachings.

create type public.post_kind as enum ('post', 'letter', 'news', 'teaching');
create type public.post_status as enum ('draft', 'published');

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  kind          public.post_kind not null default 'post',
  title         text not null,
  excerpt       text not null default '',
  body          text not null default '',        -- markdown
  cover_path    text,
  status        public.post_status not null default 'draft',
  published_at  timestamptz,
  author_id     uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index posts_published_idx on public.posts (status, published_at desc);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "posts: published are public" on public.posts
  for select to anon, authenticated
  using (status = 'published' or (select public.is_staff()));

create policy "posts: staff write" on public.posts
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ----------------------------------------------------------------- storage
-- covers: public images (product and post covers).
-- media:  private; a buyer reaches a file through a signed URL the server
--         makes after checking the entitlement.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "covers: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'covers');

create policy "covers: staff write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and (select public.is_staff()));

create policy "covers: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and (select public.is_staff()));

create policy "covers: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (select public.is_staff()));

create policy "media: staff read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

create policy "media: owners read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and exists (
    select 1
    from public.product_files pf
    join public.entitlements e on e.product_id = pf.product_id
    where pf.path = storage.objects.name and e.user_id = (select auth.uid())
  ));

create policy "media: staff write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "media: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

create policy "media: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

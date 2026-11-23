-- Vendored from collab-library/migrations/0001_collab_library.sql at ab92553, 2026-11-23.
-- Do not edit here. A later library migration becomes a new numbered file.

-- Collab Library 0001 · the schema · 2026-11-19
--
-- A resource library any client app installs into its own Supabase: what the
-- resources are, who made them, what they are about, how they relate, and the
-- paths through them. It sells nothing itself: a resource may point at one of
-- the host's products, and the host says what that product costs and whether
-- the viewer owns it.
--
-- Install: copy this file into the host's supabase/migrations (the vendor
-- script does it), then add the host's own migration after it that replaces
-- the three contract functions below. Every table is prefixed library_, so it
-- sits beside the host's tables in public without a clash.
--
-- The host contract (replace with `create or replace`, same signatures):
--   library_is_editor()              who may write the library (default: nobody)
--   library_can_see(audience text)   who may see a resource of this audience
--                                    (default: 'public' everyone, 'signed_in'
--                                    anyone signed in, anything else nobody)
--   library_offer(product uuid)      the host's product behind a resource: its
--                                    slug, price, currency, whether it is on
--                                    sale and whether the viewer owns it
--                                    (default: no products)

-- ---------------------------------------------------------------- contract

create or replace function public.library_is_editor() returns boolean
language sql stable as $$ select false $$;

create or replace function public.library_can_see(p_audience text) returns boolean
language sql stable as $$
  select case p_audience
    when 'public' then true
    when 'signed_in' then auth.uid() is not null
    else false
  end
$$;

create or replace function public.library_offer(p_product uuid)
returns table (product_slug text, price_cents integer, currency text, on_sale boolean, owned boolean)
language sql stable as $$
  select null::text, null::integer, null::text, false, false where false
$$;

create or replace function public.library_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------------- types
-- The kinds of resource this client keeps, each drawn in one of the shapes the
-- library knows. A client renames, reorders or switches them off; it never
-- needs a new shape to add a type.

create table public.library_types (
  key      text primary key check (key ~ '^[a-z][a-z0-9-]*$'),
  label    text not null,                 -- Meditation
  plural   text not null,                 -- Meditations
  action   text not null default 'Open',  -- the verb on its button: Listen, Read, Watch
  shape    text not null default 'paper' check (shape in
             ('book', 'article', 'video', 'audio', 'album', 'course', 'practice', 'stack', 'paper')),
  sort     integer not null default 0,
  enabled  boolean not null default true
);

comment on table public.library_types is 'The resource types this client keeps. shape is how the library draws one; label, plural and action are its words.';

-- The full set, as the Holos prototype named them. A client switches off what it doesn't keep.
insert into public.library_types (key, label, plural, action, shape, sort) values
  ('article',    'Article',    'Articles',           'Read',             'article',  10),
  ('video',      'Video',      'Video',              'Watch',            'video',    20),
  ('course',     'Course',     'Courses',            'View the course',  'course',   30),
  ('book',       'Book',       'Books',              'Find the book',    'book',     40),
  ('app',        'App',        'Apps & tools',       'Open the app',     'paper',    50),
  ('assessment', 'Assessment', 'Assessments',        'Take it',          'paper',    60),
  ('library',    'Library',    'Libraries',          'Browse it',        'stack',    70),
  ('collection', 'Collection', 'Collections',        'Browse it',        'stack',    80),
  ('review',     'Review',     'Reviews & analysis', 'Read the review',  'article',  90),
  ('research',   'Research',   'Research',           'Read the report',  'paper',   100),
  ('practice',   'Practice',   'Practices',          'Begin',            'practice',110),
  ('audio',      'Audio',      'Audio',              'Listen',           'audio',   120),
  ('music',      'Music',      'Music',              'Listen',           'album',   130),
  ('series',     'Series',     'Series',             'Browse the series','stack',   140),
  ('template',   'Template',   'Templates',          'Make a copy',      'paper',   150),
  ('pattern',    'Pattern',    'Patterns',           'Read the pattern', 'paper',   160);

-- ------------------------------------------------------------------ people
-- Who made, voiced or wrote a resource. Not accounts: a person here may have
-- died decades ago, or be a series name.

create table public.library_people (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  short_name  text not null default '',
  role        text not null default '',     -- one line: Founder of the Hermitage, 1985
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ topics
-- What a resource is about, or when you would reach for it. facet groups them
-- into rows of filters (Holos: domain, tag; the Hermitage: occasion).

create table public.library_topics (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,
  name   text not null,
  facet  text not null default 'topic' check (facet ~ '^[a-z][a-z0-9-]*$'),
  color  text,                               -- optional: a CSS color the shapes tint with
  sort   integer not null default 0
);
create index library_topics_facet_idx on public.library_topics (facet, sort);

-- --------------------------------------------------------------- resources

create table public.library_resources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  type          text not null references public.library_types (key) on update cascade,
  title         text not null,
  subtitle      text not null default '',
  blurb         text not null default '',     -- a few sentences, plain text
  body          text not null default '',     -- optional, markdown: read in place
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  audience      text not null default 'public', -- passed to library_can_see()
  stage         text check (stage in ('seedling', 'budding', 'evergreen')),
  url           text,                         -- where it opens: a path in the host app or an outside link
  product_id    uuid,                         -- the host's product, if it is sold or claimed (see library_offer)
  cover_url     text,
  minutes       integer check (minutes > 0),
  year          integer check (year between 1000 and 3000),
  featured      boolean not null default false,
  sort          integer not null default 0,
  meta          jsonb not null default '{}'::jsonb, -- the client's own fields (vol, track, voice…)
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index library_resources_list_idx on public.library_resources (status, type, sort);
create index library_resources_product_idx on public.library_resources (product_id);

comment on table public.library_resources is 'One row per thing in the library. product_id links the host''s store; the library never holds a price.';

create trigger library_resources_touch
  before update on public.library_resources
  for each row execute function public.library_touch();

-- Published once: the first time a resource is published, it gets a date.
create or replace function public.library_stamp_published() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $$;

create trigger library_resources_stamp
  before insert or update of status on public.library_resources
  for each row execute function public.library_stamp_published();

create table public.library_resource_people (
  resource_id  uuid not null references public.library_resources (id) on delete cascade,
  person_id    uuid not null references public.library_people (id) on delete cascade,
  credit       text not null default '',     -- voice, harp, editor… empty means author
  sort         integer not null default 0,
  primary key (resource_id, person_id)
);
create index library_resource_people_person_idx on public.library_resource_people (person_id);

create table public.library_resource_topics (
  resource_id  uuid not null references public.library_resources (id) on delete cascade,
  topic_id     uuid not null references public.library_topics (id) on delete cascade,
  primary key (resource_id, topic_id)
);
create index library_resource_topics_topic_idx on public.library_resource_topics (topic_id);

-- --------------------------------------------------------------- relations
-- How one resource stands to another, read both ways.

create table public.library_relation_kinds (
  key        text primary key check (key ~ '^[a-z][a-z0-9-]*$'),
  out_label  text not null,     -- from the resource that holds the link: Part of
  in_label   text not null,     -- from the other end: Contains
  sort       integer not null default 0
);

insert into public.library_relation_kinds (key, out_label, in_label, sort) values
  ('part-of',      'Part of',           'Contains',           10),
  ('companion',    'Goes with',         'Goes with',          20),
  ('builds-on',    'Builds on',         'Built on by',        30),
  ('responds-to',  'Responds to',       'Answered by',        40),
  ('other-form',   'Also as',           'Also as',            50),
  ('reads',        'Reads',             'Read in',            60),
  ('applied-in',   'Used in practice',  'Informed by',        70),
  ('adapted-from', 'Adapted after',     'Led to a change in', 80);

create table public.library_relations (
  from_id  uuid not null references public.library_resources (id) on delete cascade,
  to_id    uuid not null references public.library_resources (id) on delete cascade,
  kind     text not null references public.library_relation_kinds (key) on update cascade,
  sort     integer not null default 0,
  primary key (from_id, to_id, kind),
  check (from_id <> to_id)
);
create index library_relations_to_idx on public.library_relations (to_id);

-- ------------------------------------------------------------- collections
-- A path: resources in an order, each with a line on why it is there.

create table public.library_collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  title       text not null,
  blurb       text not null default '',
  by_line     text not null default '',     -- Suggested by the Hermitage
  time_line   text not null default '',     -- 6 recordings, then a retreat
  status      text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger library_collections_touch
  before update on public.library_collections
  for each row execute function public.library_touch();

create table public.library_collection_items (
  collection_id  uuid not null references public.library_collections (id) on delete cascade,
  resource_id    uuid not null references public.library_resources (id) on delete cascade,
  sort           integer not null default 0,
  note           text not null default '',
  primary key (collection_id, resource_id)
);
create index library_collection_items_resource_idx on public.library_collection_items (resource_id);

-- ------------------------------------------------------------ the catalog
-- Every resource the viewer may see, with the host's offer beside it. The view
-- runs as the viewer (security_invoker), so the resources' own policies and
-- the host's product policies both apply.

create view public.library_catalog with (security_invoker = true) as
select
  r.id, r.slug, r.type, r.title, r.subtitle, r.blurb, r.body, r.status, r.audience, r.stage,
  r.url, r.product_id, r.cover_url, r.minutes, r.year, r.featured, r.sort, r.meta,
  r.published_at, r.updated_at,
  o.product_slug, o.price_cents, o.currency,
  coalesce(o.on_sale, false) as on_sale,
  coalesce(o.owned, false) as owned
from public.library_resources r
left join lateral public.library_offer(r.product_id) o on true;

-- --------------------------------------------------------------------- RLS

alter table public.library_types enable row level security;
alter table public.library_people enable row level security;
alter table public.library_topics enable row level security;
alter table public.library_resources enable row level security;
alter table public.library_resource_people enable row level security;
alter table public.library_resource_topics enable row level security;
alter table public.library_relation_kinds enable row level security;
alter table public.library_relations enable row level security;
alter table public.library_collections enable row level security;
alter table public.library_collection_items enable row level security;

-- The vocabulary is public.
create policy "library_types: read" on public.library_types for select to anon, authenticated using (true);
create policy "library_people: read" on public.library_people for select to anon, authenticated using (true);
create policy "library_topics: read" on public.library_topics for select to anon, authenticated using (true);
create policy "library_relation_kinds: read" on public.library_relation_kinds for select to anon, authenticated using (true);

-- A resource is seen when it is published to an audience the viewer belongs to.
create policy "library_resources: read" on public.library_resources
  for select to anon, authenticated
  using ((status = 'published' and (select public.library_can_see(audience))) or (select public.library_is_editor()));

-- What hangs off a resource is seen with it (the subquery runs under the resource's own policy).
create policy "library_resource_people: read" on public.library_resource_people
  for select to anon, authenticated
  using (exists (select 1 from public.library_resources r where r.id = resource_id));
create policy "library_resource_topics: read" on public.library_resource_topics
  for select to anon, authenticated
  using (exists (select 1 from public.library_resources r where r.id = resource_id));
create policy "library_relations: read" on public.library_relations
  for select to anon, authenticated
  using (exists (select 1 from public.library_resources r where r.id = from_id)
     and exists (select 1 from public.library_resources r where r.id = to_id));

create policy "library_collections: read" on public.library_collections
  for select to anon, authenticated
  using (status = 'published' or (select public.library_is_editor()));
create policy "library_collection_items: read" on public.library_collection_items
  for select to anon, authenticated
  using (exists (select 1 from public.library_collections c where c.id = collection_id)
     and exists (select 1 from public.library_resources r where r.id = resource_id));

-- Editors write everything.
create policy "library_types: edit" on public.library_types for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_people: edit" on public.library_people for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_topics: edit" on public.library_topics for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_resources: edit" on public.library_resources for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_resource_people: edit" on public.library_resource_people for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_resource_topics: edit" on public.library_resource_topics for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_relation_kinds: edit" on public.library_relation_kinds for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_relations: edit" on public.library_relations for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_collections: edit" on public.library_collections for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));
create policy "library_collection_items: edit" on public.library_collection_items for all to authenticated
  using ((select public.library_is_editor())) with check ((select public.library_is_editor()));

grant select on public.library_catalog to anon, authenticated;

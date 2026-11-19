-- 0003_library_host · Hermitage World as a Collab Library host · 2026-11-19
--
-- 0002_collab_library.sql is the Collab Library's own schema, copied from
-- the collab-library repository by scripts/vendor.mjs (never edit it here).
-- This file is the Hermitage's side of the contract:
--   who edits the library     staff and admins (is_staff)
--   who sees what             public resources for everyone; 'signed_in' for
--                             anyone with an account (membership comes later)
--   what a resource costs     its product in the shop, and whether the viewer
--                             owns it (entitlements)
-- and the kinds of resource the Hermitage keeps.

create or replace function public.library_is_editor() returns boolean
language sql stable as $$ select public.is_staff() $$;

-- The product behind a resource, as the viewer may see it. It runs as the
-- viewer, so the products policy applies: a visitor sees only active
-- products, and a person still sees one they own after it is archived.
create or replace function public.library_offer(p_product uuid)
returns table (product_slug text, price_cents integer, currency text, on_sale boolean, owned boolean)
language sql stable as $$
  select p.slug, p.price_cents, p.currency, p.status = 'active',
         exists (select 1 from public.entitlements e where e.product_id = p.id and e.user_id = (select auth.uid()))
  from public.products p
  where p.id = p_product
$$;

-- A resource's product is one of ours; deleting the product unlinks it.
alter table public.library_resources
  add constraint library_resources_product_fk
  foreign key (product_id) references public.products (id) on delete set null;

-- ------------------------------------------------------------------ types
-- The Hermitage's kinds, drawn with the library's shapes. The Holos set stays
-- in the table, switched off, in case a kind is wanted later (articles for
-- teachings, for one).

-- Switched off and moved after the Hermitage's own, so the editor lists ours first.
update public.library_types set enabled = false, sort = sort + 1000;

insert into public.library_types (key, label, plural, action, shape, sort, enabled) values
  ('meditation', 'Meditation',  'Meditations',  'Listen',           'audio',    10, true),
  ('album',      'Album',       'Albums',       'Listen',           'album',    20, true),
  ('program',    'Program',     'Programs',     'See the program',  'course',   30, true),
  ('book',       'Book',        'Books',        'Read',             'book',     40, true),
  ('set',        'Set',         'Sets',         'See the set',      'stack',    50, true),
  ('video',      'Video',       'Video',        'Watch',            'video',    60, true),
  ('series',     'Series',      'Series',       'Browse the series','stack',    70, true),
  ('circle',     'Circle',      'Circles',      'See the circle',   'practice', 80, true)
on conflict (key) do update set
  label = excluded.label, plural = excluded.plural, action = excluded.action,
  shape = excluded.shape, sort = excluded.sort, enabled = true;

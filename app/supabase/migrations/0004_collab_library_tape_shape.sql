-- Vendored from collab-library/migrations/0002_tape_shape.sql at 31d81c2, 2026-11-24.
-- Do not edit here.

-- Collab Library 0002: a tape shape.
-- A cassette, for recordings that came out on tape or that a client wants
-- drawn as one (a single volume of a series, say). Its label carries the
-- title; its window shows the two reels.

alter table public.library_types drop constraint if exists library_types_shape_check;
alter table public.library_types add constraint library_types_shape_check check (shape in
  ('book', 'article', 'video', 'audio', 'album', 'tape', 'course', 'practice', 'stack', 'paper'));

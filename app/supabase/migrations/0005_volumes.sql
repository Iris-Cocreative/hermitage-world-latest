-- Hermitage World 0005: single volumes.
-- Each Opus CD holds two of the original tape volumes (Opus I is Vols. 1
-- and 7). The library keeps each volume on its own, drawn as the tape it
-- was; the CD stays an album that holds its two volumes, and a volume holds
-- its meditations. The volumes themselves come from the catalog through
-- seed-library.sql.

insert into public.library_types (key, label, plural, action, shape, sort, enabled) values
  ('volume', 'Volume', 'Volumes', 'Listen', 'tape', 15, true)
on conflict (key) do update set
  label = excluded.label, plural = excluded.plural, action = excluded.action,
  shape = excluded.shape, sort = excluded.sort, enabled = true;

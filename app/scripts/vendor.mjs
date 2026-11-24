/**
 * Pins copies of the two shared foundations into the app:
 *
 *   Trellis         ../../trellis         → vendor/trellis/ (core.css, settle.js), and
 *                                           ../assets/vendor/trellis/ for the static site
 *   Collab Library  ../../collab-library  → vendor/collab-library/ (src, README)
 *                                           and its schema as
 *                                           supabase/migrations/0002_collab_library.sql
 *
 * A pinned copy is what Trellis asks for, and it means Vercel builds from
 * files in this repository, with no private package to fetch. Each copy gets a
 * SOURCE.txt naming the commit it came from. Never edit the copies: change the
 * source repository, commit there, and run `npm run vendor` again.
 *
 *   npm run vendor                       both, from the sibling folders
 *   node scripts/vendor.mjs --trellis ../../trellis --library ../../collab-library
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return resolve(appDir, i > 0 ? process.argv[i + 1] : fallback);
};
const trellisDir = arg('trellis', '../../trellis');
const libraryDir = arg('library', '../../collab-library');

function source(dir) {
  try {
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' }).trim();
    const commit = git('rev-parse', '--short', 'HEAD');
    const dirty = git('status', '--porcelain') ? ' (with uncommitted changes)' : '';
    return `${commit}${dirty}, ${git('log', '-1', '--format=%cs')}`;
  } catch {
    return 'not a git checkout';
  }
}

function stamp(to, name, from) {
  writeFileSync(
    join(to, 'SOURCE.txt'),
    `Vendored from ${name} at ${source(from)}.\nCopied ${new Date().toISOString().slice(0, 10)} by app/scripts/vendor.mjs. Do not edit: change the source and copy again.\n`,
  );
}

// Trellis
if (!existsSync(join(trellisDir, 'core.css'))) throw new Error(`vendor: no Trellis at ${trellisDir}`);
const trellisOut = join(appDir, 'vendor', 'trellis');
rmSync(trellisOut, { recursive: true, force: true });
mkdirSync(trellisOut, { recursive: true });
for (const f of ['core.css', 'settle.js', 'LICENSE']) cpSync(join(trellisDir, f), join(trellisOut, f));
const version = JSON.parse(readFileSync(join(trellisDir, 'package.json'), 'utf8')).version;
stamp(trellisOut, `Iris-Cocreative/trellis v${version}`, trellisDir);
// The static site's own pin, which its Trellis pages link (and GitHub Pages serves).
const siteTrellis = resolve(appDir, '..', 'assets', 'vendor', 'trellis');
rmSync(siteTrellis, { recursive: true, force: true });
mkdirSync(siteTrellis, { recursive: true });
for (const f of ['core.css', 'settle.js', 'LICENSE']) cpSync(join(trellisDir, f), join(siteTrellis, f));
stamp(siteTrellis, `Iris-Cocreative/trellis v${version}`, trellisDir);
console.log(`vendor: Trellis v${version} (${source(trellisDir)}) → vendor/trellis/ and ../assets/vendor/trellis/`);

// Collab Library
if (!existsSync(join(libraryDir, 'src', 'index.ts'))) throw new Error(`vendor: no Collab Library at ${libraryDir}`);
const libraryOut = join(appDir, 'vendor', 'collab-library');
rmSync(libraryOut, { recursive: true, force: true });
mkdirSync(libraryOut, { recursive: true });
cpSync(join(libraryDir, 'src'), join(libraryOut, 'src'), { recursive: true });
cpSync(join(libraryDir, 'README.md'), join(libraryOut, 'README.md'));
stamp(libraryOut, 'Iris-Cocreative/collab-library', libraryDir);
const migration = join(appDir, 'supabase', 'migrations', '0002_collab_library.sql');
const schema = readFileSync(join(libraryDir, 'migrations', '0001_collab_library.sql'), 'utf8');
const header = `-- Vendored from collab-library/migrations/0001_collab_library.sql at ${source(libraryDir)}.\n-- Do not edit here. A later library migration becomes a new numbered file.\n\n`;
writeFileSync(migration, header + schema);
console.log(`vendor: Collab Library (${source(libraryDir)}) → vendor/collab-library/ and supabase/migrations/0002_collab_library.sql`);
// The library's later migrations, each at the number it took in this app's sequence.
const LATER = { '0002_tape_shape.sql': '0004_collab_library_tape_shape.sql' };
for (const [from, to] of Object.entries(LATER)) {
  const src = join(libraryDir, 'migrations', from);
  if (!existsSync(src)) continue;
  const head = `-- Vendored from collab-library/migrations/${from} at ${source(libraryDir)}.\n-- Do not edit here.\n\n`;
  writeFileSync(join(appDir, 'supabase', 'migrations', to), head + readFileSync(src, 'utf8'));
  console.log(`vendor: collab-library/migrations/${from} → supabase/migrations/${to}`);
}

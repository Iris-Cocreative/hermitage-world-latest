/**
 * Copies the static site (the repository root) into public/, so `next dev`
 * and `next build` serve the whole site next to the app routes.
 *
 * public/ is generated and gitignored. Edit the site at the repository root,
 * never in public/. App-owned static files live in static/ and are copied
 * last, so they win over anything of the same name.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const siteDir = resolve(appDir, '..');
const outDir = join(appDir, 'public');

// Folders and files at the site root that are not part of the served site.
const SKIP_DIRS = new Set(['app', 'docs', 'node_modules', '.git', '.impeccable', '.playwright-mcp']);
const SKIP_FILES = new Set(['404.html']); // GitHub Pages' 404 carries /hermitage-world/ paths; the app has not-found.tsx
const SKIP_EXT = new Set(['.md', '.zip', '.py', '.blend']);

function keep(path) {
  const rel = path.slice(siteDir.length + 1);
  if (!rel) return true;
  const top = rel.split(/[\/]/)[0];
  if (SKIP_DIRS.has(top)) return false;
  const name = basename(path);
  if (name.startsWith('.')) return false;
  if (statSync(path).isDirectory()) return name !== 'local'; // print/**/local, scenes/**/local hold client files
  if (SKIP_FILES.has(rel)) return false;
  return !SKIP_EXT.has(extname(name).toLowerCase());
}

if (!existsSync(join(siteDir, 'index.html')) || !existsSync(join(siteDir, 'assets', 'js', 'site.js'))) {
  console.error('sync-site: the static site was not found at ' + siteDir);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let files = 0;
for (const entry of readdirSync(siteDir)) {
  const src = join(siteDir, entry);
  if (!keep(src)) continue;
  cpSync(src, join(outDir, entry), {
    recursive: true,
    filter: (p) => keep(p),
  });
  files++;
}

const staticDir = join(appDir, 'static');
if (existsSync(staticDir)) cpSync(staticDir, outDir, { recursive: true });

console.log(`sync-site: ${files} root entries copied from ${siteDir} into public/`);


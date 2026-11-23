/**
 * Stamps every page's links to the site's own CSS and JS with ?v=<stamp>, so
 * a deploy is never shown with a stale stylesheet from the browser's cache
 * (GitHub Pages serves assets with max-age=600 and no hashed names).
 *
 *   node tools/stamp-assets.mjs            stamp = now (YYYYMMDDHHmm, UTC)
 *   node tools/stamp-assets.mjs 2026a      a stamp of your choosing
 *
 * Run it before pushing a change to anything under assets/. It touches only
 * href/src attributes that point into assets/ and end in .css or .js, in the
 * static pages (not app/, which Next.js fingerprints itself).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const stamp = process.argv[2] || new Date().toISOString().replace(/\D/g, '').slice(0, 12)
const skip = new Set(['app', 'node_modules', '.git', '.tools'])
const link = /((?:href|src)="(?:\.\.\/|\.\/)*assets\/[^"?#]+\.(?:css|js))(?:\?v=[^"#]*)?"/g

let pages = 0, links = 0
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (!skip.has(name)) walk(p); continue }
    if (!name.endsWith('.html')) continue
    const before = readFileSync(p, 'utf8')
    let n = 0
    const after = before.replace(link, (_, a) => { n++; return `${a}?v=${stamp}"` })
    if (after !== before) { writeFileSync(p, after); pages++; links += n }
  }
}
walk(root)
console.log(`stamp-assets: ?v=${stamp} on ${links} links in ${pages} pages`)

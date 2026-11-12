// Erzeugt sitemap.xml mit echtem lastmod.
//
//   npm run seo:sitemap          → sitemap.xml und seo/sitemap-state.json aktualisieren
//   node scripts/build-sitemap.mjs --check   → nur prüfen (für seo:check / CI)
//
// lastmod ist das Datum der letzten inhaltlichen Änderung einer Seite, nicht das Build-Datum.
// Dafür wird je Seite ein Fingerabdruck aus Title, Description, Canonical, Meta-Robots, JSON-LD
// und <main> gebildet und in seo/sitemap-state.json gespeichert. Ändert er sich, wird lastmod
// auf das heutige Datum gesetzt. Kopf, Fuß, CSS-/JS-Versionen zählen nicht als Inhalt.
// Seiten mit Gegenstück in der anderen Sprache bekommen hreflang-Alternates (de, en, x-default = de).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ORIGIN, PAGES, read, today, getTitle, getMeta, getCanonical, getMain, getJsonLd } from './lib.mjs';

const CHECK = process.argv.includes('--check');
const statePath = join(ROOT, 'seo', 'sitemap-state.json');
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
const next = {};
const twins = {};

const fingerprint = (html) => [
  getTitle(html), getMeta(html, 'name', 'description'), getCanonical(html), getMeta(html, 'name', 'robots'),
  ...getJsonLd(html), getMain(html),
].join('\n').replace(/\s+/g, ' ').trim();

for (const [file, path, lang, twin] of PAGES) {
  if (!path) continue;
  if (twin) twins[path] = lang === 'de' ? { de: path, en: twin } : { de: twin, en: path };
  const html = read(file);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
  const hash = createHash('sha256').update(fingerprint(html)).digest('hex').slice(0, 16);
  const prev = state[path];
  next[path] = prev && prev.hash === hash ? prev : { hash, lastmod: today() };
}

const alternates = (path) => {
  const t = twins[path];
  if (!t) return '';
  return [['de', t.de], ['en', t.en], ['x-default', t.de]]
    .map(([hl, p]) => `\n    <xhtml:link rel="alternate" hreflang="${hl}" href="${ORIGIN}${p}"/>`).join('');
};
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...Object.entries(next).map(([path, { lastmod }]) => `  <url><loc>${ORIGIN}${path}</loc><lastmod>${lastmod}</lastmod>${alternates(path)}\n  </url>`),
  '</urlset>',
  '',
].join('\n');
const stateJson = JSON.stringify(next, null, 2) + '\n';

if (CHECK) {
  const current = existsSync(join(ROOT, 'sitemap.xml')) ? read('sitemap.xml') : '';
  const currentState = existsSync(statePath) ? readFileSync(statePath, 'utf8') : '';
  if (current !== xml || currentState !== stateJson) {
    console.error('✖ sitemap.xml ist nicht aktuell – „npm run seo:sitemap“ ausführen und mit committen.');
    process.exit(1);
  }
  console.log(`✔ sitemap.xml aktuell (${Object.keys(next).length} Adressen)`);
} else {
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
  writeFileSync(statePath, stateJson);
  for (const [path, { lastmod }] of Object.entries(next)) console.log(`${lastmod}  ${ORIGIN}${path}`);
}

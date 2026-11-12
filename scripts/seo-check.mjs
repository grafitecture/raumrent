// Statische SEO- und Technik-Prüfung der Website-Dateien (ohne Netzwerk, ohne Abhängigkeiten).
//
//   npm run seo:check
//
// Bricht mit Exit-Code 1 ab, wenn ein Fehler gefunden wird. Hinweise (⚠) brechen nicht ab.
// Prüft: interne Links, je Seite Title/Description/H1/Canonical/lang/alt/Open Graph/JSON-LD/noindex,
// Mehrsprachigkeit (hreflang gegenseitig, Sprachumschalter, keine deutschen Inhaltslinks auf englischen Seiten),
// Sitemap, robots.txt, vercel.json, Redirect-Map, security.txt, llms.txt, IndexNow-Schlüssel.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  ROOT, ORIGIN, PAGES, LANGS, DE_ONLY_TARGETS, NOINDEX_WHITELIST, read, isFile, parseCsv, resolvePath,
  decode, getTitle, getMeta, getCanonical, getJsonLd,
} from './lib.mjs';

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// ---------- 1 Interne Links ----------
function checkUrl(where, raw, ids) {
  let u;
  try { u = new URL(raw, ORIGIN + '/'); } catch { return err(where, `ungültige Adresse ${raw}`); }
  if (u.origin !== ORIGIN) return; // extern
  const r = resolvePath(u.pathname);
  if (!r) return err(where, `Link ins Leere: ${raw}`);
  if (r.redirect) return err(where, `Link auf Weiterleitung: ${raw} → ${r.redirect} (direkt verlinken)`);
  if (u.hash && r.file.endsWith('.html')) {
    const target = ids.get(r.file) || new Set();
    if (!target.has(decodeURIComponent(u.hash.slice(1)))) err(where, `Anker fehlt: ${raw}`);
  }
}
const htmlFiles = PAGES.map(([f]) => f);
const sources = new Map(htmlFiles.map((f) => [f, read(f)]));
const ids = new Map([...sources].map(([f, html]) => [f, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
for (const [f, html] of sources) {
  const refs = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => decode(m[1])),
    ...[...html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
    ...[...html.matchAll(/<meta property="og:(?:url|image)" content="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !ids.get(f).has(ref.slice(1))) err(f, `Anker fehlt: ${ref}`);
      continue;
    }
    if (ref === `${ORIGIN}/404`) continue; // og:url der 404-Seite
    checkUrl(f, ref, ids);
  }
  // <use href="#…"> im SVG-Sprite sind Anker auf derselben Seite (oben schon geprüft)
}

// ---------- 2 Seiten ----------
const seen = { title: new Map(), desc: new Map() };
let orgNode = null;
const assetVersions = new Set();
const langOfPath = new Map(PAGES.filter(([, p]) => p).map(([, p, l]) => [p, l]));
for (const [file, path, lang, twin] of PAGES) {
  const html = sources.get(file);
  const L = LANGS[lang];
  const indexable = path !== null;
  const where = file;
  const title = getTitle(html);
  const desc = getMeta(html, 'name', 'description');
  const robots = getMeta(html, 'name', 'robots');
  const canonical = getCanonical(html);

  if (!html.includes(`<html lang="${L.htmlLang}">`)) err(where, `<html lang="${L.htmlLang}"> fehlt`);
  if (getMeta(html, 'property', 'og:locale') !== L.ogLocale) err(where, `og:locale ≠ ${L.ogLocale}`);

  // Sprachumschalter: DE- und EN-Link auf dieselbe Seite in der anderen Sprache (sonst Startseite), aktuelle Sprache markiert
  // (im Kopf als nav.lang „DE | EN“, im mobilen Menü als p.mnav__lang „Deutsch English“)
  for (const [name, re] of [['Kopf', /<nav class="lang"[^>]*>([\s\S]*?)<\/nav>/], ['Menü', /<p class="mnav__lang">([\s\S]*?)<\/p>/]]) {
    const sw = (html.match(re) || [])[1];
    if (!sw) { err(where, `Sprachumschalter (${name}) fehlt`); continue; }
    const self = path ?? '/';
    const want = { de: lang === 'de' ? self : (twin ?? LANGS.de.home), en: lang === 'en' ? self : (twin ?? LANGS.en.home) };
    for (const code of ['de', 'en']) {
      const a = sw.match(new RegExp(`<a href="([^"]*)" hreflang="${code}" lang="${code}"( aria-current="true")?>`));
      if (!a) err(where, `Sprachumschalter ${name}: ${code.toUpperCase()}-Link fehlt`);
      else {
        if (a[1] !== want[code]) err(where, `Sprachumschalter ${name}: ${code.toUpperCase()} zeigt auf ${a[1]} statt ${want[code]}`);
        if (Boolean(a[2]) !== (code === lang)) err(where, `Sprachumschalter ${name}: aria-current bei ${code.toUpperCase()} falsch`);
      }
    }
  }
  if (sources.get(file).match(/navigator\.language|Accept-Language/)) err(where, 'keine automatische Sprachweiterleitung');

  // Englische Seiten verlinken keine deutschen Inhaltsseiten (außer Rechtstexte/PDFs, die es nur deutsch gibt)
  if (lang === 'en') {
    const main = html.replace(/<nav class="lang"[\s\S]*?<\/nav>/, '').replace(/<p class="mnav__lang">[\s\S]*?<\/p>/, '');
    for (const m of main.matchAll(/\shref="(\/[^"#?]*)/g)) {
      const p = m[1] === '' ? '/' : m[1];
      if (langOfPath.get(p) === 'de' && !DE_ONLY_TARGETS.some((t) => p.startsWith(t))) err(where, `englische Seite verlinkt deutsche Seite ${p}`);
    }
    for (const t of DE_ONLY_TARGETS.filter((t) => !t.endsWith('/'))) {
      for (const m of main.matchAll(new RegExp(`<a href="${t}"([^>]*)>`, 'g'))) if (!m[1].includes('hreflang="de"')) err(where, `Link auf ${t} ohne hreflang="de"`);
    }
  }

  // hreflang: nur bei Seiten mit Gegenstück, gegenseitig, inkl. x-default (= deutsche Fassung)
  const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]));
  if (path && twin) {
    const de = ORIGIN + (lang === 'de' ? path : twin);
    const en = ORIGIN + (lang === 'en' ? path : twin);
    if (alts.de !== de || alts.en !== en || alts['x-default'] !== de) err(where, `hreflang unvollständig oder falsch (erwartet de=${de}, en=${en}, x-default=${de})`);
    const other = PAGES.find(([, p]) => p === twin);
    if (!other) err(where, `Gegenstück ${twin} fehlt in PAGES`);
    else if (other[3] !== path) err(where, `Gegenstück ${twin} verweist nicht zurück`);
  } else if (Object.keys(alts).length) err(where, 'hreflang auf einer Seite ohne Gegenstück');
  if (!/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html)) err(where, 'Viewport-Meta fehlt');
  if (/<meta name="keywords"/.test(html)) err(where, 'meta keywords ist verboten');
  if (/http-equiv="refresh"/i.test(html)) err(where, 'Meta-Refresh ist verboten');

  // noindex
  const isNoindex = /noindex/.test(robots);
  if (isNoindex && !NOINDEX_WHITELIST.includes(file)) err(where, 'noindex auf einer Seite außerhalb der Whitelist');
  if (!indexable && !isNoindex) err(where, 'nicht indexierbare Seite ohne noindex');

  // Überschriften
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(where, `${h1} × <h1> statt genau einer`);
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (prev && lvl > prev + 1) err(where, `Überschriften-Sprung h${prev} → h${lvl}`);
    prev = lvl;
  }

  // Bilder
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) err(where, `Bild ohne alt: ${tag.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) err(where, `Bild ohne width/height: ${tag.slice(0, 80)}`);
  }

  // Links in neuem Fenster
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) err(where, 'target="_blank" ohne rel="noopener"');
  }

  // Asset-Versionen
  for (const m of html.matchAll(/\/assets\/(?:css|js)\/[^"?]+\?v=\d+/g)) assetVersions.add(m[0]);

  // Open Graph
  const ogImage = getMeta(html, 'property', 'og:image');
  if (!/^https:\/\//.test(ogImage)) err(where, 'og:image fehlt oder ist nicht absolut');
  if (!getMeta(html, 'property', 'og:image:alt')) warn(where, 'og:image:alt fehlt');
  if (getMeta(html, 'name', 'twitter:card') !== 'summary_large_image') err(where, 'twitter:card fehlt');

  if (!indexable) continue;

  // Title & Description
  if (!title) err(where, 'Title fehlt');
  else {
    if (seen.title.has(title)) err(where, `Title doppelt (auch in ${seen.title.get(title)})`);
    seen.title.set(title, file);
    if (title.length > 70) err(where, `Title zu lang (${title.length} Zeichen)`);
    else if (title.length > 62 || title.length < 30) warn(where, `Title ${title.length} Zeichen (Ziel ca. 50–60)`);
  }
  if (!desc) err(where, 'Description fehlt');
  else {
    if (seen.desc.has(desc)) err(where, `Description doppelt (auch in ${seen.desc.get(desc)})`);
    seen.desc.set(desc, file);
    if (desc.length > 170 || desc.length < 70) err(where, `Description ${desc.length} Zeichen (Ziel 140–160)`);
    else if (desc.length > 162 || desc.length < 120) warn(where, `Description ${desc.length} Zeichen (Ziel 140–160)`);
  }
  if (!/max-image-preview:large/.test(robots)) warn(where, 'meta robots ohne max-image-preview:large');
  if (getMeta(html, 'property', 'og:title') !== title) err(where, 'og:title weicht vom Title ab');
  if (getMeta(html, 'property', 'og:description') !== desc) err(where, 'og:description weicht von der Description ab');

  // Canonical
  const want = ORIGIN + path;
  if (canonical !== want) err(where, `Canonical ${canonical || '(fehlt)'} statt ${want}`);
  if (getMeta(html, 'property', 'og:url') !== want) err(where, 'og:url weicht vom Canonical ab');

  // JSON-LD
  const blocks = getJsonLd(html);
  if (!blocks.length) err(where, 'JSON-LD fehlt');
  for (const raw of blocks) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { err(where, `JSON-LD nicht lesbar: ${e.message}`); continue; }
    const graph = data['@graph'] || [data];
    const org = graph.find((n) => n['@id'] === `${ORIGIN}/#organization`);
    if (!org) err(where, 'JSON-LD ohne #organization');
    else if (orgNode === null) orgNode = JSON.stringify(org);
    else if (JSON.stringify(org) !== orgNode) err(where, 'JSON-LD #organization weicht von den anderen Seiten ab (überall gleich halten)');
    const page = graph.find((n) => n['@id'] === `${want}#webpage`);
    if (!page) err(where, 'JSON-LD ohne WebPage-Knoten');
    else {
      if (page.url !== want) err(where, 'JSON-LD WebPage.url ≠ Canonical');
      if (page.name !== title) err(where, 'JSON-LD WebPage.name ≠ Title');
      if (page.description !== desc) err(where, 'JSON-LD WebPage.description ≠ Description');
      if (page.inLanguage !== L.inLanguage) err(where, `JSON-LD WebPage.inLanguage ≠ ${L.inLanguage}`);
    }
    if (path !== L.home && !graph.some((n) => n['@type'] === 'BreadcrumbList')) err(where, 'JSON-LD ohne BreadcrumbList');
    if (graph.some((n) => ['AggregateRating', 'Review', 'HowTo'].includes(n['@type']) || n.aggregateRating || n.review)) err(where, 'JSON-LD mit Bewertungen/HowTo ist nicht erlaubt');
  }
}
if (assetVersions.size > 2) err('HTML', `uneinheitliche CSS/JS-Versionen: ${[...assetVersions].join(', ')}`);

// ---------- 3 Sitemap ----------
const sm = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build-sitemap.mjs'), '--check'], { encoding: 'utf8' });
if (sm.status !== 0) err('sitemap.xml', (sm.stderr || sm.stdout).trim());
const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  const page = PAGES.find(([, p]) => p && ORIGIN + p === loc);
  if (!page) err('sitemap.xml', `Adresse ohne Seite: ${loc}`);
}
for (const [file, path] of PAGES) {
  if (path && !locs.includes(ORIGIN + path)) err('sitemap.xml', `indexierbare Seite fehlt: ${ORIGIN + path} (${file})`);
}
if (/<(priority|changefreq)>/.test(read('sitemap.xml'))) warn('sitemap.xml', 'priority/changefreq weglassen');

// ---------- 4 robots.txt ----------
const robotsTxt = read('robots.txt');
if (/^\s*Disallow:\s*\/\s*$/m.test(robotsTxt)) err('robots.txt', '„Disallow: /“ auf Produktion');
if (!new RegExp(`^Sitemap: ${ORIGIN}/sitemap\\.xml$`, 'm').test(robotsTxt)) err('robots.txt', 'Sitemap-Zeile fehlt oder ist nicht absolut');
for (const ua of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) {
  if (!new RegExp(`^User-agent: ${ua}$`, 'm').test(robotsTxt)) warn('robots.txt', `keine eigene Gruppe für ${ua}`);
}

// ---------- 5 vercel.json ----------
let vercel = {};
try { vercel = JSON.parse(read('vercel.json')); } catch (e) { err('vercel.json', `nicht lesbar: ${e.message}`); }
if ('trailingSlash' in vercel) err('vercel.json', '„trailingSlash“ nicht setzen – die eigene Slash-Regel sorgt für einen Hop');
for (const r of vercel.redirects || []) {
  const dest = r.destination;
  if (r.permanent !== true && !r.statusCode) warn('vercel.json', `Redirect ${r.source} ist nicht dauerhaft`);
  if (dest.startsWith(ORIGIN) && !dest.includes(':')) {
    const p = new URL(dest).pathname;
    const res = resolvePath(p);
    if (!res || res.redirect) err('vercel.json', `Redirect-Ziel ${dest} existiert nicht oder leitet weiter`);
  } else if (!dest.startsWith(ORIGIN)) err('vercel.json', `Redirect-Ziel nicht absolut auf ${ORIGIN}: ${dest}`);
}
for (const r of vercel.rewrites || []) {
  if (r.destination === '/api/gone' && !isFile('api/gone.js')) err('vercel.json', 'api/gone.js fehlt');
}
const globalHeaders = ((vercel.headers || []).find((h) => h.source === '/(.*)') || { headers: [] }).headers.map((h) => h.key.toLowerCase());
for (const h of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options']) {
  if (!globalHeaders.includes(h)) err('vercel.json', `Header ${h} fehlt`);
}

// ---------- 6 Redirect-Map ----------
const map = parseCsv(read('seo/redirect-map.csv'));
const alts = new Set();
for (const row of map) {
  const where = `redirect-map.csv ${row.alt}`;
  if (alts.has(row.alt)) err(where, 'doppelt');
  alts.add(row.alt);
  if (!/^(301|308|410|404|403)(\|(301|308|410|404|403))*$/.test(row.status)) err(where, `Status ${row.status} ungültig`);
  if (/^30[18]/.test(row.status)) {
    if (!row.neu) err(where, 'Ziel fehlt');
    else {
      const p = new URL(row.neu, ORIGIN).pathname;
      const res = resolvePath(p);
      if (!res || res.redirect) err(where, `Ziel ${row.neu} existiert nicht oder leitet weiter`);
    }
    if (row.neu === '/' && !['/index.php', '/index.html'].includes(row.alt) && !/^https?:/.test(row.alt)) warn(where, 'Weiterleitung auf die Startseite – inhaltlich passendes Ziel oder 410 prüfen');
  }
}

// ---------- 7 security.txt, llms.txt, IndexNow ----------
if (!isFile('.well-known/security.txt')) err('security.txt', 'fehlt');
else {
  const sec = read('.well-known/security.txt');
  const exp = (sec.match(/^Expires: (.+)$/m) || [])[1];
  if (!/^Contact: /m.test(sec)) err('security.txt', 'Contact fehlt');
  if (!exp) err('security.txt', 'Expires fehlt');
  else {
    const days = (new Date(exp) - Date.now()) / 864e5;
    if (days < 0) err('security.txt', `abgelaufen seit ${exp}`);
    else if (days < 60) warn('security.txt', `läuft am ${exp.slice(0, 10)} ab – Datum verlängern`);
  }
}
if (!isFile('llms.txt')) warn('llms.txt', 'fehlt');
else for (const m of read('llms.txt').matchAll(/\]\((https?:[^)]+)\)/g)) checkUrl('llms.txt', m[1], ids);
const keys = readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keys.length !== 1) err('IndexNow', `${keys.length} Schlüsseldateien statt einer`);
else if (read(keys[0]).trim() !== keys[0].slice(0, -4)) err('IndexNow', 'Schlüsseldatei enthält nicht ihren eigenen Namen');

// ---------- Ausgabe ----------
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✖ ${e}`);
console.log(`\n${errors.length ? '✖' : '✔'} SEO-Check: ${PAGES.length} HTML-Dateien, ${locs.length} Sitemap-Adressen, ${map.length} Redirect-Zeilen – ${errors.length} Fehler, ${warnings.length} Hinweise`);
process.exit(errors.length ? 1 : 0);

// Gemeinsame Hilfen für die SEO-Skripte (nur Node-Bordmittel, keine Abhängigkeiten).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://www.raumrent.de';

// Alle HTML-Seiten der Website: [Datei im Repo, öffentliche Adresse, Sprache, Gegenstück in der anderen Sprache]
// Adresse null = nicht indexierbar. Gegenstück null = Seite gibt es nur in dieser Sprache.
export const PAGES = [
  ['index.html', '/', 'de', '/en'],
  ['buerocontainer/index.html', '/buerocontainer', 'de', '/en/office-containers'],
  ['lager-und-seecontainer/index.html', '/lager-und-seecontainer', 'de', '/en/storage-and-shipping-containers'],
  ['sanitaercontainer/index.html', '/sanitaercontainer', 'de', '/en/sanitary-containers'],
  ['containeranlagen/index.html', '/containeranlagen', 'de', '/en/container-buildings'],
  ['kontakt/index.html', '/kontakt', 'de', '/en/contact'],
  ['impressum/index.html', '/impressum', 'de', null],
  ['datenschutz/index.html', '/datenschutz', 'de', null],
  ['en/index.html', '/en', 'en', '/'],
  ['en/office-containers/index.html', '/en/office-containers', 'en', '/buerocontainer'],
  ['en/storage-and-shipping-containers/index.html', '/en/storage-and-shipping-containers', 'en', '/lager-und-seecontainer'],
  ['en/sanitary-containers/index.html', '/en/sanitary-containers', 'en', '/sanitaercontainer'],
  ['en/container-buildings/index.html', '/en/container-buildings', 'en', '/containeranlagen'],
  ['en/contact/index.html', '/en/contact', 'en', '/kontakt'],
  ['404.html', null, 'de', null], // nicht indexierbar, zweisprachig
];

// Sprachen: Kennung im HTML (lang), Open-Graph-Locale, Startseite
export const LANGS = {
  de: { htmlLang: 'de', ogLocale: 'de_DE', inLanguage: 'de-DE', home: '/' },
  en: { htmlLang: 'en', ogLocale: 'en_GB', inLanguage: 'en-GB', home: '/en' },
};
// Deutsche Seiten, auf die englische Seiten bewusst verlinken dürfen (gibt es nur auf Deutsch)
export const DE_ONLY_TARGETS = ['/impressum', '/datenschutz', '/downloads/'];

// Seiten, die bewusst noindex tragen dürfen
export const NOINDEX_WHITELIST = ['404.html'];

export const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
export const isFile = (rel) => existsSync(join(ROOT, rel)) && statSync(join(ROOT, rel)).isFile();

// Einfacher CSV-Leser (Komma, optional "…" mit "" als Escape)
export function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

// Löst einen internen Pfad wie Vercel (cleanUrls, ohne Slash) auf eine Datei auf.
// Ergebnis: { file } wenn direkt ausgeliefert, { redirect } wenn Vercel weiterleiten würde, oder null.
export function resolvePath(pathname) {
  let p = decodeURIComponent(pathname);
  if (p === '/') return { file: 'index.html' };
  if (p.endsWith('/')) return { redirect: p.replace(/\/+$/, '') };
  if (/\/index(\.html)?$/.test(p)) return { redirect: p.replace(/\/index(\.html)?$/, '') || '/' };
  if (p.endsWith('.html')) return { redirect: p.slice(0, -5) };
  const rel = p.slice(1);
  if (isFile(rel)) return { file: rel };
  if (isFile(`${rel}/index.html`)) return { file: `${rel}/index.html` };
  if (isFile(`${rel}.html`)) return { file: `${rel}.html` };
  return null;
}

// Heutiges Datum in Deutschland als JJJJ-MM-TT
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());

// HTML-Hilfen (Regex genügt für dieses handgeschriebene, gleichförmige Markup)
export const decode = (s) => s
  .replace(/&shy;/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
export const getTitle = (html) => decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
export const getMeta = (html, attr, name) => {
  const re = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`);
  return decode((html.match(re) || [])[1] || '');
};
export const getCanonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
export const getMain = (html) => (html.match(/<main[\s\S]*?<\/main>/) || [''])[0];
export const getJsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);

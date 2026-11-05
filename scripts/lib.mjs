// Gemeinsame Hilfen für die SEO-Skripte (nur Node-Bordmittel, keine Abhängigkeiten).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://www.raumrent.de';

// Alle HTML-Seiten der Website: Pfad im Repo → öffentliche Adresse
export const PAGES = [
  ['index.html', '/'],
  ['buerocontainer/index.html', '/buerocontainer'],
  ['lager-und-seecontainer/index.html', '/lager-und-seecontainer'],
  ['sanitaercontainer/index.html', '/sanitaercontainer'],
  ['containeranlagen/index.html', '/containeranlagen'],
  ['kontakt/index.html', '/kontakt'],
  ['impressum/index.html', '/impressum'],
  ['datenschutz/index.html', '/datenschutz'],
  ['404.html', null], // nicht indexierbar
];

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

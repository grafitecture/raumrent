// raumrent.de – Vorschau für die Claude-Seitenleiste (Artifact)
//
// Baut die ganze Website als EINE Datei: tools/vorschau/index.html.
// Öffentlich teilen lässt sich ein Artifact nur als einzelne, in sich geschlossene Seite, deshalb:
// - alle acht Seiten in einer Datei, umgeschaltet über Anker (#buerocontainer, #kontakt?interesse=buero …);
//   Zurück-Taste und Direktlinks wie …/artifact/<id>#kontakt funktionieren
// - CSS, JavaScript, Schrift (Noto Sans, latin) und Bilder (WebP, je Motiv einmal) eingebettet
// - PDFs zeigen auf die öffentlichen Adressen der bisherigen Seite (Chrome zeigt PDFs im Artifact-Rahmen nicht an)
// - schmaler Hinweis „Vorschau der neuen Website · Stand <Datum>“ über der Kopfzeile
// Die Website selbst bleibt unverändert.
//
// Aufruf im Repo-Ordner:  node tools/vorschau.mjs

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', 'vorschau');

// Name des Artifacts in der Seitenleiste – nicht ändern, sonst wechselt der Name
const TITLE = 'raumrent.de';

// Seiten der Vorschau: Anker → Datei
const ROUTES = {
  start: 'index.html',
  buerocontainer: 'buerocontainer/index.html',
  'lager-und-seecontainer': 'lager-und-seecontainer/index.html',
  sanitaercontainer: 'sanitaercontainer/index.html',
  containeranlagen: 'containeranlagen/index.html',
  kontakt: 'kontakt/index.html',
  impressum: 'impressum/index.html',
  datenschutz: 'datenschutz/index.html',
};

// Alte WordPress-Adressen der PDFs: gelten vor dem Livegang und danach (Weiterleitung in vercel.json)
const PDF_BASE = 'https://www.raumrent.de/wp-content/uploads/2025/05/';

// Bildbreite in der Vorschau: die größte vorhandene WebP-Variante bis 1600 px
const IMG_WIDTHS = [1600, 1200, 800];

const PREVIEW_CSS = `
/* Nur Vorschau (Artifact) */
.site-header{top:env(safe-area-inset-top,0px)}
.mnav{top:calc(var(--header-h) + env(safe-area-inset-top,0px))}
main[data-route][hidden]{display:none!important}
main[data-route]:focus{outline:none}
img[data-img]:not([src]){visibility:hidden}
.vorschau-hinweis{margin:0;padding:var(--space-2xs) var(--gutter);background:var(--blue-tint);color:var(--ink);font-size:var(--fs-small);text-align:center}
body.menu-open .vorschau-hinweis{display:none}
`;

// Läuft im Browser: setzt die Bilder ein und schaltet die Seiten über den Anker um
function vorschau() {
  for (const img of document.querySelectorAll('img[data-img]')) img.src = BILDER[img.dataset.img];

  const mains = [...document.querySelectorAll('main[data-route]')];
  const routes = new Map(mains.map((m) => [m.dataset.route, m]));
  const navLinks = [...document.querySelectorAll('.site-header nav a, .site-header .header-cta, .mnav nav a, .site-footer ul a')];
  const skip = document.querySelector('.skip-link');
  let current = '';

  const show = (name) => {
    if (name === current) return;
    current = name;
    for (const m of mains) m.hidden = m.dataset.route !== name;
    document.title = routes.get(name).dataset.title;
    if (skip) skip.setAttribute('href', `#${routes.get(name).id}`);
    for (const a of navLinks) {
      const target = (a.getAttribute('href') || '').slice(1).split('?')[0];
      if (target === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  };

  const go = () => {
    let raw = '';
    try { raw = decodeURIComponent(location.hash.slice(1)); } catch { raw = ''; }
    const [key, query = ''] = raw.split('?');
    if (!key || routes.has(key)) {
      show(key || 'start');
      const pre = new URLSearchParams(query).get('interesse');
      if (pre) {
        for (const box of document.querySelectorAll('input[name="interesse"]')) box.checked = box.dataset.key === pre;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const target = document.getElementById(key);
    const owner = target && target.closest('main[data-route]');
    show(owner ? owner.dataset.route : 'start');
    if (target) target.scrollIntoView({ behavior: 'instant' });
  };

  window.addEventListener('hashchange', go);
  go();
}

const read = (p) => readFile(join(ROOT, p), 'utf8');
const base64 = async (p) => (await readFile(join(ROOT, p))).toString('base64');
const pick = (html, re, what) => {
  const m = html.match(re);
  if (!m) throw new Error(`${what} nicht gefunden`);
  return m[1] ?? m[0];
};
const problems = [];

// Gemeinsame Teile aus der Startseite (auf allen Seiten gleich, siehe CLAUDE.md)
const index = await read('index.html');
const shared = (re, what) => pick(index, re, what).replace(/ aria-current="page"/g, '');
// Sprunglink zeigt auf den Hauptbereich der sichtbaren Seite (das Skript setzt ihn beim Umschalten neu)
const skipLink = shared(/<a class="skip-link"[^>]*>[^<]*<\/a>/, 'Sprunglink').replace('href="#inhalt"', 'href="#inhalt--start"');
const sprite = shared(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" class="sprite"[\s\S]*?<\/svg>/, 'SVG-Sprite');
const header = shared(/<header class="site-header">[\s\S]*?<\/header>/, 'Kopfzeile');
const mnav = shared(/<div class="mnav" id="mnav" hidden>[\s\S]*?\n<\/div>/, 'mobiles Menü');
const footer = shared(/<footer class="site-footer">[\s\S]*?<\/footer>/, 'Fuß');

// Hauptbereich und Titel jeder Seite
const pages = {};
for (const [route, file] of Object.entries(ROUTES)) {
  const html = await read(file);
  pages[route] = {
    title: pick(html, /<title>([^<]*)<\/title>/, `Titel in ${file}`),
    main: pick(html, /<main[\s\S]*?<\/main>/, `<main> in ${file}`),
  };
}

// IDs, die auf mehreren Seiten vorkommen oder wie eine Seite heißen, je Seite eindeutig machen
const count = {};
for (const { main } of Object.values(pages)) {
  for (const [, id] of main.matchAll(/\sid="([^"]+)"/g)) count[id] = (count[id] || 0) + 1;
}
for (const [route, page] of Object.entries(pages)) {
  const ids = [...page.main.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const clash = new Set(ids.filter((id) => count[id] > 1 || Object.hasOwn(ROUTES, id)));
  const ren = (id) => (clash.has(id) ? `${id}--${route}` : id);
  page.main = page.main
    .replace(/(\s(?:id|for|aria-controls)=")([^"]+)"/g, (m, attr, id) => `${attr}${ren(id)}"`)
    .replace(/(\saria-(?:labelledby|describedby)=")([^"]+)"/g, (m, attr, list) => `${attr}${list.split(/\s+/).map(ren).join(' ')}"`)
    .replace(/(\shref="#)([^"]+)"/g, (m, attr, id) => `${attr}${ren(id)}"`)
    .replace(/^<main([^>]*)>/, (m, attrs) =>
      `<main${attrs} tabindex="-1" data-route="${route}" data-title="${page.title}"${route === 'start' ? '' : ' hidden'}>`);
}

const stand = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
let body = [
  skipLink,
  sprite,
  `<p class="vorschau-hinweis">Vorschau der neuen Website · Stand ${stand}</p>`,
  header,
  mnav,
  ...Object.values(pages).map((p) => p.main),
  footer,
].join('\n');

// Links: PDFs nach außen, Seiten auf Anker
body = body
  .replace(/href="\/downloads\/([^"]+\.pdf)"/g, `href="${PDF_BASE}$1" target="_blank" rel="noopener"`)
  .replace(/href="\/(#[^"]*)?"/g, (m, hash) => `href="${hash || '#start'}"`)
  .replace(/href="\/([a-z-]+)(\?[^"#]*)?(#[^"]*)?"/g, (m, slug, query = '', hash = '') => {
    if (!Object.hasOwn(ROUTES, slug)) return m;
    return hash ? `href="${hash}"` : `href="#${slug}${query}"`;
  });

// Bilder: <source> entfällt, <img> bekommt das Motiv als data-img (eingesetzt vom Skript)
const motifs = new Set();
body = body
  .replace(/<source [^>]*>/g, '')
  .replace(/<img ([^>]*)>/g, (m, attrs) => {
    const src = attrs.match(/\bsrc="\/assets\/img\/([a-z0-9-]+)-\d+\.webp"/);
    if (!src) { problems.push(`Bild ohne WebP-Quelle: ${m.slice(0, 120)}`); return m; }
    motifs.add(src[1]);
    return `<img data-img="${src[1]}" ${attrs.replace(/\s*\b(?:src|srcset|sizes)="[^"]*"/g, '').trim()}>`;
  });

const images = {};
for (const name of [...motifs].sort()) {
  const width = IMG_WIDTHS.find((w) => existsSync(join(ROOT, `assets/img/${name}-${w}.webp`)));
  if (!width) { problems.push(`kein WebP für ${name}`); continue; }
  images[name] = `data:image/webp;base64,${await base64(`assets/img/${name}-${width}.webp`)}`;
}

// CSS mit eingebetteter Schrift (latin genügt für deutsche Texte)
let css = await read('assets/css/site.css');
css = css
  .replace(/@font-face\{[^}]*noto-sans-v42-latin-ext\.woff2[^}]*\}\n?/, '')
  .replace('url("../fonts/noto-sans-v42-latin.woff2")', `url("data:font/woff2;base64,${await base64('assets/fonts/noto-sans-v42-latin.woff2')}")`);
if (/url\(\s*["']?\.\.\//.test(css)) problems.push('CSS verweist noch auf Dateien');

// Prüfen: keine Pfade mehr, jeder Anker hat ein Ziel
for (const m of body.matchAll(/\b(?:href|src|srcset)="(\/[^"]*)"/g)) problems.push(`Pfad übrig: ${m[1]}`);
const allIds = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [, ref] of body.matchAll(/\shref="#([^"]*)"/g)) {
  const key = ref.split('?')[0];
  if (!Object.hasOwn(ROUTES, key) && !allIds.has(key)) problems.push(`Anker ohne Ziel: #${ref}`);
}
for (const [, list] of body.matchAll(/\saria-(?:labelledby|describedby)="([^"]+)"/g)) {
  for (const id of list.split(/\s+/)) if (!allIds.has(id)) problems.push(`aria-Verweis ohne Ziel: ${id}`);
}
const dupes = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, all) => all.indexOf(id) !== i);
if (dupes.length) problems.push(`doppelte IDs: ${[...new Set(dupes)].join(', ')}`);

if (problems.length) {
  console.error(`Vorschau nicht gebaut:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// Startseite des Artifacts: ohne <html>/<head>/<body>, das Artifact setzt das Gerüst selbst
const page = [
  `<title>${TITLE}</title>`,
  `<script>document.documentElement.lang = 'de';</script>`,
  `<style>\n${css}${PREVIEW_CSS}</style>`,
  body,
  `<script>\n${await read('assets/js/site.js')}</script>`,
  `<script>\nconst BILDER = ${JSON.stringify(images)};\n(${vorschau})();\n</script>`,
  '',
].join('\n');

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'index.html'), page);
console.log(`Vorschau gebaut: tools/vorschau/index.html, ${(Buffer.byteLength(page) / 1048576).toFixed(1)} MB, ${Object.keys(ROUTES).length} Seiten, ${motifs.size} Bilder`);

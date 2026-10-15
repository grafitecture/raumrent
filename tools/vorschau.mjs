// raumrent.de – Vorschau für die Claude-Seitenleiste (Artifact)
//
// Baut aus der Website den Ordner tools/vorschau/, den Claude als Artifact veröffentlicht:
// - Unterseiten als flache Dateien (kontakt/index.html → kontakt.html), alle Pfade relativ
// - Startseite ohne eigenes <html>/<head>/<body>, weil das Artifact sie in ein Gerüst einbettet
// - PDFs zeigen auf die öffentlichen Adressen (Chrome zeigt PDFs im Artifact-Rahmen nicht an)
// - prüft, dass jeder Verweis auf eine Datei im Ordner zeigt
// - schreibt files.json: alle Dateien außer index.html, für den Parameter `files` beim Veröffentlichen
//
// Aufruf im Repo-Ordner:  node tools/vorschau.mjs
// Die Website selbst bleibt unverändert.

import { readFile, writeFile, mkdir, copyFile, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', 'vorschau');

// Name des Artifacts in der Seitenleiste
const TITLE = 'raumrent.de';

// Unterseiten (Ordnername = Adresse)
const PAGES = ['buerocontainer', 'lager-und-seecontainer', 'sanitaercontainer', 'containeranlagen', 'kontakt', 'impressum', 'datenschutz'];

// Alte WordPress-Adressen der PDFs: gelten vor dem Livegang und danach (Weiterleitung in vercel.json)
const PDF_BASE = 'https://www.raumrent.de/wp-content/uploads/2025/05/';

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2',
  '.avif': 'image/avif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
};

const rewrite = (html) => html
  // Favicons und Manifest braucht die Vorschau nicht
  .replace(/^<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*>\n/gm, '')
  // PDFs: öffentliche Adresse im neuen Tab
  .replace(/href="\/downloads\/([^"]+\.pdf)"/g, `href="${PDF_BASE}$1" target="_blank" rel="noopener"`)
  // Unterseiten: /kontakt, /kontakt?interesse=…, /kontakt#… → kontakt.html…
  .replace(/href="\/([a-z-]+)([?#][^"]*)?"/g, (m, slug, rest = '') => (PAGES.includes(slug) ? `href="${slug}.html${rest}"` : m))
  // Startseite: / und /#anker → index.html…
  .replace(/href="\/(#[^"]*)?"/g, (m, hash = '') => `href="index.html${hash}"`)
  // Dateien unter /assets/, auch in srcset
  .replace(/(["\s,])\/assets\//g, '$1assets/');

// Startseite als Inhalt ohne Gerüst; Titel zuerst, Kopfzeile und Menü unter der Statusleiste der Claude-App
const toFragment = (html) => {
  const head = html.match(/<head>\n([\s\S]*?)<\/head>/)[1]
    .replace(/^<meta charset[^>]*>\n/m, '')
    .replace(/^<meta name="viewport"[^>]*>\n/m, '')
    .replace(/^<title>[^<]*<\/title>\n/m, '')
    .replace(/^(<link rel="stylesheet"[^>]*>\n)/m,
      '$1<style>.site-header{top:env(safe-area-inset-top,0px)}.mnav{top:calc(var(--header-h) + env(safe-area-inset-top,0px))}</style>\n');
  const body = html.match(/<body>\n([\s\S]*?)<\/body>/)[1];
  return `<title>${TITLE}</title>\n<script>document.documentElement.lang = 'de';</script>\n${head}${body}`;
};

// Relative Verweise einer Seite (ohne Anker, Abfrage, externe Adressen, mailto:, tel:)
const refsOf = (html) => {
  const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const m of html.matchAll(/\b(?:srcset|imagesrcset)="([^"]+)"/g)) {
    urls.push(...m[1].split(',').map((part) => part.trim().split(/\s+/)[0]));
  }
  return urls.filter((u) => !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(u)).map((u) => u.replace(/[?#].*$/, ''));
};

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const pages = { 'index.html': rewrite(await readFile(join(ROOT, 'index.html'), 'utf8')) };
for (const slug of PAGES) pages[`${slug}.html`] = rewrite(await readFile(join(ROOT, slug, 'index.html'), 'utf8'));

// Benötigte Dateien: Verweise der Seiten plus url(…) im CSS
const needed = new Set();
const problems = [];
for (const [name, html] of Object.entries(pages)) {
  for (const ref of refsOf(html)) {
    if (ref.startsWith('/')) problems.push(`${name}: absoluter Pfad ${ref}`);
    else if (!ref.endsWith('.html')) needed.add(ref);
  }
}
for (const ref of [...needed]) {
  if (extname(ref) !== '.css') continue;
  const css = await readFile(join(ROOT, ref), 'utf8');
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (!/^(?:data:|[a-z]+:\/\/)/i.test(m[1])) needed.add(posix.normalize(posix.join(posix.dirname(ref), m[1])));
  }
}

for (const ref of needed) {
  if (!existsSync(join(ROOT, ref))) { problems.push(`fehlt im Repo: ${ref}`); continue; }
  await mkdir(dirname(join(OUT, ref)), { recursive: true });
  await copyFile(join(ROOT, ref), join(OUT, ref));
}
for (const [name, html] of Object.entries(pages)) {
  await writeFile(join(OUT, name), name === 'index.html' ? toFragment(html) : html);
}

// Jeder Seitenlink muss auf eine Seite im Ordner zeigen
for (const [name, html] of Object.entries(pages)) {
  for (const ref of refsOf(html)) if (ref.endsWith('.html') && !pages[ref]) problems.push(`${name}: Link ins Leere ${ref}`);
}
if (problems.length) {
  console.error(`Vorschau nicht vollständig:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// files.json für den Artifact-Parameter `files` (Pfade relativ zu tools/vorschau)
const list = async (dir, base = '') => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((e) =>
  e.isDirectory() ? list(join(dir, e.name), posix.join(base, e.name)) : [posix.join(base, e.name)]))).flat();
const files = (await list(OUT)).filter((p) => p !== 'index.html').sort();
let bytes = 0;
for (const p of [...files, 'index.html']) bytes += (await stat(join(OUT, p))).size;
await writeFile(join(OUT, 'files.json'), JSON.stringify(files.map((path) => ({ path, contentType: TYPES[extname(path)] || 'application/octet-stream' })), null, 1) + '\n');

console.log(`Vorschau gebaut: ${files.length + 1} Dateien, ${(bytes / 1048576).toFixed(1)} MB → tools/vorschau/`);
console.log('Veröffentlichen: file_path tools/vorschau/index.html, root tools/vorschau, files aus tools/vorschau/files.json');

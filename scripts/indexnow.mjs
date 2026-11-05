// Meldet geänderte Adressen per IndexNow (Bing, Yandex, Seznam u. a.; Google nutzt IndexNow nicht).
// Geändert = Adresse ist neu in sitemap.xml oder ihr lastmod hat sich gegenüber dem vorigen Commit geändert.
//
//   node scripts/indexnow.mjs            → nur geänderte Adressen (braucht git-Historie, fetch-depth ≥ 2)
//   INDEXNOW_ALL=1 node scripts/indexnow.mjs   → alle Adressen der Sitemap
//   DRY_RUN=1 …                           → nur anzeigen
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT, ORIGIN, read } from './lib.mjs';

const entries = (xml) => new Map([...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
const now = entries(read('sitemap.xml'));
let before = new Map();
if (!process.env.INDEXNOW_ALL) {
  try { before = entries(execFileSync('git', ['show', 'HEAD~1:sitemap.xml'], { cwd: ROOT, encoding: 'utf8' })); }
  catch { console.log('Kein vorheriger Stand von sitemap.xml – alle Adressen werden gemeldet.'); }
}
const urlList = [...now].filter(([url, lastmod]) => before.get(url) !== lastmod).map(([url]) => url);
if (!urlList.length) { console.log('Keine geänderten Adressen – nichts zu melden.'); process.exit(0); }

const key = readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) { console.error('IndexNow-Schlüsseldatei fehlt.'); process.exit(1); }
const body = { host: new URL(ORIGIN).host, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList };
console.log(`Melde ${urlList.length} Adresse(n):\n${urlList.join('\n')}`);
if (process.env.DRY_RUN) process.exit(0);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body),
});
console.log(`IndexNow → ${res.status} ${res.statusText}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);

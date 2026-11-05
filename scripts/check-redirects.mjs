// Prüft jede Zeile von seo/redirect-map.csv gegen eine laufende Website.
//
//   node scripts/check-redirects.mjs                       → gegen https://www.raumrent.de
//   BASE_URL=https://…vercel.app node scripts/check-redirects.mjs   → gegen eine Vorschau
//
// Für geschützte Vercel-Vorschauen VERCEL_AUTOMATION_BYPASS_SECRET setzen.
// Je Zeile: Status stimmt? Location = Ziel? Ziel liefert 200 ohne weiteren Hop? Ziel nicht noindex?
// Ergebnis: seo/redirect-report.md. Exit-Code 1 bei Fehlern.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ORIGIN, read, parseCsv } from './lib.mjs';

const BASE = new URL(process.env.BASE_URL || ORIGIN).origin;
const IS_PROD = BASE === ORIGIN;
const OUT = process.env.REPORT || join(ROOT, 'seo', 'redirect-report.md');
const headers = { 'user-agent': 'raumrent-redirect-check/1.0' };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const rows = parseCsv(read('seo/redirect-map.csv'));

// Adressen der Kanonischen Domain beim Test einer Vorschau auf die Vorschau umlenken
const toBase = (u) => (u.origin === ORIGIN && !IS_PROD ? new URL(u.pathname + u.search, BASE) : u);

async function get(url) {
  const res = await fetch(url, { redirect: 'manual', headers });
  const body = res.status === 200 && (res.headers.get('content-type') || '').includes('text/html') ? await res.text() : '';
  return { status: res.status, location: res.headers.get('location'), robots: res.headers.get('x-robots-tag') || '', body };
}

const results = [];
for (const row of rows) {
  const absolute = /^https?:\/\//.test(row.alt);
  if (absolute && !IS_PROD) { results.push({ row, ok: null, note: 'nur gegen Produktion geprüft' }); continue; }
  const url = absolute ? new URL(row.alt) : new URL(row.alt, BASE);
  const expected = row.status.split('|').map(Number);
  const errors = [];
  let note = '';
  try {
    const r = await get(url);
    note = `${r.status}${r.location ? ` → ${r.location}` : ''}`;
    if (!expected.includes(r.status)) errors.push(`Status ${r.status}, erwartet ${row.status}`);
    if (row.neu) {
      const want = new URL(row.neu, ORIGIN);
      const got = r.location ? new URL(r.location, url) : null;
      if (!got) errors.push('keine Location');
      else {
        const sameTarget = got.pathname === want.pathname && got.search === want.search && [ORIGIN, url.origin].includes(got.origin);
        if (!sameTarget) errors.push(`Location ${got.href}, erwartet ${want.href}`);
        else {
          const t = await get(toBase(got));
          if (t.status !== 200) errors.push(`Ziel liefert ${t.status}${t.location ? ` → ${t.location} (zweiter Hop)` : ''}`);
          if (/<meta name="robots" content="[^"]*noindex/.test(t.body)) errors.push('Ziel ist noindex (Meta)');
          if (IS_PROD && /noindex/i.test(t.robots)) errors.push('Ziel ist noindex (X-Robots-Tag)');
        }
      }
    }
  } catch (e) {
    errors.push(`Abruf fehlgeschlagen: ${e.cause?.code || e.message}`);
  }
  results.push({ row, ok: errors.length === 0, note, errors });
}

const failed = results.filter((r) => r.ok === false);
const lines = [
  '# Redirect-Check',
  '',
  `Basis: ${BASE} · ${new Date().toISOString()} · ${results.filter((r) => r.ok).length} ok, ${failed.length} Fehler, ${results.filter((r) => r.ok === null).length} übersprungen`,
  '',
  '| Ergebnis | Alt | Erwartet | Gemessen | Grund |',
  '|---|---|---|---|---|',
  ...results.map(({ row, ok, note, errors = [] }) =>
    `| ${ok === null ? '–' : ok ? '✅' : '❌ ' + errors.join('; ')} | \`${row.alt}\` | ${row.status}${row.neu ? ` → \`${row.neu}\`` : ''} | ${note} | ${row.grund} |`),
  '',
];
writeFileSync(OUT, lines.join('\n'));
for (const { row, ok, note, errors = [] } of results) {
  console.log(`${ok === null ? '–' : ok ? 'ok ' : 'ERR'}  ${row.alt}  ${note}${errors.length ? '  ' + errors.join('; ') : ''}`);
}
console.log(`\n${failed.length ? '✖' : '✔'} ${results.length} Zeilen, ${failed.length} Fehler → ${OUT}`);
process.exit(failed.length ? 1 : 0);

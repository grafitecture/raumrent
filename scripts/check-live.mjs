// Prüft eine laufende Website (Produktion oder Vorschau): Statuscodes, Header, Indexierbarkeit,
// Inhalt ohne JavaScript, Erreichbarkeit für Such- und KI-Crawler.
//
//   npm run seo:live                                        → gegen https://www.raumrent.de
//   BASE_URL=https://…vercel.app npm run seo:live            → gegen eine Vorschau
//
// Für geschützte Vercel-Vorschauen VERCEL_AUTOMATION_BYPASS_SECRET setzen. Exit-Code 1 bei Fehlern.
import { readdirSync } from 'node:fs';
import { ROOT, ORIGIN, PAGES, read, getTitle, getCanonical } from './lib.mjs';

const BASE = new URL(process.env.BASE_URL || ORIGIN).origin;
const IS_PROD = BASE === ORIGIN;
const baseHeaders = { 'user-agent': 'raumrent-live-check/1.0' };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) baseHeaders['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const errors = [];
const ok = [];
const check = (cond, msg) => (cond ? ok.push(msg) : errors.push(msg));

async function get(path, ua) {
  const res = await fetch(new URL(path, BASE), { redirect: 'manual', headers: { ...baseHeaders, ...(ua ? { 'user-agent': ua } : {}) } });
  const text = (res.headers.get('content-type') || '').match(/text|xml|json/) ? await res.text() : '';
  return { status: res.status, h: res.headers, text };
}

// 1 Startseite, Header, Indexierbarkeit
const home = await get('/');
check(home.status === 200, `/ → ${home.status} (erwartet 200)`);
for (const h of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options', 'cross-origin-opener-policy']) {
  check(home.h.has(h), `Header ${h} auf /`);
}
check(!/interest-cohort/.test(home.h.get('permissions-policy') || ''), 'Permissions-Policy ohne interest-cohort');
if (IS_PROD) {
  check(!/noindex/i.test(home.h.get('x-robots-tag') || ''), 'Produktion: / ohne X-Robots-Tag noindex');
  check(!/<meta name="robots" content="[^"]*noindex/.test(home.text), 'Produktion: / ohne meta noindex');
} else {
  check(/noindex/i.test(home.h.get('x-robots-tag') || ''), 'Vorschau: X-Robots-Tag noindex gesetzt');
}
check(home.text.includes('Ihr zuverlässiger Partner für die Vermietung'), 'Kerntext der Startseite im HTML (ohne JavaScript)');
check(home.text.includes('application/ld+json'), 'JSON-LD im HTML');

// 2 Alle Seiten der Sitemap: 200, Canonical, nicht noindex
for (const [file, path] of PAGES) {
  if (!path) continue;
  const r = await get(path);
  check(r.status === 200, `${path} → ${r.status}`);
  check(getCanonical(r.text) === ORIGIN + path, `${path}: Canonical ${getCanonical(r.text)}`);
  check(getTitle(r.text) === getTitle(read(file)), `${path}: ausgelieferter Title = Repo`);
  if (IS_PROD) check(!/noindex/i.test(r.h.get('x-robots-tag') || ''), `${path}: kein X-Robots-Tag noindex`);
}

// 3 Fehlerseiten und Dateien
const missing = await get(`/gibt-es-nicht-${Date.now()}`);
check(missing.status === 404, `Fantasie-Adresse → ${missing.status} (erwartet 404)`);
check(missing.text.includes('Seite nicht gefunden'), '404-Seite mit eigenem Inhalt');
const gone = await get('/sample-page');
check(gone.status === 410, `/sample-page → ${gone.status} (erwartet 410)`);
const robots = await get('/robots.txt');
check(robots.status === 200 && robots.text.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt mit Sitemap-Zeile');
check(!/^\s*Disallow:\s*\/\s*$/m.test(robots.text), 'robots.txt ohne „Disallow: /“');
const sitemap = await get('/sitemap.xml');
check(sitemap.status === 200 && sitemap.text.includes('<urlset'), 'sitemap.xml erreichbar');
const llms = await get('/llms.txt');
check(llms.status === 200 && /noindex/i.test(llms.h.get('x-robots-tag') || ''), 'llms.txt erreichbar, X-Robots-Tag noindex');
const sec = await get('/.well-known/security.txt');
check(sec.status === 200 && sec.text.includes('Contact:'), 'security.txt erreichbar');
const key = readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
const keyRes = key ? await get(`/${key}`) : { status: 0, text: '' };
check(keyRes.status === 200 && keyRes.text.trim() === key?.slice(0, -4), 'IndexNow-Schlüsseldatei erreichbar');
for (const p of ['/.git/config', '/.env', '/package.json', '/seo/AUDIT.md', '/scripts/lib.mjs']) {
  const r = await get(p);
  check(r.status === 404, `${p} nicht ausgeliefert (${r.status})`);
}

// 4 Such- und KI-Crawler bekommen denselben Inhalt (kein Cloaking, keine Firewall-Sperre)
const bots = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  'Claude-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
};
for (const [name, ua] of Object.entries(bots)) {
  const r = await get('/', ua);
  check(r.status === 200 && getTitle(r.text) === getTitle(home.text), `${name}: / → ${r.status}, gleicher Inhalt`);
}

for (const m of ok) console.log(`ok   ${m}`);
for (const m of errors) console.log(`ERR  ${m}`);
console.log(`\n${errors.length ? '✖' : '✔'} Live-Check ${BASE}: ${ok.length} ok, ${errors.length} Fehler`);
process.exit(errors.length ? 1 : 0);

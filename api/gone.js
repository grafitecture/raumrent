// Antwort „410 Gone“ für Adressen der alten WordPress-Seite, die es bewusst nicht mehr gibt
// (Autorenarchiv, Beispielseite, Feeds, WordPress-Systempfade). Welche Adressen hierher
// geleitet werden, steht in vercel.json unter "rewrites" und in seo/redirect-map.csv.
// Inhalt ist die normale 404-Seite, damit Besucher Navigation und Kontakt sehen.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const html = readFileSync(join(__dirname, '..', '404.html'), 'utf8');

module.exports = (req, res) => {
  res.statusCode = 410;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(req.method === 'HEAD' ? undefined : html);
};

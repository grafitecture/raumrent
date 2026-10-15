// Erzeugt aus den Originalbildern in tools/originals/ die Web-Varianten
// in assets/img/ (AVIF + WebP in mehreren Breiten).
//
// Aufruf (einmalig vorher: cd tools && npm install):
//   node tools/build-images.mjs            → alle Bilder
//   node tools/build-images.mjs hero kauf  → nur diese Bilder
//
// Dateinamen: assets/img/<name>-<breite>.avif / .webp
// Neue Bilder: JPG/PNG in tools/originals/ ablegen (sprechender Dateiname,
// Kleinbuchstaben, Bindestriche), Skript starten, im HTML einbinden.

import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'tools', 'originals');
const OUT = path.join(ROOT, 'assets', 'img');

// Breitenstufen: deckt Smartphones (1x–3x), Tablets und Desktop (1x–2x) ab.
const WIDTHS = [480, 800, 1200, 1600, 1920, 2752];
const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 74, effort: 6 };

const only = new Set(process.argv.slice(2));
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
for (const file of files) {
  const name = file.replace(/\.(jpe?g|png)$/i, '');
  if (only.size && !only.has(name)) continue;
  const input = sharp(path.join(SRC, file));
  const { width, height } = await input.metadata();
  const widths = WIDTHS.filter((w) => w < width).concat(width);
  const unique = [...new Set(widths)].sort((a, b) => a - b);
  for (const w of unique) {
    const base = path.join(OUT, `${name}-${w}`);
    const resized = sharp(path.join(SRC, file)).resize({ width: w, withoutEnlargement: true });
    await resized.clone().avif(AVIF).toFile(`${base}.avif`);
    await resized.clone().webp(WEBP).toFile(`${base}.webp`);
  }
  console.log(`${name}: ${width}×${height} → ${unique.join(', ')}`);
}

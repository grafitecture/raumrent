# CLAUDE.md – raumrent.de

Statische Website für raumrent GmbH (Vermietung und Verkauf von Containern und mobilen Raumsystemen).
Reines HTML/CSS/JS, kein Framework, kein Build-Schritt. GitHub `grafitecture/raumrent` → Vercel (Push auf `main` = live).
Details zu Aufbau, Design-System, Bildern und Deployment: `README.md`.

## Regeln für Änderungen

- **Texte:** Wortlaut des Kunden 1:1 übernehmen. Keine eigenen Werbetexte ergänzen oder umformulieren, außer es wird ausdrücklich verlangt. Inhalte und Änderungswünsche kommen von Manuel Loth (manuel.loth@raumrent.de).
- **Gemeinsame Teile** (Kopfzeile, mobiles Menü, Fuß, SVG-Sprite) stehen in allen 9 HTML-Dateien: `index.html`, `buerocontainer/`, `lager-und-seecontainer/`, `sanitaercontainer/`, `containeranlagen/`, `kontakt/`, `impressum/`, `datenschutz/` (je `index.html`) und `404.html`. Immer in allen Dateien gleich ändern.
- **Schriftgrößen** nur über die Tokens `--fs-h1` … `--fs-xs` bzw. `--fs-input` in `assets/css/site.css` (alle per `clamp()`). Keine festen px-Schriftgrößen.
- **Breakpoints** nur `30em`, `48em`, `64em`, `80em`, `90em` (min-width). Keine neuen erfinden.
- **Farben** nur aus den Tokens (`--blue`, `--blue-light`, `--grey`, `--ink`, `--ink-soft`, `--mist`, `--line`). Textkontrast mindestens 4,5:1.
- **Abstände** über `--space-*`, Seitenränder über `--gutter`.
- **Bilder** nie direkt als JPG einbinden: Original nach `tools/originals/`, dann `node tools/build-images.mjs <name>`, im HTML das `<picture>`-Muster mit AVIF + WebP und deutschem `alt`-Text verwenden. Neue Higgsfield-Bilder mit dem Stil-Baustein aus `README.md` erzeugen. Geänderte Bilder unter neuem Dateinamen speichern.
- Nach Änderungen an `site.css`/`site.js` die Version `?v=` in allen HTML-Dateien hochzählen.
- Neue Seite: Ordner mit `index.html` anlegen (Vorlage: eine Container-Unterseite), in Navigation, Fuß und `sitemap.xml` eintragen.
- Kein Tracking, keine externen Schriften/Skripte/Embeds ohne Rücksprache (sonst braucht die Seite einen Cookie-Banner und eine neue Datenschutzerklärung). Die Content-Security-Policy in `vercel.json` erlaubt nur eigene Dateien.

## Prüfen vor dem Commit

1. `python3 -m http.server 8000` und die geänderten Seiten bei 390 px, 768 px, 1280 px und 1440 px Breite ansehen.
2. Kein waagerechtes Scrollen auf dem Telefon, alle Bilder laden, Konsole ohne Fehler.
3. Je Seite genau ein `h1`, Überschriften ohne Sprünge, alle Bilder mit `alt`.
4. Commit-Nachricht auf Deutsch, kurz und sachlich.

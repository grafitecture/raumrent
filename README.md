# raumrent.de – Website

Statische Website (HTML, CSS, JavaScript, Bilder) ohne Datenbank und ohne Build-Schritt.
Quelle: GitHub `grafitecture/raumrent` · Hosting: Vercel · Pflege: per Prompt mit Claude Code.

## Inhalt

| Datei / Ordner | Zweck |
|---|---|
| `index.html` | Startseite |
| `buerocontainer/`, `lager-und-seecontainer/`, `sanitaercontainer/`, `containeranlagen/` | Unterseiten der Containerarten (Texte von Manuel Loth, Mails vom 18.07.2025) |
| `kontakt/` | Anfrage mit Fragebogen und Ansprechpartner |
| `impressum/`, `datenschutz/` | Rechtstexte (Wortlaut der alten Seite, Impressum ergänzt um Verbraucherstreitbeilegung) |
| `404.html` | Seite für unbekannte Adressen |
| `assets/css/site.css` | Gestaltung für alle Seiten, Design-Tokens am Anfang |
| `assets/js/site.js` | Menü, Kopfzeile, Anfrage-Formular, Jahreszahl |
| `assets/img/` | Bilder als AVIF und WebP in mehreren Breiten (erzeugt, siehe [Bilder](#bilder)) |
| `assets/fonts/` | Noto Sans, lokal eingebunden (keine Verbindung zu Google) |
| `assets/logos/`, `assets/icons/`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest` | Logo, Favicon, Symbole für den Home-Bildschirm |
| `downloads/` | Allgemeine Mietbedingungen (AMB) und Verkaufs- und Lieferbedingungen (AVLB) als PDF |
| `vercel.json` | Saubere Adressen ohne `.html`, Weiterleitungen alter WordPress-Adressen, Sicherheits-Header, Zwischenspeicher |
| `sitemap.xml`, `robots.txt` | Für Suchmaschinen |
| `tools/` | Bild-Werkzeug, Vorschau-Werkzeug und Originalbilder – wird **nicht** veröffentlicht (`.vercelignore`) |

## Gemeinsame Teile

Kopfzeile, mobiles Menü, Fuß und das SVG-Sprite (Logo und Symbole) stehen in **allen neun** HTML-Dateien.
Wer dort etwas ändert, ändert es überall – mit Claude Code reicht ein Prompt wie
„Ergänze im Fuß aller Seiten …“.

Links beginnen mit `/` (z. B. `/kontakt`), damit sie auf jeder Seite gleich funktionieren.

## Gestaltung

- **Farben** (README_RAUMRENT): Blau `#005ca8`, Hellblau `#668fca`, Grau `#a6b3ba`.
  Abgeleitet: Text `#10263d`, Nebentext `#4b5b69`, helle Fläche `#eef2f4`, Linien `#d5dce0`.
  Alle Textfarben erreichen mindestens WCAG AA (4,5:1).
- **Schrift:** Noto Sans, variabel (100–900).
- **Leitmotiv:** das Quadrat aus dem Logo. Der blaue „Aufkleber“ in der Startseite wiederholt die Aufkleber auf den Containern; kleine Quadrate markieren Aufzählungen.
- **Typo-Skala** Perfect Fourth (1.333), jede Schriftgröße per `clamp()` fluide zwischen 360 px und 1440 px Fensterbreite:

| Token | Element | 360 px | 1440 px |
|---|---|---|---|
| `--fs-h1` | h1 | 2.369rem (37.9 px) | 5.61rem (89.8 px) |
| `--fs-h2` | h2 | 2.052rem (32.8 px) | 4.209rem (67.3 px) |
| `--fs-h3` | h3 | 1.777rem (28.4 px) | 3.157rem (50.5 px) |
| `--fs-h4` | h4 | 1.539rem (24.6 px) | 2.369rem (37.9 px) |
| `--fs-h5` | h5 | 1.333rem (21.3 px) | 1.777rem (28.4 px) |
| `--fs-h6` | h6 | 1.155rem (18.5 px) | 1.333rem (21.3 px) |
| `--fs-p` | p | 0.938rem (15 px) | 1rem (16 px) |
| `--fs-small` | small | 0.8125rem (13 px) | 0.75rem (12 px) |
| `--fs-xs` | – | 0.6875rem (11 px) | 0.563rem (9 px) |

Mobil staucht sich die Skala auf halbe Schritte (√1.333): Überschriften werden kleiner, Klein- und Kleinsttext etwas größer, damit sie auf dem Telefon lesbar bleiben. Formularfelder nutzen `--fs-input` (mind. 16 px, sonst zoomt iOS beim Antippen).

### Breakpoints

Grundlage: StatCounter Deutschland, September 2026 (Telefone 360–414 px, Tablets 768–1280 px, Desktop 1366–2560 px).
Weil Schrift und Abstände fließend mitwachsen, reichen fünf Umbrüche. Sie stehen in `em`, damit sie auch bei vergrößerter Browserschrift greifen.

| Breakpoint | ab | Geräte | Was passiert |
|---|---|---|---|
| Basis | 0 | Telefone hochkant (360–430 px) | eine Spalte, Kacheln zweispaltig, Menü-Taste |
| `30em` | 480 px | große Telefone quer | Schaltflächen nicht mehr vollbreit |
| `48em` | 768 px | Tablets hochkant | Unterseiten zweispaltig, Vorteile zweispaltig |
| `64em` | 1024 px | Tablets quer, kleine Laptops | Hero mit Aufkleber und Text nebeneinander, Kacheln vierspaltig |
| `80em` | 1280 px | Laptops | volle Navigation statt Menü-Taste, Vorteile dreispaltig |
| `90em` | 1440 px | Desktop | Typo erreicht Maximalwerte, Inhalt max. 1344 px breit |

## Bilder

Alle Bilder sind mit **Higgsfield AI** erzeugt (Modell Nano Banana 2.1) und im Fuß als „KI-generierte Beispieldarstellungen“ gekennzeichnet. Einheitlicher Look über einen festen Stil-Baustein, der jedem Motiv-Prompt angehängt wird:

> Eye-level architectural photograph, 24mm tilt-shift lens, perfectly straight verticals. Soft, even late-morning daylight under a pale high-overcast sky with a faint cool blue tint, gentle soft shadows. Cool neutral color grade, muted palette of light grey, white and deep blue, crisp detail, minimal and orderly composition with generous negative space. No people, no text, no logos, no signage, no lettering, no watermark.

Container immer als: *light grey corrugated steel wall panels, deep gentian-blue steel frames and corner posts, white window frames.*

**Neues Bild einbinden**

1. Original (JPG/PNG) unter `tools/originals/<name>.jpg` ablegen – Kleinbuchstaben, Bindestriche.
2. Einmalig `cd tools && npm install`, danach `node tools/build-images.mjs <name>`.
   Es entstehen `assets/img/<name>-480/800/1200/….avif` und `.webp`.
3. Im HTML ein vorhandenes `<picture>` kopieren und den Namen tauschen, `alt`-Text auf Deutsch beschreiben.
4. Ein geändertes Bild bekommt einen **neuen Dateinamen**, denn Browser speichern Bilder ein Jahr lang.

## Ansehen auf dem eigenen Rechner

```
cd raumrent
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## So kommt eine Änderung online

1. Änderung auf `main` committen und pushen.
2. Vercel baut nichts, sondern veröffentlicht die Dateien direkt – nach etwa 30 Sekunden ist die Änderung online.
   Andere Branches bekommen automatisch eine eigene Vorschau-Adresse.

**Einmalige Einrichtung bei Vercel**

1. vercel.com → *Add New… → Project* → GitHub-Repo `grafitecture/raumrent` importieren.
2. *Framework Preset:* Other · *Build Command* und *Output Directory* leer lassen → *Deploy*.
3. Erst nach Abnahme: *Settings → Domains* → `raumrent.de` und `www.raumrent.de` hinzufügen und die angezeigten DNS-Einträge beim Domain-Anbieter eintragen. `www.raumrent.de` ist die Hauptadresse (siehe `canonical` im HTML).

Nach Änderungen an `site.css` oder `site.js` die Versionsnummer `?v=1` in allen HTML-Dateien hochzählen, damit Browser sofort die neue Fassung laden.

## Vorschau in der Claude-Seitenleiste

Neben der Live-Seite gibt es eine Vorschau als Artifact in claude.ai, angeheftet in der Seitenleiste:
https://claude.ai/artifact/QXTXUck9XYCFmckxJEQVko

`node tools/vorschau.mjs` baut sie aus dem Repo nach `tools/vorschau/` (nicht im Git): Unterseiten als `kontakt.html` usw., alle Pfade relativ, alle Verweise geprüft. Claude veröffentlicht den Ordner danach unter derselben Adresse (Ablauf in `CLAUDE.md`).
Die PDFs öffnet die Vorschau über ihre bisherigen öffentlichen Adressen in einem neuen Tab, weil Chrome PDFs im Artifact-Rahmen nicht anzeigt. Telefon- und Mail-Links und das Mailprogramm beim Absenden des Formulars öffnen sich in der Vorschau nicht immer. Der Anfragetext zum Kopieren erscheint trotzdem.

## Weiterleitungen alter Adressen

`vercel.json` leitet die alten WordPress-PDF-Adressen (`/wp-content/uploads/2025/05/RAUMRENT_AMB.pdf` und `…AVLB.pdf`) auf `downloads/` um, `/wp-sitemap.xml` auf `/sitemap.xml`. `/impressum` und `/datenschutz` behalten ihre Adresse.

## Anfrage-Formular

Das Formular auf `/kontakt` braucht keinen Server: Beim Absenden öffnet sich das E-Mail-Programm mit allen Angaben als Nachricht an `manuel.loth@raumrent.de`. Öffnet sich keines, erscheint der Text zum Kopieren. Die Website speichert und verschickt selbst keine Daten und setzt keine Cookies – ein Cookie-Banner ist deshalb nicht nötig, solange kein Tracking ergänzt wird.

## Offene Punkte (vor dem Livegang klären)

- **Datenschutzerklärung** ist der alte Wortlaut: Sie nennt Cookies (die neue Seite setzt keine), nicht aber das Hosting bei Vercel und Server-Logdateien; sie verweist noch auf das TMG. Bitte rechtlich aktualisieren lassen.
- **Impressum:** Für eine GmbH fehlen Registergericht, Handelsregisternummer und ggf. USt-IdNr.; „§ 55 Abs. 2 RStV“ heißt heute „§ 18 Abs. 2 MStV“. Der Hinweis zur Verbraucherstreitbeilegung ist neu (Wunsch von Manuel Loth) – bitte prüfen lassen.
- **Anrede:** Die Texte der Unterseiten (Manuel Loth) duzen, Startseite und Rechtstexte siezen.
- **Fotos:** Echte Projektfotos können die KI-Bilder später ersetzen (gleiches Seitenverhältnis, siehe Bilder).

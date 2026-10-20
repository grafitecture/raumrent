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

> Eye-level architectural photograph, 24mm tilt-shift lens, perfectly straight verticals. Soft, even late-morning daylight under a pale high-overcast sky with a faint cool blue tint, gentle soft shadows. Cool neutral color grade, muted palette of light grey, white and cool grey, crisp detail, minimal and orderly composition with generous negative space. No people, no text, no logos, no signage, no lettering, no watermark.

Container immer als: *light grey corrugated steel wall panels, steel frames and corner posts in the same light grey (RAL 7035), white window frames – containers uniformly light grey, no blue.*

**Seit 20.10.2026 sind alle Container einheitlich grau** (vorher blaue Rahmen und teils blaue Seecontainer). Die 17 Motive der Website wurden dafür nicht neu erzeugt, sondern mit Higgsfield umgefärbt (Nano Banana 2.1, Bildbearbeitung mit dem bisherigen Bild als Referenz). Danach wurden nur die umgefärbten Containerteile ins Original übernommen, alles andere ist pixelgleich geblieben. Die neuen Dateien heißen `<name>-grau`. Die blauen Fassungen liegen in der Git-Historie (bis Commit 733ac62). `tools/originals/spezialcontainer.jpg` wird auf der Seite nicht verwendet und ist noch blau.

**Vorschaubild für Links** (`assets/img/og-raumrent-2.jpg`, 1200 × 630 px, für `og:image`): Vorlage `tools/og-bild.html` (Ausschnitt aus `hero-grau.jpg`, blauer Aufkleber mit Claim, Schild „raumrent.de“). Datei in Chromium bei 1200 × 630 fotografieren und als JPEG (Qualität 86) unter neuem Namen speichern, dann `og:image` in allen 9 HTML-Dateien und `image` im JSON-LD der Startseite anpassen.

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

Neben der Live-Seite gibt es eine Vorschau als Artifact in claude.ai. Sie ist in der Seitenleiste angeheftet und zum Teilen mit dem Kunden gedacht:
https://claude.ai/artifact/QXTXUck9XYCFmckxJEQVko

`node tools/vorschau.mjs` baut daraus **eine** Datei `tools/vorschau/index.html` (nicht im Git). Sie enthält alle acht Seiten, umgeschaltet über Anker (`#buerocontainer`, `#kontakt` …). CSS, JavaScript, Schrift und Bilder sind eingebettet (WebP, je Motiv einmal). Oben steht ein schmaler Hinweis „Vorschau der neuen Website · Stand …“. Nur eine einzelne Seite lässt sich öffentlich teilen: Die erste Fassung aus 130 Einzeldateien konnte nicht für die öffentliche Freigabe geprüft werden. Claude veröffentlicht die Datei unter derselben Adresse (Ablauf in `CLAUDE.md`).
Die PDFs öffnet die Vorschau über ihre bisherigen öffentlichen Adressen in einem neuen Tab, weil Chrome PDFs im Artifact-Rahmen nicht anzeigt. Telefon- und Mail-Links und das Mailprogramm beim Absenden des Formulars öffnen sich in der Vorschau nicht immer. Der Anfragetext zum Kopieren erscheint trotzdem.

**Teilen:** Artifact öffnen → *Teilen* → unter *Geteilte Version* die neueste Version wählen → öffentlichen Link kopieren. Nach jeder neuen Version dort die Version wechseln, sonst sieht der Kunde die alte.

## Weiterleitungen alter Adressen

`vercel.json` leitet die alten WordPress-PDF-Adressen (`/wp-content/uploads/2025/05/RAUMRENT_AMB.pdf` und `…AVLB.pdf`) auf `downloads/` um, `/wp-sitemap.xml` auf `/sitemap.xml`. `/impressum` und `/datenschutz` behalten ihre Adresse.

## Anfrage-Formular

Das Formular auf `/kontakt` braucht keinen Server: Beim Absenden öffnet sich das E-Mail-Programm mit allen Angaben als Nachricht an `manuel.loth@raumrent.de`. Öffnet sich keines, erscheint der Text zum Kopieren. Die Website speichert und verschickt selbst keine Daten und setzt keine Cookies – ein Cookie-Banner ist deshalb nicht nötig, solange kein Tracking ergänzt wird.

## Offene Punkte (vor dem Livegang klären)

- **Datenschutzerklärung:** Seit 20.10.2026 überarbeitet: Hosting bei Vercel und Server-Logfiles ergänzt (Abschnitte 3 und 4), Cookie-Abschnitt richtiggestellt (die Seite setzt keine Cookies und nutzt keinen Speicher im Browser), „Anmeldung“ entfernt, Anfrageformular beschrieben, TMG durch BDSG/TDDDG ersetzt, RStV-Block durch „Sitz der Gesellschaft“ ersetzt, Beschwerderecht (Art. 77 DSGVO) ergänzt. Bitte rechtlich prüfen lassen. Wer Tracking, Schriften oder Einbettungen von außen ergänzt, muss Abschnitt 5 anpassen.
- **Vercel-Tarif:** Der Vertrag zur Auftragsverarbeitung (DPA), auf den sich die Datenschutzerklärung stützt, gilt bei Vercel nur in den Tarifen Pro und Enterprise. Der Hobby-Tarif ist außerdem nur für private, nicht-kommerzielle Nutzung erlaubt.
- **Impressum:** Registergericht (Amtsgericht Saarbrücken) und Registernummer (HRB 111150) sind seit 20.10.2026 eingetragen, Quelle registercheck.de – bitte mit dem Registerauszug auf handelsregister.de abgleichen. Der Verweis lautet jetzt „§ 18 Abs. 2 MStV“ statt „§ 55 Abs. 2 RStV“. Offen: USt-IdNr., falls vorhanden (bei Manuel Loth erfragen). Der Hinweis zur Verbraucherstreitbeilegung ist neu (Wunsch von Manuel Loth) – bitte prüfen lassen.
- **Anrede:** Die Texte der Unterseiten (Manuel Loth) duzen, Startseite und Rechtstexte siezen.
- **Fotos:** Echte Projektfotos können die KI-Bilder später ersetzen (gleiches Seitenverhältnis, siehe Bilder).

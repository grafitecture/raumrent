# CLAUDE.md – raumrent.de

Statische Website für raumrent GmbH (Vermietung und Verkauf von Containern und mobilen Raumsystemen).
Reines HTML/CSS/JS, kein Framework, kein Build-Schritt. GitHub `grafitecture/raumrent` → Vercel (Push auf `main` = live).
Details zu Aufbau, Design-System, Bildern und Deployment: `README.md`.

## Regeln für Änderungen

- **Texte:** Wortlaut des Kunden 1:1 übernehmen. Keine eigenen Werbetexte ergänzen oder umformulieren, außer es wird ausdrücklich verlangt. Inhalte und Änderungswünsche kommen von Manuel Loth (manuel.loth@raumrent.de).
- **Gemeinsame Teile** (Kopfzeile, mobiles Menü, Fuß, SVG-Sprite) stehen in allen 9 HTML-Dateien: `index.html`, `buerocontainer/`, `lager-und-seecontainer/`, `sanitaercontainer/`, `containeranlagen/`, `kontakt/`, `impressum/`, `datenschutz/` (je `index.html`) und `404.html`. Immer in allen Dateien gleich ändern.
- **Claim** („flexibel & temporär“) steht an vier Stellen: im Aufkleber der Startseite, im Fuß aller 9 Dateien, im JSON-LD aller 8 Seiten (`slogan` im Knoten `#organization`) und im Vorschaubild für Links (Vorlage `tools/og-bild.html`, siehe README). Immer alle vier ändern.
- **Schriftgrößen** nur über die Tokens `--fs-h1` … `--fs-xs` bzw. `--fs-input` in `assets/css/site.css` (per `clamp()`; `--fs-p` fest 1rem = 16 px, darunter nie). Keine festen px-Schriftgrößen.
- **Breakpoints** nur `30em`, `48em`, `64em`, `80em`, `90em` (min-width). Keine neuen erfinden.
- **Farben** nur aus den Tokens (`--blue`, `--blue-light`, `--grey`, `--ink`, `--ink-soft`, `--mist`, `--line`). Textkontrast mindestens 4,5:1.
- **Abstände** über `--space-*`, Seitenränder über `--gutter`.
- **Bilder** nie direkt als JPG einbinden: Original nach `tools/originals/`, dann `node tools/build-images.mjs <name>`, im HTML das `<picture>`-Muster mit AVIF + WebP und deutschem `alt`-Text verwenden. Neue Higgsfield-Bilder mit dem Stil-Baustein aus `README.md` erzeugen. Geänderte Bilder unter neuem Dateinamen speichern.
- Nach Änderungen an `site.css`/`site.js` die Version `?v=` in allen HTML-Dateien hochzählen.
- Neue Seite: Ordner mit `index.html` anlegen (Vorlage: eine Container-Unterseite), in Navigation, Fuß und `PAGES` in `scripts/lib.mjs` eintragen, dann `npm run seo:sitemap` (die Sitemap nie von Hand bearbeiten).
- **Grafitecture-Feld** (Lime-Fläche mit Logo, „Marken mit KI.“, Link auf www.grafitecture.de, neues Fenster): steht immer ganz unten in Impressum und Datenschutz, nach dem Text (`.prose`). Markup = `snippet.de.html`, CSS = Abschnitt 14 in `assets/css/site.css`, beides unverändert aus dem Kit `grafitecture/lannee_webseite` → `kit/grafitecture-credit/` (v1.2). Farben und Schriftgrößen der Agentur sind die einzige Ausnahme von den Token-Regeln. Nicht an raumrent anpassen; bei einer neuen Kit-Version Markup und CSS-Abschnitt ersetzen.
- Kein Tracking, keine externen Schriften/Skripte/Embeds ohne Rücksprache (sonst braucht die Seite einen Cookie-Banner und eine neue Datenschutzerklärung). Die Content-Security-Policy in `vercel.json` erlaubt nur eigene Dateien und erzwingt Trusted Types: in JavaScript kein `innerHTML`, `insertAdjacentHTML`, `document.write` oder `eval`, sondern `textContent` und DOM-Methoden.

## Vorschau in der Claude-Seitenleiste

Die Seite ist zusätzlich als Artifact „raumrent.de“ veröffentlicht, in der Seitenleiste von claude.ai angeheftet und zum Teilen mit dem Kunden gedacht: https://claude.ai/artifact/QXTXUck9XYCFmckxJEQVko
Nach jeder Änderung an Seiten, CSS, JS oder Bildern die Vorschau aktualisieren:

1. `node tools/vorschau.mjs` – baut die ganze Website als **eine** Datei `tools/vorschau/index.html` (nicht im Git) und prüft alle Verweise.
2. Das Artifact einmal lesen (`action: read` mit der URL oben), dann veröffentlichen: dieselbe `url`, `file_path: tools/vorschau/index.html`, **ohne** `files`. Nur eine einzelne Seite lässt sich öffentlich teilen. Ohne `url` entsteht ein zweites Artifact.
3. Dem Nutzer sagen: Im Teilen-Menü des Artifacts unter „Geteilte Version“ die neue Version wählen, sonst sieht der Kunde weiter die alte.

## SEO- & Technik-Standards (nicht verhandelbar)

Grundlage: Technik-Audit vom 05.11.2026 (`seo/AUDIT.md`, `seo/REPORT.md`).

- **Keine Adresse ändern oder löschen** ohne Zeile in `seo/redirect-map.csv` und passende Regel in `vercel.json`: umgezogene Inhalte per Redirect (`permanent: true`, Ziel absolut `https://www.raumrent.de/…`, vor der Slash-Regel einfügen), ersatzlos entfernte per Rewrite auf `/api/gone` (Antwort 410). Nie pauschal auf die Startseite leiten. Danach `npm run seo:redirects` gegen die Vorschau bzw. Produktion.
- **Adressen ohne Schrägstrich am Ende** (`/kontakt`, nicht `/kontakt/`). In `vercel.json` kein `trailingSlash` setzen – die eigene Slash-Regel leitet in einem Hop um.
- **Jede neue Seite bekommt:** Title (ca. 50–60 Zeichen, „Leistung … – Raumrent“), Description (140–160 Zeichen), genau eine H1, `meta robots` (`index, follow, max-image-preview:large`), selbstreferenzierendes Canonical, Open Graph inkl. `og:image:alt`, JSON-LD als `@graph` und interne Links. Im JSON-LD den Knoten `#organization` und `#website` unverändert von einer anderen Seite kopieren; `WebPage.name`/`description` = Title/Description; `BreadcrumbList` wie die sichtbaren Brotkrumen; auf Container-Seiten ein `Service`.
- **Firmendaten im JSON-LD** (`#organization`: Name, Telefon, E-Mail, Adresse, Liefergebiet) stehen in allen 8 Seiten gleich. Ändern sich Telefon, E-Mail oder Adresse, alle 8 Seiten und `llms.txt` anpassen. Nur sichtbare Inhalte auszeichnen, keine Bewertungssterne, kein `HowTo`, `FAQPage` nur bei sichtbarem FAQ.
- **Nach jeder inhaltlichen Änderung** (Text, Bild, Title, Description, JSON-LD) `npm run seo:sitemap` – das setzt `lastmod` nur für wirklich geänderte Seiten.
- **Inhalte immer im HTML**, nie erst per JavaScript nachladen (Suchmaschinen und KI-Crawler lesen kein JS).
- **Bilder** immer mit `alt`, `width`/`height` und AVIF/WebP (siehe Regel oben).
- **Keine neuen Drittanbieter-Dienste** (Schriften, Karten, Videos, Statistik, Pixel) ohne Consent-Prüfung und Anpassung der Datenschutzerklärung.
- **robots.txt:** Such- und KI-Crawler sind erlaubt. Nie `Disallow: /`, nie `noindex` auf Produktion; robots.txt ist kein Werkzeug zum Entfernen aus dem Index.
- **security.txt** (`.well-known/security.txt`): `Expires` jährlich verlängern; `npm run seo:check` warnt 60 Tage vorher.
- **Vor jedem Push:** `npm run seo:check` muss grün sein. Die GitHub Action wiederholt das, misst Lighthouse (≥ 95) und axe und prüft nach jedem Deployment die Live-Seite.

## Prüfen vor dem Commit

1. `npm run seo:check` (bricht bei Fehlern ab).
2. `python3 -m http.server 8000` und die geänderten Seiten bei 390 px, 768 px, 1280 px und 1440 px Breite ansehen.
3. Kein waagerechtes Scrollen auf dem Telefon, alle Bilder laden, Konsole ohne Fehler.
4. Je Seite genau ein `h1`, Überschriften ohne Sprünge, alle Bilder mit `alt`.
5. Commit-Nachricht auf Deutsch, kurz und sachlich.

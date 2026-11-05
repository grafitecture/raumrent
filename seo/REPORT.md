# Abschlussbericht Technik-Maximum raumrent.de

Stand 05.11.2026 · Branch `tech-max` (6 Commits, **nicht** auf `main` gemergt) · Vorschau: `raumrent-git-tech-max-grafitecture.vercel.app` (Vercel-Login nötig)

## 1 Zusammenfassung

Die Seite war technisch schon gut gebaut (statisches HTML, keine Drittanbieter, strenge CSP, PageSpeed 100/100/100/100). Die Lücken lagen bei den Altlasten der WordPress-Seite, bei Indexierungs-Details, beim JSON-LD und bei der fehlenden automatischen Prüfung.

| | Vorher (live, `main` b86790d) | Nachher (`tech-max`) |
|---|---|---|
| Lighthouse mobil | Startseite 100 / 100 / 100 / 100 (PageSpeed Insights 05.11.2026 09:01; LCP 1,2 s, CLS 0, TBT 0 ms) | alle 8 Seiten 100 / 100 / 100 / 100 (Lighthouse CI in GitHub Actions, lokal gebaute Dateien) |
| axe (WCAG 2.2 AA) | nicht geprüft | 0 Verstöße auf allen 9 Seiten (CI) |
| Alte Adressen | 5 Regeln, `/feed` pauschal auf Startseite, 2 Hops bei Slash-Varianten, Altlasten mit 404 | 30 Zeilen in `seo/redirect-map.csv`: 14 × 308 (ein Hop), 15 × 410, 1 × Weiterleitung bei IONOS |
| JSON-LD | 1 Objekt nur auf der Startseite | `@graph` auf allen 8 Seiten (LocalBusiness, WebSite, WebPage/ContactPage, BreadcrumbList, 4 × Service, Person) |
| Sitemap | `lastmod` überall 15.10. (falsch) | automatisch aus Inhalts-Fingerabdruck |
| KI-Crawler | nur `User-agent: *` | eigene Gruppen für 15 Such-/KI-Such- und 7 Trainings-Crawler, `llms.txt` |
| Automatische Prüfung | keine | `npm run seo:check` + GitHub Action (Lighthouse, axe, Live- und Redirect-Check, IndexNow) |

Behoben sind alle Lücken aus `seo/AUDIT.md` bis auf vier bewusste Restpunkte (⚠️ in der Tabelle). Was nur du erledigen kannst, steht in Abschnitt 4.

## 2 Prüfpunkte mit Beleg

Belege gegen die Vorschau `raumrent-j2amp9xlu-grafitecture.vercel.app` (Commit 309965a) über die Vercel-API (ohne Folgen der Weiterleitung). `curl` war aus der Arbeitsumgebung nicht möglich (Netz gesperrt), die Abrufe liefern aber Status und Header 1:1.

| Prüfpunkt | Status | Beleg |
|---|---|---|
| Alte Adresse mit Slash, 1 Hop | ✅ | `GET /impressum/` → `308 location: https://www.raumrent.de/impressum` |
| Slash-Variante neuer Seiten, 1 Hop | ✅ | `GET /buerocontainer/` → `308 location: https://www.raumrent.de/buerocontainer` |
| PDF umgezogen | ✅ | `GET /wp-content/uploads/2025/05/RAUMRENT_AMB.pdf` → `308 location: https://www.raumrent.de/downloads/RAUMRENT_AMB.pdf` |
| WordPress-Teilsitemaps | ✅ (vorher 13 × 404) | `GET /wp-sitemap-users-1.xml` → `308 location: https://www.raumrent.de/sitemap.xml` |
| Entfernte Inhalte 410, ohne Umweg über Slash-Regel | ✅ (vorher 404) | `GET /author/martinschweppe/` → `410 Gone`, `x-robots-tag: noindex`, Inhalt der 404-Seite |
| WordPress-Systempfade | ✅ (vorher 403/308→404) | `GET /wp-login.php` → `410 Gone` |
| Kein Pauschal-Redirect auf Startseite | ✅ | `/feed` geht jetzt auf 410 statt `/`; `seo:check` warnt bei neuen Startseiten-Zielen |
| Echte 404 | ✅ | `GET /gibt-es-nicht-test` → `404` (live, vorher wie nachher) |
| Vorschauen nicht indexierbar | ✅ | jede Antwort der Vorschau trägt `x-robots-tag: noindex` (Vercel) + Login-Schutz |
| Produktion indexierbar | ✅ | live `www.raumrent.de/` ohne `x-robots-tag`; `seo:check` verbietet `noindex` außerhalb der 404-Seite, `seo:live` prüft es nach jedem Deployment |
| robots.txt | ✅ | `GET /robots.txt` → 200, Gruppen für Such-, KI-Such- und Trainings-Crawler, `Disallow: /api/`, `Sitemap: https://www.raumrent.de/sitemap.xml` |
| sitemap.xml mit echtem lastmod | ✅ | `node scripts/build-sitemap.mjs --check` → `✔ sitemap.xml aktuell (8 Adressen)` |
| Canonical, Title, Description, H1, OG, JSON-LD je Seite | ✅ | `npm run seo:check` → `✔ … 0 Fehler, 2 Hinweise` (Hinweise: Titles von Impressum 20 und Datenschutz 22 Zeichen, bewusst kurz) |
| Interne Links ohne 404/Redirect | ✅ | `seo:check`: 600+ Verweise inkl. `srcset`, Anker und `llms.txt` geprüft |
| Inhalt ohne JavaScript | ✅ | Kerntexte und JSON-LD im ausgelieferten HTML; `seo:live` prüft es nach jedem Deployment |
| llms.txt | ✅ (vorher 5 × 404) | `GET /llms.txt` → 200, `x-robots-tag: noindex` |
| security.txt | ✅ (vorher 12 × 404) | `GET /.well-known/security.txt` → 200, `Contact: mailto:manuel.loth@raumrent.de`, `Expires: 2027-11-05` |
| IndexNow-Schlüssel | ✅ | `GET /43cc5470391640f75ffe3bc72ddd5263.txt` → 200, Inhalt = Schlüssel |
| Sicherheits-Header | ✅ | auf allen Antworten: CSP inkl. `require-trusted-types-for 'script'`, HSTS, `nosniff`, Referrer-Policy, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, Permissions-Policy **ohne** `interest-cohort` |
| Interne Dateien nicht ausgeliefert | ✅ | `seo/`, `scripts/`, `package.json`, `lighthouserc*.json` in `.vercelignore`; live `/.git/config`, `/README.md`, `/vercel.json` → 404 |
| Fließtext mobil ≥ 16 px | ✅ (vorher 15 px) | `--fs-p: 1rem`; Playwright bei 360/390/768/1280/1440 px: kein waagerechtes Scrollen, keine Überlappung im Kopf, keine Konsolenfehler |
| Tastatur | ✅ | Playwright: Skip-Link zuerst, springt in `main`; Fokus überall sichtbar; Menü mit Enter auf, Escape zu, Fokus zurück auf die Taste |
| Kontrast | ✅ | eigener Kontrast-Scan aller Textelemente (0 unter 4,5:1) + axe 0 Verstöße |
| Formular unter Trusted Types | ✅ | Playwright mit CSP-Headern: Vorauswahl `?interesse=buero`, Absenden, Fallback-Text erscheint, Konsole leer |
| Keine Drittanbieter vor Einwilligung | ✅ | Netzwerkliste der Startseite (live): nur `www.raumrent.de` |
| Domain ohne www | ⚠️ | läuft weiter über IONOS (deine Entscheidung). Pfad bleibt erhalten, aber 2 Hops (`http://raumrent.de/impressum/` → IONOS → `www…/impressum/` → `/impressum`); Statuscode der IONOS-Weiterleitung unbekannt. Regel in `vercel.json` ist vorbereitet |
| `/404` direkt aufgerufen | ⚠️ | liefert 200 (so liefert Vercel `404.html` aus); jetzt mit `X-Robots-Tag: noindex` + Meta-noindex, daher unschädlich |
| Großbuchstaben-Varianten (`/Impressum`) | ⚠️ | 404; Vercel kann das nicht allgemein umleiten, in den Logs gab es keine solchen Abrufe |
| `?p=`/`?page_id=`-Adressen | ⚠️ | nicht umgeleitet (keine Abrufe in Logs/Wayback); das Canonical der Startseite neutralisiert sie |
| CI | ✅ | GitHub Actions Run 41996685897: `seo:check` ✔, Lighthouse 8 × 100/100/100/100 ✔, axe 9 × 0 Verstöße ✔ |

## 3 Geänderte Dateien

| Datei | Änderung |
|---|---|
| `vercel.json` | eigene Slash-Regel statt `trailingSlash`, absolute Redirect-Ziele, Teilsitemaps, Host-Regeln (raumrent.de, vercel.app-Aliasse), Rewrites auf `/api/gone`, Header (COOP, Permissions-Policy, Trusted Types, noindex für llms.txt//404//api) |
| `api/gone.js` | neu: 410-Antwort mit Inhalt der 404-Seite |
| `robots.txt` | Crawler-Gruppen, `/api/` gesperrt |
| `sitemap.xml` | jetzt erzeugt, `lastmod` 05.11.2026 (alle Seiten haben neue Meta-Daten bzw. JSON-LD) |
| `llms.txt`, `.well-known/security.txt`, `43cc…5263.txt` | neu |
| 8 Seiten (`index.html`, je `index.html` der Unterseiten) | `meta robots`, `og:image:alt`, JSON-LD `@graph`, `site.css?v=5`, Titles/Descriptions (unten) |
| `404.html` | `og:image:alt`, `site.css?v=5` |
| `assets/css/site.css` | `--fs-p` 1rem (vorher mobil 0.938rem) |
| `scripts/*.mjs`, `package.json`, `lighthouserc*.json`, `.github/workflows/seo.yml` | Prüfskripte und CI |
| `seo/*` | Audit, URL-Listen, Redirect-Map, Sitemap-Zustand, Content-Empfehlungen, dieser Bericht |
| `CLAUDE.md`, `README.md` | Dauerregeln und Doku |
| `.vercelignore`, `.gitignore` | interne Dateien nicht veröffentlichen |

### Alle Textänderungen (bitte freigeben)

Sichtbare Texte auf der Seite sind **unverändert**. Geändert wurden nur Texte für Suchergebnisse und Link-Vorschauen (`<title>`, `meta description`, `og:title`, `og:description`) und zwar nur dort, wo sie zu kurz, zu lang oder gleich der H1 waren. Neu ist `og:image:alt` auf allen Seiten.

| Seite | Feld | Vorher | Nachher |
|---|---|---|---|
| `/` | Title | Raumrent – Mobile Raumsysteme (29) | Container mieten oder kaufen im Raum Mannheim – Raumrent (56) |
| `/` | Description | Ihr zuverlässiger Partner für die Vermietung und den Verkauf von Containern und mobilen Raumsystemen. (101, = H1) | Vermietung und Verkauf von Büro-, Lager-, Sanitär- und Spezialcontainern sowie mobilen Raumsystemen – schnell geliefert an jeden Standort. Jetzt anfragen. (154) |
| `/buerocontainer` | Description | Raumrent ist dein zuverlässiger Partner für Bürocontainer im Raum Mannheim und Umgebung. (88) | Bürocontainer mieten oder kaufen im Raum Mannheim: als Baustellenbüro, Verwaltungsraum oder Büroerweiterung, geliefert im Umkreis von 150 km. Jetzt anfragen. (157) |
| `/lager-und-seecontainer` | Title | Lager- & Seecontainer mieten oder kaufen – flexibel mit Raumrent (64) | Lager- & Seecontainer mieten oder kaufen – Raumrent (51) |
| `/lager-und-seecontainer` | Description | Raumrent ist dein Ansprechpartner für Lagercontainer und Seecontainer im Raum Mannheim und Umgebung. (100) | Lager- und Seecontainer in 10 ft und 20 ft mieten oder kaufen im Raum Mannheim: wind- und wasserdicht, abschließbar, kurzfristig lieferbar. Jetzt anfragen. (155) |
| `/sanitaercontainer` | Title | Sanitärcontainer – Mobile Sanitärlösungen für jeden Bedarf – Raumrent (69) | Sanitärcontainer mieten oder kaufen – Raumrent (46) |
| `/sanitaercontainer` | Description | Unsere Sanitärcontainer sind sofort einsatzbereit und mit modernen WC- und Duschsystemen ausgestattet. (102) | Sanitärcontainer mieten oder kaufen im Raum Mannheim: WC-, Dusch- und barrierefreie Lösungen, anschlussfertig oder mit Fäkalientank. Jetzt anfragen. (148) |
| `/containeranlagen` | Title | Containeranlagen mieten oder kaufen – modulare Raumlösungen mit Raumrent (72) | Containeranlagen mieten oder kaufen – Raumrent (46) |
| `/kontakt` | Title | Kontakt – Raumrent (18) | Kontakt & Anfrage: Container mieten oder kaufen – Raumrent (58) |
| `/kontakt` | Description | Anfrage an raumrent: Büro- & Wohncontainer, Lager- & Seecontainer, Sanitärcontainer und Containeranlagen mieten oder kaufen. (124) | … wie vorher + „ Ansprechpartner: Manuel Loth.“ (154) |
| `/impressum` | Description | Impressum der Raumrent GmbH, Industriestraße 14a, 66740 Saarlouis. (66) | … wie vorher + „ Geschäftsführer Paul Kast, Amtsgericht Saarbrücken, HRB 111150.“ (130) |
| `/datenschutz` | Description | Datenschutzhinweise der Raumrent GmbH. (38) | Datenschutzhinweise der Raumrent GmbH: Hosting bei Vercel, Server-Logfiles, keine Cookies, Anfrage per E-Mail und Ihre Rechte nach der DSGVO. (141) |
| alle 9 | `og:image:alt` | – | Zweigeschossige Containeranlage aus hellgrauen Modulen mit blauem raumrent-Aufkleber |

Alle Angaben stammen aus dem sichtbaren Text der jeweiligen Seite. Unverändert: Title Bürocontainer, Description Containeranlagen, Titles Impressum/Datenschutz, alle H1 und Fließtexte. Neue Texte außerdem in `llms.txt` (Zusammenfassung aus Seiteninhalten) und im JSON-LD (`serviceType` je Containerart).

## 4 Deine To-dos

1. **Freigabe und Merge:** Textänderungen oben prüfen (ggf. mit Manuel Loth), dann `tech-max` nach `main` mergen. Danach laufen automatisch Live-Check, Redirect-Check, Lighthouse gegen www.raumrent.de und IndexNow.
2. **Vercel → GitHub-Secret:** In Vercel unter *Settings → Deployment Protection → Protection Bypass for Automation* einen Schlüssel erzeugen und in GitHub als Repository-Secret `VERCEL_AUTOMATION_BYPASS_SECRET` hinterlegen. Ohne ihn überspringt die CI die Live-Checks auf Vorschauen (Produktion wird trotzdem geprüft).
3. **Domain ohne www (IONOS):** im Mac-Terminal prüfen: `curl -sI http://raumrent.de/impressum/` und `curl -sI https://raumrent.de/`. Erwartet: `301` (nicht 302 oder Frame) und ein gültiges Zertifikat für `https://raumrent.de`. Besser bleibt: A-Record von raumrent.de auf `216.150.1.1` und Domain im Vercel-Projekt anlegen – die Regel in `vercel.json` ist schon da, dann geht alles in einem Hop.
4. **Google Search Console:** Domain-Property `raumrent.de` per DNS-TXT (IONOS) bestätigen, `https://www.raumrent.de/sitemap.xml` einreichen, URL-Prüfung für Startseite und die 4 Container-Seiten anstoßen. GSC-Exporte (Leistung, Seiten) nach `seo-input/` legen, dann prüfe ich die Redirect-Map erneut.
5. **Bing Webmaster Tools:** Website aus GSC importieren.
6. **Google-Unternehmensprofil** für „Raumrent GmbH – Büro & Lager Mannheim“ anlegen bzw. prüfen; Link für `sameAs` an mich.
7. **Strukturierte Daten manuell validieren:** Rich Results Test und validator.schema.org für `/`, `/buerocontainer` und `/kontakt` (nach dem Merge).
8. **Inhalte:** `seo/content-empfehlungen.md` mit Manuel Loth durchgehen (Schreibweise Raumrent/raumrent, Adresse auf allen Seiten, Über-uns-Seite, Fakten, FAQ).
9. **BFSG:** prüfen lassen, ob raumrent darunter fällt (eher nicht: B2B, Anfrage nur per E-Mail). Technisch erfüllt die Seite WCAG 2.2 AA laut axe/Lighthouse.
10. **Vorschau-Artifact:** nach dem Merge neu veröffentlichen (Ablauf in `CLAUDE.md`) – sag Bescheid, dann mache ich das.
11. **security.txt:** `Expires` bis spätestens 05.11.2027 verlängern (`seo:check` warnt ab September 2027).

## 5 Go-Live & Monitoring

Die neue Seite ist seit 21.10.2026 live, die Umschaltung ist also schon passiert. Mit dem Merge:

- [ ] `npm run seo:redirects` gegen Produktion (läuft automatisch in der CI, Bericht als Artefakt)
- [ ] Sitemap in GSC und Bing einreichen; `/wp-sitemap.xml` leitet auf die neue Sitemap weiter, Crawler finden so die neuen Adressen
- [ ] 14 Tage täglich GSC „Seiten“: 404, Soft-404, Weiterleitungsfehler, „Gecrawlt – zurzeit nicht indexiert“; fehlende alte Adressen in `seo/redirect-map.csv` + `vercel.json` nachtragen
- [ ] Vercel-Logs (Observability → Requests, Filter Status 404) wöchentlich auf neue Altadressen prüfen; Bot-Zugriffe (Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot) beobachten
- [ ] Uptime-Monitoring und Warnung vor SSL-Ablauf einrichten (z. B. Vercel-Benachrichtigungen; für raumrent.de bei IONOS auch das IONOS-Zertifikat)
- [ ] Nach 4–8 Wochen: GSC-Klicks/Impressionen und Lighthouse mit diesem Bericht vergleichen. Baseline: noch keine GSC-Daten, Lighthouse 100/100/100/100

## 6 Offene Risiken und Annahmen

- **Keine GSC- und Backlink-Daten.** Die alten Adressen stammen aus dem Wayback-Archiv und 15 Tagen Vercel-Logs. Eine alte Adresse mit Backlink, die in diesem Zeitraum nicht abgerufen wurde, kann fehlen.
- **raumrent.de ohne www** bleibt bei IONOS: zwei Hops, Statuscode unbekannt (siehe To-do 3).
- **Redirect-Ziele sind absolut** (`https://www.raumrent.de/…`). Auf Vorschauen führen Weiterleitungen deshalb auf die Live-Seite – gewollt, damit jeder Host in einem Hop ankommt.
- **410 über eine Vercel Function** (`api/gone.js`): vernachlässigbare Kosten; Antworten werden 1 Tag im CDN zwischengespeichert. Fällt die Function aus, käme 500 statt 410 – `seo:live` prüft `/sample-page` nach jedem Deployment.
- **Trusted Types** sind erzwungen. Künftiges JavaScript mit `innerHTML` o. Ä. würde blockiert (Regel steht in `CLAUDE.md`).
- **Lighthouse in der CI** misst gegen einen lokalen Server auf GitHub-Rechnern; Messwerte schwanken. Grenze 95 lässt Luft, ein einzelner Ausreißer kann trotzdem rot werden – dann Lauf wiederholen.
- **axe** wartet 2 s, weil der blaue Aufkleber auf der Startseite eingeblendet wird (während der Animation ist der Kontrast kurz niedriger; im Endzustand 6,78 : 1).
- **Titles Sanitär/Containeranlagen** mit 46 Zeichen etwas unter 50 – bewusst knapp statt erfundener Zusätze.
- **lastmod** steht für alle Seiten auf 05.11.2026, weil sich Meta-Daten und JSON-LD überall geändert haben. Ab jetzt ändert er sich nur bei echten Inhaltsänderungen.
- **Kein Merge, kein Push auf `main`**, keine Änderung an Vercel-Einstellungen oder DNS.

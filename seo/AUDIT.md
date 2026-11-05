# Ist-Audit raumrent.de (Phase 1, 05.11.2026)

Stand: `main` @ b86790d, live unter https://www.raumrent.de (Vercel). Es wurde nichts geändert.

## Stack & Hosting

| Punkt | Befund |
|---|---|
| Framework | keins – statisches HTML/CSS/JS, kein Build-Schritt (Vercel-Preset „Other“) |
| Rendering | statisch (SSG-gleichwertig). Alle Texte, Navigation, Kontaktdaten und JSON-LD stehen im ausgelieferten HTML; JavaScript nur für Menü, Formular, Jahreszahl |
| Output-Ordner | Repo-Root; `.vercelignore` nimmt `tools/`, `README.md`, `CLAUDE.md`, `.github` heraus |
| Vercel-Projekt | `raumrent` (Team Grafitecture), Production-Domain `www.raumrent.de` (CNAME, verifiziert), Aliasse `raumrent-grafitecture.vercel.app`, `raumrent-git-main-grafitecture.vercel.app` |
| Deployment-Schutz | Vercel Authentication für alle Deployments außer eigenen Domains (Previews nur mit Login) |
| Domain ohne www | `raumrent.de` ist **nicht** im Vercel-Projekt. DNS bei IONOS, A-Record 217.160.0.250 = IONOS-Weiterleitung auf `https://www.raumrent.de/…` (Pfad bleibt erhalten, Statuscode von hier nicht messbar) |
| Firewall | keine eigenen Regeln, kein Bot-Schutz aktiv → KI-/Such-Crawler werden nicht geblockt |
| Altes System | WordPress + Elementor (Theme Hello Elementor) unter `www.raumrent.de`, seit 21.10.2026 ersetzt |

## Datenquellen für alte URLs

`seo-input/` gibt es nicht (keine GSC-, Crawl- oder Backlink-Exporte). Genutzt wurden: Wayback-Archiv (CDX-Abfrage für raumrent.de), Vercel-Zugriffsdaten 21.10.–05.11.2026 (alle 404 und 3xx), bestehende Regeln in `vercel.json`. Ergebnis: `seo/urls-alt.csv`. Die alte Seite hatte nur drei Inhaltsseiten (Start, Impressum, Datenschutz), eine Autorenseite, die WordPress-Beispielseite, Feeds, Sitemaps und zwei PDFs.

## Prüfpunkte

✅ erfüllt · ⚠️ teilweise · ❌ fehlt

| # | Prüfpunkt | Status | Fundstelle / Beleg |
|---|---|---|---|
| **2 URL & Redirects** | | | |
| 2.1 | HTTPS, eine Host-Variante (www) | ⚠️ | www ok; `raumrent.de` nur über IONOS-Weiterleitung, nicht über Vercel |
| 2.1 | Slash-Schema einheitlich (ohne Slash) | ✅ | `vercel.json` `trailingSlash: false`, Links/Canonicals/Sitemap ohne Slash |
| 2.1 | Varianten in einem Hop | ⚠️ | `trailingSlash` läuft bei Vercel vor den eigenen Redirects → `/feed/`, `/wp-admin/` brauchen 2 Hops; `raumrent.de/impressum/` → IONOS → Vercel = 2 Hops |
| 2.2 | Redirect-Map vorhanden | ❌ | keine `seo/redirect-map.csv`; 5 Regeln direkt in `vercel.json` |
| 2.2 | Kein Pauschal-Redirect auf Startseite | ⚠️ | `/feed` → `/` (Feed hat keinen Ersatz → sollte 410 sein) |
| 2.2 | 410 für entfernte Inhalte | ❌ | `/author/martinschweppe` (14×), `/sample-page` (3×), Feeds liefern 404 |
| 2.2 | WordPress-Teilsitemaps | ❌ | `/wp-sitemap-posts-page-1.xml`, `/wp-sitemap-users-1.xml` je 13× 404 |
| 2.2 | PDFs weitergeleitet | ✅ | `/wp-content/uploads/2025/05/RAUMRENT_AMB.pdf` / `…AVLB.pdf` → `/downloads/…` (308) |
| 2.2 | Bot-Pfade nicht weiterleiten | ⚠️ | `/wp-admin/`, `/wp-json/` bekommen erst 308, dann 404; `/wp-login.php`, `/xmlrpc.php` 403 (Vercel) |
| 2.3 | `*.vercel.app` → Hauptdomain | ⚠️ | durch Login-Schutz unerreichbar für Bots, aber keine Host-Weiterleitung |
| 2.6 | Redirect-Test-Skript | ❌ | fehlt |
| **3 Statuscodes** | | | |
| 3 | Echte 404 | ✅ | `/gibt-es-nicht-test` → 404 mit eigener Seite (`404.html`, `noindex`) |
| 3 | 404-Seite mit Navigation, Kontakt | ✅ | Kopf, Fuß, Links Start/Kontakt |
| 3 | `/404` selbst | ⚠️ | liefert 200 (Vercel liefert `404.html` unter `/404` aus); `noindex` im HTML |
| 3 | Interne Links ohne 404/Redirect | ✅ | alle `href`/`src` zeigen auf vorhandene Dateien (geprüft mit Skript) |
| **4 Indexierung** | | | |
| 4 | robots.txt | ⚠️ | vorhanden, `Sitemap:` absolut; keine expliziten Gruppen für Such-/KI-Crawler |
| 4 | Previews nicht indexierbar | ✅ | `raumrent-grafitecture.vercel.app` liefert `x-robots-tag: noindex` (Vercel) + Login-Schutz |
| 4 | Produktion nie noindex | ✅ | `www.raumrent.de/` ohne `x-robots-tag`, kein `noindex` im HTML; aber kein automatischer Check |
| 4 | sitemap.xml | ⚠️ | 8 URLs, handgepflegt; `lastmod` überall 2026-10-15, obwohl Impressum/Datenschutz am 20. und 31.10. geändert wurden |
| 4 | Canonical selbstreferenzierend, absolut | ✅ | alle 8 Seiten |
| 4 | Meta-Robots `max-image-preview:large` | ❌ | fehlt |
| 4 | hreflang | – | nur Deutsch, `<html lang="de">` ✅ |
| 4 | IndexNow | ❌ | fehlt |
| **5 On-Page** | | | |
| 5 | Title einzigartig | ✅ | 8 verschiedene |
| 5 | Title-Länge 50–60 | ⚠️ | Start 29, Kontakt 18 (zu kurz); Lager 64, Sanitär 69, Containeranlagen 72 (zu lang); Impressum 20, Datenschutz 22 (Rechtsseiten, akzeptabel) |
| 5 | Description einzigartig | ✅ | |
| 5 | Description-Länge 140–160 | ⚠️ | Start 101, Büro 88, Lager 100, Sanitär 102, Kontakt 124, Impressum 66, Datenschutz 38; nur Containeranlagen 146 ✅ |
| 5 | Genau eine H1, keine Sprünge | ✅ | alle 9 Dateien |
| 5 | Semantisches HTML, Landmarks | ✅ | `header`, `nav`, ein `main`, `footer`, `section` mit Überschrift |
| 5 | Echte Links, `noopener` | ✅ | einziges `target="_blank"` (Grafitecture-Feld) mit `rel="noopener"` |
| 5 | Breadcrumbs sichtbar | ✅ | auf allen Unterseiten (`nav.crumbs`) |
| 5 | Bilder (alt, Maße, AVIF/WebP, srcset, lazy, LCP priorisiert) | ✅ | 35 `img`, alle mit `alt`, `width`/`height`; Hero mit `fetchpriority="high"` + Preload |
| 5 | Open Graph / Twitter | ⚠️ | vollständig, aber ohne `og:image:alt` |
| 5 | Icons & Manifest | ✅ | `favicon.ico` (16/32/48), SVG, `apple-touch-icon` 180×180, Manifest 192/512/maskable, `theme-color` |
| 5 | Schrift mobil ≥ 16 px | ⚠️ | Fließtext `--fs-p` 15 px bei 360 px, 16 px ab 1440 px |
| **6 JSON-LD** | | | |
| 6 | Organisation / LocalBusiness | ⚠️ | nur Startseite, einzelnes Objekt ohne `@graph`/`@id`, ohne `legalName`, `contactPoint` |
| 6 | WebSite, WebPage, BreadcrumbList, Service, Person | ❌ | fehlen auf allen Seiten |
| **7 KI** | | | |
| 7.1 | Explizite Crawler-Gruppen | ❌ | nur `User-agent: *` |
| 7.2 | Inhalt ohne JavaScript | ✅ | Kerntexte im HTML (per Abruf geprüft) |
| 7.3 | Antwortfreundliche Struktur | ⚠️ | siehe `seo/content-empfehlungen.md` (folgt in Phase 7) |
| 7.4 | llms.txt | ❌ | fehlt (5 Abrufe auf 404) |
| **8 Performance** | | | |
| 8 | Lighthouse mobil Startseite | ✅ | PageSpeed Insights 05.11.2026 09:01: Leistung 100, Barrierefreiheit 100, Best Practices 100, SEO 100; FCP 0,9 s, LCP 1,2 s, TBT 0 ms, CLS 0, SI 2,2 s |
| 8 | Felddaten (CrUX) | – | noch keine (zu wenig Besucher) |
| 8 | Fonts lokal, WOFF2, swap, Preload | ✅ | Noto Sans variabel, `latin` 60 KB vorgeladen, `latin-ext` nur bei Bedarf |
| 8 | Caching | ✅ | Bilder/Fonts 1 Jahr `immutable`; CSS/JS 1 h (Versionierung über `?v=`); HTML `max-age=0, must-revalidate` |
| 8 | Render-blockierendes CSS | ⚠️ | 1 Datei, 8,5 KB gzip; PSI schätzt 300 ms Einsparung (ohne Einfluss auf die Note) |
| **9 Sicherheit** | | | |
| 9 | HSTS, nosniff, Referrer, Frame-Options, CSP | ✅ | CSP scharf, nur eigene Quellen |
| 9 | Permissions-Policy | ⚠️ | enthält veraltetes `interest-cohort` (Chrome meldet „Unrecognized feature“) |
| 9 | security.txt | ❌ | fehlt (12 Abrufe auf 404) |
| 9 | Interne Dateien | ✅ | `/.gitignore`, `/vercel.json`, `/README.md`, `/.git/config` → 404 |
| **10 Barrierefreiheit** | | | |
| 10 | Skip-Link, Fokus sichtbar, Landmarks, Labels, autocomplete | ✅ | `:focus-visible` 3 px, Formular mit `label`/`fieldset`/`legend` |
| 10 | reduced motion | ✅ | `scroll-behavior` nur bei `no-preference` |
| 10 | axe in CI | ❌ | keine CI |
| **11 Datenschutz-Technik** | | | |
| 11 | Keine Drittanbieter beim ersten Laden | ✅ | Netzwerkliste Startseite: nur `www.raumrent.de` |
| 11 | Kein Consent-Banner nötig | ✅ | keine Cookies, kein Tracking |
| 11 | Impressum/Datenschutz mit einem Klick | ✅ | Fuß jeder Seite |
| **12 CI** | | | |
| 12 | `npm run seo:check`, GitHub Action | ❌ | fehlt |

## Fragen und Entscheidungen (05.11.2026)

| Parameter | Wert | Herkunft |
|---|---|---|
| `DOMAIN` | https://www.raumrent.de | Projekt, Canonicals |
| `HOST` | www | wie live |
| `TRAILING_SLASH` | nein | Entscheidung Martin (bewusst abweichend vom WordPress-Default) |
| `HOSTING` | vercel | Projekt |
| `ALTE_DOMAIN` | keine (gleiche Domain) | – |
| `ALTES_SYSTEM` | wordpress (Elementor) | Wayback, Projekt |
| `SPRACHEN` | de | Projekt |
| `TYP` | lokal | Raum Mannheim, 150 km |
| `KI_TRAINING` | erlauben | Default |
| `BFSG_PFLICHTIG` | prüfen | Default; WCAG 2.2 AA wird trotzdem umgesetzt |
| Domain ohne www | bleibt bei der IONOS-Weiterleitung | Entscheidung Martin; Regel in `vercel.json` wird vorbereitet |
| `security.txt`-Kontakt | manuel.loth@raumrent.de | Entscheidung Martin |
| Fließtext mobil | auf 16 px anheben | Entscheidung Martin |

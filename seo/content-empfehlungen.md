# Inhalts-Empfehlungen raumrent.de (Phase 7.3)

Stand 05.11.2026. **Nur Empfehlungen, nichts davon ist umgesetzt.** Texte kommen laut `CLAUDE.md` von Manuel Loth. Jede Änderung braucht seine Freigabe.

Ziel: Suchmaschinen und KI-Antwortsysteme (ChatGPT, Claude, Perplexity, Google AI Overviews) sollen raumrent eindeutig erkennen und die Seiten als Quelle zitieren können. Dafür braucht jede Seite eindeutige, überprüfbare Fakten, die auch ohne den restlichen Seitentext verständlich sind.

## Seitenübergreifend

1. **Firmenname einheitlich schreiben (NAP).** Bisher stehen drei Schreibweisen nebeneinander: Impressum und Datenschutz schreiben „Raumrent GmbH“ (so steht es im Handelsregister), Kontakt und Fuß „raumrent GmbH“, die Titles „Raumrent“. Vorschlag: im Fließtext immer „Raumrent GmbH“, das Logo bleibt klein geschrieben. Das JSON-LD führt derzeit beide Schreibweisen (`name` / `legalName`).
2. **Zwei Adressen einordnen.** Firmensitz ist Saarlouis (Impressum), Büro und Lager sind in Mannheim (Kontakt). Ein Satz wie „Firmensitz Saarlouis, Büro und Lager in Mannheim“ an einer Stelle, die auf jeder Seite sichtbar ist (z. B. im Fuß), verhindert, dass Google oder KI-Systeme die Adressen verwechseln. Die Mannheimer Adresse steht bisher nur auf `/kontakt`.
3. **Anrede vereinheitlichen.** Startseite und Rechtstexte siezen, die vier Container-Seiten duzen. Für B2B-Kunden (Bau, Industrie) wirkt durchgehendes „Sie“ meist passender.
4. **Seite „Über uns“ fehlt.** Gründung (eingetragen 02.04.2025), Geschäftsführung, Standorte, Team bzw. Ansprechpartner, Qualifikationen und Einzugsgebiet. KI-Systeme bewerten genau diese Angaben, wenn sie entscheiden, ob ein Anbieter vertrauenswürdig ist.
5. **Echte Projektfotos und Referenzen.** Alle Bilder sind als KI-generiert gekennzeichnet. Zwei bis drei echte Projekte (Ort, Art der Anlage, Mietdauer) mit Fotos wären der stärkste Vertrauensbeweis.
6. **Google-Unternehmensprofil** für „Raumrent GmbH – Büro & Lager Mannheim“ anlegen und gleich schreiben wie auf der Website. Danach den Link als `sameAs` ins JSON-LD aufnehmen (bitte URL mitteilen). Dasselbe gilt für LinkedIn oder andere Profile, falls vorhanden.

## Startseite `/`

- Der erste Absatz (H1) beantwortet „wer und was“, aber nicht „wo“. Ein kurzer Satz mit „im Umkreis von 150 km um Mannheim“ (steht schon auf allen Unterseiten) würde die Startseite für regionale Suchen und KI-Antworten eindeutig machen.
- Kontakt-Teaser: Adresse „Büro & Lager: Düsseldorfer Str. 29, 68219 Mannheim“ ergänzen (wie auf `/kontakt`).
- „Spezialcontainer“ werden genannt, haben aber keine eigene Seite und keine Erklärung. Entweder kurz erklären, was gemeint ist, oder den Begriff weglassen.
- Zubehör (Mobiliar, Treppen und Podeste, Überdachungen) hat nur Bildunterschriften. Ein Satz je Zubehör hilft bei Suchen wie „Containertreppe mieten Mannheim“.

## Bürocontainer, Lager- & Seecontainer, Sanitärcontainer, Containeranlagen

- **Konkrete Fakten ergänzen**, die Kunden vergleichen: Maße und Größen (bei Lagercontainern steht „10ft, 20ft“, bei den anderen fehlt das), typische Mindestmietdauer, Lieferzeit (z. B. „in der Regel innerhalb von x Werktagen“), ob Aufstellung, Fundament oder Kran dazugehören, Preisrahmen oder „ab“-Preise für die Miete.
- **Echte Kundenfragen als Abschnitt** (sichtbar, nicht nur im Code), z. B. „Brauche ich für einen Bürocontainer eine Baugenehmigung?“, „Was kostet ein Sanitärcontainer pro Monat?“, „Wie lange dauert die Lieferung?“. Die Antworten muss raumrent liefern. Als sichtbares FAQ kann es dann auch als `FAQPage` ausgezeichnet werden (Google zeigt seit 7. Mai 2026 keine FAQ-Rich-Results mehr, das Markup hilft aber beim Verständnis).
- Abschnitte sollen für sich allein verständlich sein. Die Überschrift „Weitere Container“ ist in Ordnung; „Deine Vorteile mit Raumrent“ könnte z. B. „Vorteile von Bürocontainern bei Raumrent“ heißen.
- Die Ortslisten wechseln von Seite zu Seite (mal mit Mainz und Darmstadt, mal mit Ludwigshafen und Kaiserslautern). Eine einheitliche Liste des Liefergebiets wäre klarer.

## Kontakt `/kontakt`

- Erreichbarkeit (Telefonzeiten) ergänzen. Erst dann können Öffnungszeiten ins JSON-LD (`openingHoursSpecification`).
- Die E-Mail aus dem Impressum (info@raumrent.de) und die Kontakt-Mail (manuel.loth@raumrent.de) sind verschieden. Das ist in Ordnung, sollte aber gewollt sein.

## Impressum, Datenschutz

- Keine inhaltlichen Empfehlungen (Rechtstexte prüft die Rechtsberatung). Technisch ist alles in Ordnung.

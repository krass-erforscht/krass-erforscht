# Strategie: Was der Algorithmus belohnt

Lebendes Dokument. Wird nach jeder Analyse (`node analyse.js`) aktualisiert.
Status: **bestätigt** (immer anwenden) · **im Test** (abwechselnd anwenden und vergleichen) · **verworfen**.
Höchstens 6 Regeln. Eine Regel gilt erst als bestätigt, wenn sie in mindestens 3 Posts mit und 3 ohne getestet wurde und klar besser ist.

## Was Instagram laut Fachseiten 2026 belohnt (Montags-Recherche)
- Teilen per Direktnachricht, Speichern und Wiedergabezeit zählen mehr als Likes.
- Bei Reels entscheidet der Anfang: Wer in den ersten Sekunden wegwischt, senkt die Verbreitung.
- Nicht-Follower sehen vor allem Reels; Karussells erreichen eher bestehende Follower.

## Regeln

1. **Video zuerst** – bestätigt (2026-11-10): Video-Posts im Mittel 175 erreichte Konten (7 Posts), reine Bilder 13 (3 Posts).
   Immer gründlich nach Video suchen; notfalls `bilder-video.js`.
2. **Bis zum Ende schauen lassen** – im Test (seit 2026-11-10): Je größer der Anteil, der vom Video geschaut wird, desto mehr Reichweite
   (Rangkorrelation 0,6). Video-Reel möglichst **10–15 Sekunden**, stärkste Szene zuerst, keine ruhigen Einstiege.
   Test-Kurzname: `kurzes-video`.
3. **Konkrete Zahl in der Überschrift** – im Test (seit 2026-11-10): Die zwei Posts mit Zahl im Titel liefen am besten
   („115 Millionen Jahre alt“), aber nur 2 Posts, einer davon viral. Überschrift mit einer überraschenden, echten Zahl aus der Quelle.
   Test-Kurzname: `zahl-im-titel`.
4. **Zum Teilen und Speichern bringen** – im Test (seit 2026-11-10): Teilen+Speichern liegt fast überall bei 0.
   Letzte Folie / Caption mit konkretem Anlass zum Teilen („Schick das jemandem, der …“) und ein Fakt, den man sich merken will.
   Test-Kurzname: `teilen-anreiz`.

## Uhrzeit Instagram
- Seit 2026-11-10 vier Fenster: 7:45, 12:15, 18:15 und neu 20:45 Uhr (Abendstunden sind laut Fachseiten für deutsches Publikum stark).
- Verglichen wird die Reichweite im Verhältnis zum Median des Formats (Bilder-Posts liefen viel schlechter und lagen oft morgens –
  ohne diese Korrektur hätte das die Uhrzeit verfälscht). Stand 2026-11-10: morgens 1,46×, abends 1,0×, mittags 0,61×, spät noch ungetestet.

## YouTube
- Echte Video-Shorts laufen weit besser als Folien-Reels: CO₂-Short 1.085 Aufrufe, Feuersalamander 755, Folien-Reels 1–22 (Stand 2026-11-10).
  → Folien-Reels werden auf YouTube nicht mehr hochgeladen (Nutzer hat die schwachen gelöscht, 2026-11-10).
- Abstand: Die ersten Shorts kamen einzeln und liefen gut, 6 Uploads direkt hintereinander (9./10.11.) kaum.
  → Höchstens 2 Shorts pro Tag, mind. 6 Stunden Abstand, per Zeitplan. Später testen, ob 1 pro Tag besser ist als 2.
- Uhrzeit: wird ab jetzt gelernt (Fenster 7, 12, 16, 19, 21 Uhr; Videos erscheinen per Zeitplan zur gewählten Stunde).

## Verlauf
- 2026-11-10: Analyse eingeführt, Regeln 1–4 aufgestellt. Vierte Instagram-Uhrzeit (20:45) ergänzt, YouTube-Statistik und -Uhrzeitwahl eingeführt. YouTube: nur noch Video-Shorts, max. 2/Tag mit 6 h Abstand.

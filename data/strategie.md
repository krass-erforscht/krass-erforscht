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

## Verlauf
- 2026-11-10: Analyse eingeführt, Regeln 1–4 aufgestellt.

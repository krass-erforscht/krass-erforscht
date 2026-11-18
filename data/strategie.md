# Strategie: Was der Algorithmus belohnt

Lebendes Dokument. Wird nach jeder Analyse (`node analyse.js`) aktualisiert.
Status: **bestätigt** (immer anwenden) · **im Test** (abwechselnd anwenden und vergleichen) · **verworfen**.
Höchstens 6 Regeln. Eine Regel gilt erst als bestätigt, wenn sie in mindestens 3 Posts mit und 3 ohne getestet wurde und klar besser ist.

## Was Instagram laut Fachseiten 2026 belohnt (Montags-Recherche)
- 2026-11-16: Keine bestätigte Änderung im November. Mosseri nennt für 2026 „Originalität“ als Ranking-Ziel; Aggregatoren (nur fremde Clips) werden abgewertet, Wasserzeichen anderer Apps schaden. → Unsere erzählten, selbst geschnittenen Videos passen; keine fremden Wasserzeichen.
- Teilen per Direktnachricht, Speichern und Wiedergabezeit zählen mehr als Likes.
- Bei Reels entscheidet der Anfang: Wer in den ersten Sekunden wegwischt, senkt die Verbreitung.
- Nicht-Follower sehen vor allem Reels; Karussells erreichen eher bestehende Follower.

## Vorbilder: erfolgreiche deutsche Wissens-Shorts (YouTube-Auswertung 2026-11-16)
240 Shorts mit den meisten Aufrufen seit Mai 2026 zu „Wissenschaft/Tiere/Weltall/Physik“, davon 153 deutschsprachig, 151 Kanäle.
- Auch kleine Kanäle (1.900–17.000 Abos) holen 0,5–2 Mio. Aufrufe pro Short → Reichweite hängt am Video, nicht an der Größe des Kanals.
- Länge: Median 52 s (meist 25–90 s), fast immer mit Sprecherstimme. Unsere stummen 10–15-s-Videos sind eine andere Klasse.
- Themen: Tiere klar vorn, dann Physik-/Mathe-Rätsel und Weltall. Fast alles **zeitlose Wow-Fakten**, kaum Nachrichten.
- Formate: Listen („5 traurige Fakten über …“, „7 unglaubliche Tiermomente“), Rätsel/Paradox („Ein Dreieck mit 3 rechten Winkeln?!“),
  Superlative („Dieses Tier lässt sogar Löwen zittern“), „Danach siehst du die Welt anders“.
- Titel: emotional, ~70 Zeichen, 62 % mit Emoji (😳🤯😱), 18 % Frage, 22 % Zahl.
Folgerungen (als Tests übernommen): Stimme + 25–45 s erzählte Geschichte testen; Titel/Überschrift emotionaler mit 1 Emoji (aber wahr);
neues Format „Wow-Liste“ (zeitlose Fakten aus seriösen Quellen, v. a. Tiere/Weltall) im Wechsel mit den News.

## Forschung: Was Leute am Video hält (Recherche 2026-11-16)
Belastbar: Guo/Kim/Rubin 2014 (6,9 Mio. Lernvideo-Sitzungen): schnelleres Sprechen (bis ~250 Wörter/Min.) hielt doppelt so lange wie langsames (<166).
Ling et al. 2021 (TikTok, Preprint): Nahaufnahmen/Halbnahe und Text im Bild gehören zu den Merkmalen viraler Clips.
Loewenstein (Neugier-Lücke): Neugier entsteht durch eine Lücke zwischen „was ich weiß“ und „was ich wissen will“ – aber unaufgelöste Teaser verärgern.
Nur Hinweise (Firmendaten, ohne Studienqualität): Sprache im Video +11,7 % 3-Sekunden-Halt (Emplifi); Untertitel +10–20 % Wiedergabezeit;
viele schauen ohne Ton; wer in den ersten 3 Sekunden mehrheitlich wegwischt, wird kaum weiterverteilt.

Schritt-für-Schritt-Plan (je eine Woche testen, dann bewerten):
1. Stimme ab Sekunde 0, Tempo 1,2 (~170 Wörter/Min.), erster Satz = stärkste überraschende Aussage. (seit 2026-11-16)
2. Neugier-Lücke: erster Satz stellt eine Frage oder ein Rätsel, das im Video aufgelöst wird (nie offen lassen).
3. Bildwahl: Nahaufnahme/Detail des Objekts zuerst, keine ruhigen Totalen am Anfang.
4. Text im Bild bleibt (für Ton-aus-Zuschauer); später testen: Wort-für-Wort-Untertitel statt ganzer Sätze.
5. Länge 12–20 s mit Stimme; letzter Satz führt zurück zum Anfang (Schleife) oder stellt eine A-oder-B-Frage.

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

5. **Sprecherstimme im Reel** – bestätigt als feste Richtung (Nutzerentscheidung 2026-11-16, kein Wechsel mehr): Stumme Videos mit Text werden nach 4–6 s weggewischt, Follower kommen keine.
   Ein kurz erzählter Fakt (Stimme C, als KI-Stimme gekennzeichnet) soll länger halten. Feld `video.voice` (ein Satz pro Fakt-Einblendung).
   Test-Kurzname: `stimme`.
6. **Grund zum Folgen** – feste Richtung (Nutzerentscheidung 2026-11-16): 5 Follower bei bis zu 3.800 erreichten Konten. Feste Serie „Täglich ein Wow aus der
   Wissenschaft“: erster Satz/Überschrift als klare Behauptung oder Frage in der ersten Sekunde, Abschluss-Frage leicht beantwortbar (A oder B?),
   CTA „Folge für täglich ein Wow“. Test-Kurzname: `serie`.

Zusatz zu Regel 2 (2026-11-16): Videos bis 15 s erreichen im Mittel 175 Konten, 16–25 s nur 107 (7 bzw. 8 Posts). Zielwert 8–12 s, stärkste Szene zuerst.

## Uhrzeit Instagram
- Seit 2026-11-10 vier Fenster: 7:45, 12:15, 18:15 und neu 20:45 Uhr (Abendstunden sind laut Fachseiten für deutsches Publikum stark).
- Verglichen wird die Reichweite im Verhältnis zum Median des Formats (Bilder-Posts liefen viel schlechter und lagen oft morgens –
  ohne diese Korrektur hätte das die Uhrzeit verfälscht). Stand 2026-11-10: morgens 1,46×, abends 1,0×, mittags 0,61×, spät noch ungetestet.

## YouTube
- Echte Video-Shorts laufen weit besser als Folien-Reels: CO₂-Short 1.085 Aufrufe, Feuersalamander 755, Folien-Reels 1–22 (Stand 2026-11-10).
  → Folien-Reels werden auf YouTube nicht mehr hochgeladen (Nutzer hat die schwachen gelöscht, 2026-11-10).
- Abstand: Die ersten Shorts kamen einzeln und liefen gut, 6 Uploads direkt hintereinander (9./10.11.) kaum.
  → Höchstens 2 Shorts pro Tag, mind. 6 Stunden Abstand, per Zeitplan. Später testen, ob 1 pro Tag besser ist als 2.
- Echte Videos schlagen Videos aus Fotos deutlich: Katzen-Short (aus 2 Fotos) 19 Aufrufe, echte Video-Shorts 646–1.314 (Stand 2026-11-13).
  → Für YouTube möglichst echte Videos; Foto-Videos nur als Notlösung.
- Seit Shorts einzeln mit Abstand erscheinen: 646–1.314 Aufrufe pro Short (vorher im Block 1–22).
- Layout ab 2026-11-13: Texte in der sicheren Zone (oberhalb des unteren Drittels, rechts Abstand), weil YouTube dort Titel/Buttons überlagert.
- Uhrzeit: wird ab jetzt gelernt (Fenster 7, 12, 16, 19, 21 Uhr; Videos erscheinen per Zeitplan zur gewählten Stunde).

## Verlauf
- 2026-11-18: Erste erzählte Posts (Venus 152 Konten, Ø 8,3 s geschaut; Schwarzes Loch 122 Konten nach 1 Tag, 6,0 s) – noch unter den stummen Videos der Vorwoche (196–294), aber erst 1–2 Tage alt. Venus hält mit 8,3 s am längsten von allen bisherigen Reels. YouTube: mittags-Shorts nur 0,15× des Medians (4 Shorts) → YouTube-Uhrzeitwahl meidet mittags schon. Test heute: Aussage- statt Frage-Titel (frage-titel-ohne), Fotomontage statt Simulation.
- 2026-11-16: Nutzer: komplett in Richtung der erfolgreichen Wissens-Shorts gehen (nicht im Wechsel). Ab sofort jedes Video erzählt, 25–45 s, emotionale Titel mit Emoji, Trend-Themen inkl. zeitloser Wow-Fakten; tägliche Trend-Auswertung (trends.js). Ziel: Reichweite, Likes, Follower.
- 2026-11-16: Vorbilder-Auswertung (YouTube-API): erfolgreiche Wissens-Shorts sind länger (Median 52 s), erzählt, emotional betitelt, oft zeitlose Listen/Rätsel zu Tieren.
- 2026-11-16: Nutzer findet Stimme gut, wünscht schneller → Tempo 1,2 und Einsatz ab Sekunde 0,15. Forschungs-Plan (5 Schritte) aufgenommen.
- 2026-11-16: Zwischenbilanz mit Nutzer: Reichweite wächst (100–300 je Video-Post, YouTube ~7.000 Aufrufe), aber Follower stagnieren (IG 5, YT 1). Neue Tests: Sprecherstimme (5), Grund zum Folgen/Serie (6). Nutzer pinnt den Dino-Post an.
- 2026-11-11: Format bewusst „video“ statt der Zufalls-Testvariante „zusammen“ (Video 175 vs. zusammen 105 Konten bei 7/5 Posts – Regel 1). Erster Post um 20:45 (spät). Test: kurzes-video (10,5 s).
- 2026-11-10: Analyse eingeführt, Regeln 1–4 aufgestellt. Vierte Instagram-Uhrzeit (20:45) ergänzt, YouTube-Statistik und -Uhrzeitwahl eingeführt. YouTube: nur noch Video-Shorts, max. 2/Tag mit 6 h Abstand.

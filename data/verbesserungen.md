# Verbesserungen

Hier hält die App fest, was sie selbst verbessert hat (Datum, ein Satz).

- 2026-10-29: Bildsuche findet bei iNaturalist jetzt die richtige Art (vorher kamen bei „Salamandra salamandra“ Kröten und andere Salamander).
- 2026-10-29: Videosuche wartet bei überlastetem Wikimedia länger und versucht Downloads erneut.
- 2026-10-30: Fotos lassen sich auf Folien jetzt vergrößern („size“), damit Motive aus der unteren Bildhälfte über dem Text sichtbar sind.
- 2026-11-01: Video-Reels: das Video wird automatisch so skaliert, dass es nicht mehr von den eingeblendeten Fakten überdeckt wird (vor allem bei quadratischen Videos).
- 2026-11-02: Bildsuche kann jetzt auch einzelne, ausdrücklich frei lizenzierte Bilder per Adresse übernehmen (z. B. NASA Earth Observatory), mit Lizenzprüfung.
- 2026-11-02: Formatwahl zählt veröffentlichte Posts statt nur ausgewertete – sonst wäre „Bilder“ (unter 30 Konten) ewig als ungetestet wiederholt worden.
- 2026-11-05: Videosuche wartet zwischen Wikimedia-Downloads kurz – im Test kamen 3 von 3 Videos an statt 1 von 3.
- 2026-11-06: Anleitung: Spektrum-Artikel sind hier nicht lesbar – nur mit lesbarer Zweitquelle verwenden; scinexx-Volltext steht im Feed.
- 2026-11-07: Neues Werkzeug bilder-video.js: macht aus 1–4 Standbildern ein Video mit Zoom, Beschriftung und Überblendung (vorher jedes Mal von Hand, einmal mit Fehler).
- 2026-11-08: Auswahl nutzt den Median statt des Durchschnitts, damit ein einzelner viraler Post (Dino-Blut: 3.318 Konten) die Entscheidungen nicht verzerrt.

- 2026-11-09: YouTube angebunden: Video-Reels gehen zusätzlich als YouTube Short raus; Kurz-Doku-Baukasten (doku.js) mit Sprecherstimme und automatischer Stimmprüfung; abgeschnittenes Doku-Ende behoben. Montags-Check Instagram: nichts Neues seit den bekannten 2026-Änderungen (Teilen per DM, Speichern, Wiedergabezeit zählen am meisten).
- 2026-11-12: publish.js versucht ein Reel nach einem Instagram-Verarbeitungsfehler automatisch ein zweites Mal (und ruft die Datei vorher beim CDN ab). Post-Vorbereitung im früheren Lauf eingeführt, damit späte Posts pünktlich erscheinen.
- 2026-11-13: Folien trennen Zahl und Einheit nicht mehr („100 %“, „235 ms“ bleiben zusammen). Reels: Texte in sicherer Zone für YouTube/Instagram.
- 2026-11-16: Videos für Instagram kommen jetzt über GitHub Pages statt jsDelivr (Hinweis von Tagesbild.kompakt).
- 2026-11-17: find-video.js zählt Kandidaten weiter (v2, v3 …), statt bei einem zweiten Aufruf für denselben Post das erste Video zu überschreiben.
- 2026-11-18: choose.js testet „zum Weiterlernen“ jetzt die am wenigsten erprobte Option statt einer zufälligen – vorher kam zweimal hintereinander das schon 7-mal getestete, schwächste Fenster „mittags“ dran.
- 2026-11-19: Kontoprüfung vor jedem Instagram-Zugriff (ig-account.js) und eigene Variable KRASS_IG_TOKEN – verhindert Posts auf dem falschen Konto; comments.js bricht bei gelöschten Posts nicht mehr ab.
- 2026-11-20: render.js, reel.js und video-reel.js nutzen den festen Browser-Pfad /opt/pw-browsers/chromium_headless_shell (mit altem Pfad als Rückfall) – nach einem Neustart mit neuer Browserversion brach das Rendern sonst ab.
- 2026-11-21: slot.js merkt sich die Tagesentscheidung (data/slot-heute.json), damit neue Statistiken im Laufe des Tages das Posting-Fenster nicht mehr verschieben.
- 2026-11-22: Stimmprüfung strenger (Wörter mit Umlaut müssen exakt erkannt werden, bis zu 6 Versuche) und Satzende wird erst nach dem echten Ausklingen geschnitten – Schlusssätze wurden vorher manchmal abgeschnitten (Hinweis des Nutzers). Doku-Stimme jetzt ebenfalls 1,2-fach schnell.
- 2026-11-23: slot.js postet sofort, wenn der letzte Instagram-Post über 30 Stunden zurückliegt (verpasste oder verspätete Läufe führten zu 4 Tagen Pause).
- 2026-11-23: Neues Format „Geschichte“ (geschichte.py): selbst gezeichnete Erklär-Animationen mit klarerer Stimme, Untertitel im eigenen Bereich, Klick-Filter; 15-ms-Blenden zwischen Sätzen in sprechen.py.
- 2026-11-24: „Kommentiere QUELLE“ → automatische Direktnachricht mit der Originalquelle (comments.js stichwort), Hinweis in jeder Beschreibung.

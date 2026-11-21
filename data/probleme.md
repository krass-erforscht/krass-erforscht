
- 2026-11-12: Video-Reel Platin: erster Versuch „Video-Verarbeitung: ERROR“, zweiter Versuch klappte → automatische Wiederholung eingebaut.

- 2026-11-14: Abend- und Spät-Lauf fielen aus (Neustart der Sitzung) – der vorbereitete Mars-Post wurde nicht veröffentlicht. Er erscheint stattdessen am 15.11. im gewählten Fenster.

- 2026-11-16: jsDelivr lieferte das Repository (über 500 MB) nicht mehr aus → Venus-Reel zweimal „ERROR“. Umstellung: Videos über GitHub Pages (docs/v/<id>/), danach klappte es.

## 2026-11-19 – Instagram-Token ungültig
Mittagslauf: Graph-API meldet „The user has not authorized application …“ (Code 190). Der Token wurde widerrufen (App-Berechtigung in Instagram entfernt, Passwortänderung o. Ä.), nicht abgelaufen.
Kommentare und Posten auf Instagram blockiert. Post 2026-11-19-baertierchen ist fertig gerendert. Nutzer um neuen Token gebeten.
Gelöst 19.11.: Nutzer hat neuen Token eingetragen, Zugriff getestet.

## 2026-11-19 abends – IG_TOKEN gehört plötzlich zu tagesbild.kompakt
Nach dem Bärtierchen-Post (17:03, korrekt auf krass.erforscht) stand in `IG_TOKEN` der Token von @tagesbild.kompakt.
Ursache: Beide Projekte teilen die Cloud-Umgebung „Standar“ und dieselbe Variable. Kein falscher Post entstanden.
Lösung: Skripte lesen jetzt zuerst `KRASS_IG_TOKEN`; `ig-account.js` bricht ab, wenn der Token nicht zu @krass.erforscht gehört
(publish, comments, insights). comments.js überspringt gelöschte/unlesbare Posts statt abzubrechen. Nutzer muss KRASS_IG_TOKEN anlegen.
Gelöst 21.11.: IG_TOKEN gehört wieder zu krass.erforscht (getestet).

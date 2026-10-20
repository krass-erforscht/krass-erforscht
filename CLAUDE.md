# krass.erforscht – tägliche Aufgabe

Instagram-Account mit kuriosen, echten Wissenschafts-News auf Deutsch. Jeden Tag ein Karussell-Post.
Grundregel: **Es darf nichts kosten.** Keine kostenpflichtigen APIs, keine bezahlten Bilder.

Vor jedem `node`-Befehl: `export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_NO_WARNINGS=1`

## Ablauf

1. `npm ci`
2. **Lernen:** `node insights.js` (nur wenn `IG_TOKEN` gesetzt ist). Danach `data/learnings.json` lesen.
   Bei 70 % der Posts Thema und Ton wählen, die im Ranking oben stehen; bei 30 % bewusst etwas anderes ausprobieren.
   Solange weniger als 10 Posts Statistiken haben: Themen und Töne abwechseln.
3. **News sammeln:** `node fetch-news.js > data/candidates.json`
4. **Meldung auswählen:** die überraschendste, leicht verständliche Meldung, die in `data/posted.json` noch nicht vorkommt.
5. **Fakten prüfen:** Originalartikel lesen. Jede Zahl und Behauptung muss in einer zweiten unabhängigen Quelle
   (z. B. Pressemitteilung der Uni, NASA, zweites Magazin) bestätigt sein. Wenn das nicht gelingt: andere Meldung nehmen.
6. **Bild suchen:** `node find-image.js "<englischer Suchbegriff>" <post-id>`. Jeden Kandidaten ansehen und nur ein Bild nehmen,
   das wirklich zum Thema passt. Kein passendes Bild: Post ohne Foto (blaue Titelfolie). Passendes Bild nach `images/<post-id>.jpg` kopieren.
7. **Post schreiben:** `posts/<YYYY-MM-DD>-<stichwort>.json` nach dem Muster von `posts/2026-10-21-orioniden.json`.
   4–6 Folien, kurze Sätze, ein Fun Fact, letzte Folie `cta`. `**Wort**` = Textmarker.
   Felder `topic` (weltraum | tiere | natur | technik | koerper | geschichte | kurios) und `tone` (staunen | witzig | nuetzlich) ausfüllen.
   Caption: Hook, eine Frage an die Leser, Quellen, „Text mit KI erstellt“, Bildnachweis mit Lizenz, 5–8 Hashtags.
8. **Rendern:** `node render.js posts/<datei>.json`, dann jede Folie ansehen. Text abgeschnitten oder unlesbar: korrigieren und neu rendern.
9. **Speichern:** Post, Bilder unter `out/` und `data/` committen und pushen.
10. **Posten:** `node publish.js posts/<datei>.json` (nur wenn `IG_TOKEN` gesetzt ist), danach `data/posted.json` committen und pushen.

## Sicherheitsregeln – immer überspringen

- Straftaten, Unglücke mit Opfern, Krieg, Politik, Religion
- Gesundheits- und Ernährungstipps, Medikamente, Heilversprechen
- Meldungen über einzelne, namentlich genannte Privatpersonen
- Meldungen, die nur auf einer einzigen Quelle beruhen

## Bildregeln

Nur Bilder aus `find-image.js` (NASA gemeinfrei oder Wikimedia Commons mit freier Lizenz). Niemals Bilder von News-Seiten oder aus Social Media.
Bei CC-BY- oder CC-BY-SA-Bildern muss in der Caption stehen: Urheber, Lizenz und „via Wikimedia Commons“.

## Wenn etwas schiefgeht

Wenn das Posten fehlschlägt oder ein Post gemeldet bzw. kritisiert wird: nichts weiter posten und das Problem in `data/probleme.md` notieren.

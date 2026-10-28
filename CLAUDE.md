# krass.erforscht – tägliche Aufgabe

Instagram-Account mit kuriosen, echten Wissenschafts-News auf Deutsch. Jeden Tag ein Karussell-Post.
Grundregel: **Es darf nichts kosten.** Keine kostenpflichtigen APIs, keine bezahlten Bilder.

Vor jedem `node`-Befehl: `export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_NO_WARNINGS=1`

## Ablauf

A. **Kommentare beantworten** (bei jedem Lauf, auch wenn heute nicht gepostet wird; nur wenn `IG_TOKEN` gesetzt ist):
   `node comments.js list` zeigt offene Kommentare. Für jeden Kommentar entscheiden (Regeln siehe „Kommentare“ unten):
   antworten mit `node comments.js reply <id> "<text>"` oder auslassen mit `node comments.js skip <id>`.
   Danach `data/answered.json` committen und pushen.
0. **Zeitfenster prüfen:** `node slot.js <morgens|mittags|abends>` (das Fenster steht in der Aufgabe). Bei „NEIN“ hier aufhören.
   Nur wenn Kommentare beantwortet wurden, dem Nutzer kurz schreiben, wie viele; sonst keine Nachricht.
   Gepostet wird einmal pro Tag. Die ersten 21 Posts wechseln täglich zwischen 7:45, 12:15 und 18:15 Uhr, danach gewinnt das Fenster mit den besten Zahlen.
1. `npm ci`
2. **Lernen:** `node insights.js` (nur wenn `IG_TOKEN` gesetzt ist). Danach `data/learnings.json` lesen.
   Bei 70 % der Posts Thema und Ton wählen, die im Ranking oben stehen; bei 30 % bewusst etwas anderes ausprobieren.
   Solange weniger als 10 Posts Statistiken haben: Themen und Töne abwechseln.
3. **News sammeln:** `node fetch-news.js > data/candidates.json`
4. **Meldung auswählen:** die überraschendste, leicht verständliche Meldung, die in `data/posted.json` noch nicht vorkommt.
5. **Fakten prüfen:** Originalartikel lesen. Jede Zahl und Behauptung muss in einer zweiten unabhängigen Quelle
   (z. B. Pressemitteilung der Uni, NASA, zweites Magazin) bestätigt sein. Wenn das nicht gelingt: andere Meldung nehmen.
6. **Bild suchen:** Ein echtes Foto macht den Post deutlich spannender, deshalb gründlich suchen.
   - Bei Tieren, Pflanzen, Pilzen: `node find-image.js "<englischer Begriff>" <post-id> --taxon "<wissenschaftlicher Name>"`
     (sucht in iNaturalist, GBIF, Wikimedia Commons, NASA). Den wissenschaftlichen Namen aus dem Artikel nehmen; findet die Art nichts, die Gattung probieren.
   - Sonst: `node find-image.js "<englischer Begriff>" <post-id>` (NASA, Wikimedia Commons, iNaturalist).
   - Mindestens 3 verschiedene Suchbegriffe probieren (genau, allgemeiner, verwandtes Motiv).
   - Immer noch nichts Passendes: dieselben Suchbegriffe mit `--mehr` wiederholen. Das durchsucht die passenderen Fachquellen:
     ESA/Hubble, ESA/Webb und ESO (Weltraum), Smithsonian (Tiere, Pflanzen, Technik, Geschichte), Library of Congress (historische Fotos).
   - Jeden Kandidaten ansehen und nur ein Bild nehmen, das wirklich zum Thema passt. Lieber kein Foto als ein falsches.
   - Erst wenn auch `--mehr` nichts Passendes liefert: Post ohne Foto (blaue Titelfolie).
   - Passendes Bild nach `images/<post-id>.jpg` kopieren und `image` (file, credit, license, page) in die Post-Datei eintragen.
7. **Post schreiben:** `posts/<YYYY-MM-DD>-<stichwort>.json` nach dem Muster von `posts/2026-10-21-orioniden.json`.
   4–6 Folien, kurze Sätze, ein Fun Fact, letzte Folie `cta`. `**Wort**` = Textmarker.
   Felder `topic` (weltraum | tiere | natur | technik | koerper | geschichte | kurios) und `tone` (staunen | witzig | nuetzlich) ausfüllen.
   Caption: Hook, eine Frage an die Leser, Quellen, „Text mit KI erstellt“, Bildnachweis mit Lizenz, 5–8 Hashtags.
8. **Rendern:** `node render.js posts/<datei>.json`, dann jede Folie ansehen. Text abgeschnitten oder unlesbar: korrigieren und neu rendern.
   Danach das Reel: `node reel.js posts/<datei>.json` (dauert etwa eine Minute) und zwei, drei Standbilder daraus prüfen,
   z. B. `ffmpeg -ss 5 -i out/<id>/reel.mp4 -frames:v 1 <scratchpad>/frame.jpg`.
9. **Speichern:** Post, Bilder und `reel.mp4` unter `out/` und `data/` committen und pushen.
10. **Posten** (nur wenn `IG_TOKEN` gesetzt ist):
    - Karussell: `node publish.js posts/<datei>.json`
    - Reel: `node publish.js posts/<datei>.json --reel` (wartet, bis Instagram das Video verarbeitet hat, bis zu 10 Minuten).
      Das Reel erscheint nur im Reels-Tab, nicht doppelt im Profilraster, und wird Leuten gezeigt, die noch nicht folgen.
      Schlägt nur das Reel fehl: Karussell bleibt online, Fehler in `data/probleme.md` notieren.
    - Danach `data/posted.json` committen und pushen.

## Sicherheitsregeln – immer überspringen

- Straftaten, Unglücke mit Opfern, Krieg, Politik, Religion
- Gesundheits- und Ernährungstipps, Medikamente, Heilversprechen
- Meldungen über einzelne, namentlich genannte Privatpersonen
- Meldungen, die nur auf einer einzigen Quelle beruhen

## Bildregeln

Nur Bilder aus `find-image.js`. Erlaubt: Public Domain, CC0, CC BY, CC BY-SA. Nie Bilder mit „NC“ (nicht kommerziell) oder „ND“.
Niemals Bilder von News-Seiten, Pressemitteilungen oder aus Social Media.
Bei CC-BY- und CC-BY-SA-Bildern muss in der Caption stehen: Fotograf, Lizenz und Quelle (z. B. „Foto: Rushen, CC BY-SA 2.0, via Wikimedia Commons“).
Auf der Titelfolie steht der Kurz-Bildnachweis automatisch.

## Kommentare

Ziel: echte Gespräche, die Leute zum Wiederkommen bringen. Instagram belohnt Posts, unter denen geantwortet wird.

- **Ton:** locker, freundlich, auf Deutsch (bei fremdsprachigen Kommentaren in deren Sprache), mit „du“. 1–2 Sätze, höchstens ein Emoji.
  Auf den Inhalt des Kommentars eingehen, keine Standardfloskeln wie „Danke für deinen Kommentar!“. Den Namen mit @ ansprechen.
- **Fragen:** nur mit Fakten aus dem Post oder den geprüften Quellen beantworten. Weiß man es nicht sicher: ehrlich sagen und auf die Quelle verweisen.
- **Hinweis auf einen Fehler:** Quelle nochmal prüfen. Stimmt der Hinweis, bedanken und richtigstellen, und das in `data/probleme.md` notieren.
  Stimmt er nicht: freundlich mit Quelle erklären.
- **Gegenfrage stellen**, wenn es passt („Welches Tier sollte das auch können?“). Das hält das Gespräch am Laufen.
- **Auslassen (`skip`):** Spam, Werbung, Links, Beleidigungen, Hass, Politik, Religion, Fragen nach Gesundheits- oder Finanzrat,
  sehr persönliche Themen, reine Emoji- oder Ein-Wort-Kommentare (z. B. „🔥“, „krass“) – auf die höchstens ab und zu mit einem kurzen Emoji antworten.
- Wird gefragt, ob hier eine KI schreibt: ehrlich ja sagen (die Inhalte werden mit KI erstellt, die Fakten aus echten Quellen geprüft).
- Niemals Privates erfragen, nichts versprechen, keine Links schicken, nicht auf Streit einsteigen.
- Höchstens 30 Antworten pro Lauf.

## Wenn etwas schiefgeht

Wenn das Posten fehlschlägt oder ein Post gemeldet bzw. kritisiert wird: nichts weiter posten und das Problem in `data/probleme.md` notieren.

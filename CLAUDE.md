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
5. **Fakten prüfen:** Originalartikel ganz lesen. Eine seriöse Quelle reicht (Wissenschaftsmagazin, Pressemitteilung einer Uni
   oder Forschungseinrichtung, NASA/ESA). Alle Zahlen und Aussagen genau so übernehmen, wie sie dort stehen, nichts dazuerfinden.
   Vorsichtige Formulierungen beibehalten: „könnte“, „vermuten Forschende“, „erste Hinweise“ nicht zu Tatsachen machen.
   Eine zweite Quelle ist nicht nötig, aber willkommen, wenn sie schnell zu finden ist.
6. **Bild suchen:** Ein echtes Foto macht den Post deutlich spannender, deshalb gründlich suchen.
   - Bei Tieren, Pflanzen, Pilzen: `node find-image.js "<englischer Begriff>" <post-id> --taxon "<wissenschaftlicher Name>"`
     (sucht in iNaturalist, GBIF, Wikimedia Commons, NASA). Den wissenschaftlichen Namen aus dem Artikel nehmen; findet die Art nichts, die Gattung probieren.
   - Sonst: `node find-image.js "<englischer Begriff>" <post-id>` (NASA, Wikimedia Commons, iNaturalist).
   - Mindestens 3 verschiedene Suchbegriffe probieren (genau, allgemeiner, verwandtes Motiv).
   - Immer noch nichts Passendes: dieselben Suchbegriffe mit `--mehr` wiederholen. Das durchsucht die passenderen Fachquellen:
     ESA/Hubble, ESA/Webb und ESO (Weltraum), Smithsonian (Tiere, Pflanzen, Technik, Geschichte), Library of Congress (historische Fotos).
   - Jeden Kandidaten ansehen und nur ein Bild nehmen, das wirklich zum Thema passt. Lieber kein Foto als ein falsches.
   - Erst wenn auch `--mehr` nichts Passendes liefert: Post ohne Foto (blaue Titelfolie).
   - Passendes Titelbild nach `images/<post-id>.jpg` kopieren und `image` (file, credit, short, license, page) in die Post-Datei eintragen.
     `short` ist der Kurz-Nachweis auf der Folie, z. B. „Foto: Max Tibby, CC0“ oder „Illustration: NASA, ESA, CSA“.
   - **Jede Folie bekommt ein passendes Hintergrundfoto** (das macht die Posts deutlich spannender):
     Für jede Inhaltsfolie ein Motiv suchen, das genau zu ihrem Text passt (z. B. Lebensraum, Detailaufnahme, Forschende, Teleskop, Vergleich).
     Dafür weitere `find-image.js`-Suchen mit eigener ID (`<post-id>-2`, `-3` …) und das Bild nach `images/<post-id>-<n>.jpg` kopieren.
     In der Folie eintragen: `"image": { "file", "credit", "short", "license", "page", "position" }`.
     `position` ist der Bildausschnitt (CSS, z. B. „30% center“), so wählen, dass das Motiv in der oberen Hälfte sichtbar ist – der Text steht unten.
     Folien ohne eigenes Foto zeigen automatisch das Titelbild mit wechselndem Ausschnitt. Dasselbe Foto höchstens auf zwei Folien.
6b. **Video suchen:** Ein echtes Video, das **genau zeigt, was der Post beschreibt** (die Schlange, die rollt; der Planet, um den es geht),
   ist das Spannendste überhaupt. Gründlich suchen:
   - `node find-video.js "<englischer Begriff>" <post-id>` (NASA, ESA/Webb, ESA/Hubble, ESO, Wikimedia Commons). Mehrere Begriffe probieren.
   - Zusätzlich per Websuche nach dem Video der Studie selbst suchen: Open-Access-Studien (z. B. PLOS, eLife, Royal Society, Frontiers,
     Nature Communications, Scientific Reports, Current Biology nur wenn als „open access“ unter CC BY markiert) haben oft Zusatzvideos unter CC BY.
     Die Lizenz muss auf der Seite **ausdrücklich** stehen. Dann: `node find-video.js --url <mp4-adresse> <post-id> --credit "<Urheber>" --license "CC BY 4.0" --page <seite>`.
   - **Niemals** Videos von YouTube, TikTok, Instagram, Nachrichtenseiten oder ohne klare freie Lizenz (Public Domain, CC0, CC BY, CC BY-SA).
   - Bei jedem Kandidaten den Bogen `videos/candidates/<post-id>-v<n>-frames.jpg` ansehen. Erste Wahl: ein Video, das genau das Thema zeigt.
     Zweite Wahl (vom Nutzer ausdrücklich erlaubt): ein Video, das **das Prinzip dahinter anschaulich erklärt**, auch wenn es nicht genau
     dasselbe Objekt ist (z. B. eine NASA-Animation eines Lava-Planeten für einen Post über einen bestimmten Lava-Planeten).
     Dann in der Post-Datei `"symbolisch": true` setzen – das Video wird sichtbar als „Symbolvideo“ gekennzeichnet.
     Es muss inhaltlich zum Post passen und darf nichts Falsches zeigen (keine Spiralgalaxie bei einem Post über einen Kometen).
     Den besten Abschnitt anhand der Zeitstempel wählen (8–30 Sekunden).
   - Gefunden: Video nach `videos/<post-id>.mp4` kopieren (`.webm` vorher mit `ffmpeg -i in.webm -c:v libx264 -an videos/<post-id>.mp4` umwandeln)
     und in die Post-Datei eintragen: `"video": { "file", "start", "duration", "credit", "short", "license", "page", "symbolisch", "headline", "captions" }`.
     `headline` = große Überschrift oben (mit `**Textmarker**`), `captions` = 2–4 kurze Fakten, die nacheinander eingeblendet werden.
   - **Format wählen:** `node format.js ja` (Video gefunden) bzw. `node format.js nein`. Ergebnis `bilder`, `video` oder `zusammen`
     in die Post-Datei als `"format"` eintragen. Die App testet so, welches Format die meiste Reichweite bringt.
7. **Post schreiben:** `posts/<YYYY-MM-DD>-<stichwort>.json` nach dem Muster von `posts/2026-10-21-orioniden.json`.
   4–6 Folien, kurze Sätze, ein Fun Fact, letzte Folie `cta`. `**Wort**` = Textmarker.
   Felder `topic` (weltraum | tiere | natur | technik | koerper | geschichte | kurios) und `tone` (staunen | witzig | nuetzlich) ausfüllen.
   Caption:
   - Erster Satz = Hook **mit dem Suchbegriff**, unter dem Leute das Thema suchen würden (z. B. „Schlange“, „Exoplanet“, „Sternschnuppen“).
     Instagram durchsucht Beschreibungen inzwischen wie eine Suchmaschine.
   - Dann 1–2 Sätze Inhalt, eine Frage an die Leser, Quellen, „Text mit KI erstellt“, Bildnachweise aller verwendeten Fotos mit Lizenz
     (z. B. „Fotos: Sharon Reid (CC BY), Max Tibby (CC0) via iNaturalist“).
   - **Höchstens 5 Hashtags** (Instagram-Grenze seit Dezember 2025): 1–2 allgemeine (#wissenschaft) und 3–4 genaue zum Thema.
     `publish.js` kürzt überzählige automatisch, aber besser gleich 5 passende wählen.
   Bildbeschreibungen (Alternativtext) für jede Folie und der Musiknachweis beim Reel werden automatisch ergänzt.
8. **Rendern:** `node render.js posts/<datei>.json`, dann jede Folie ansehen. Text abgeschnitten oder unlesbar: korrigieren und neu rendern.
   Danach das Reel mit Musik: `node reel.js posts/<datei>.json` (1–3 Minuten). Die Musik passt sich dem `tone` an
   (incompetech, ccMixter, notfalls Internet Archive oder selbst erzeugte Klangfläche) und steht in `out/<id>/music.json`.
   Zwei, drei Standbilder prüfen, z. B. `ffmpeg -ss 5 -i out/<id>/reel.mp4 -frames:v 1 <scratchpad>/frame.jpg`.
   Bei Format `video` oder `zusammen` außerdem: `node video-reel.js posts/<datei>.json` (macht `video-reel.mp4` und `video-45.mp4`)
   und auch davon Standbilder prüfen (Überschrift lesbar, Fakten nicht abgeschnitten, Video zeigt das Thema).
9. **Speichern:** Post, Bilder, Videos unter `out/`, `videos/<post-id>.mp4`, `data/` und `music/library.json` committen und pushen.
10. **Posten** (nur wenn `IG_TOKEN` gesetzt ist), je nach Format:
    - `bilder`: `node publish.js posts/<datei>.json`, danach `node publish.js posts/<datei>.json --reel`
    - `zusammen`: `node publish.js posts/<datei>.json --zusammen`, danach `node publish.js posts/<datei>.json --reel`
    - `video`: nur `node publish.js posts/<datei>.json --video` (echtes Video als Reel im Feed)
    Videos werden von Instagram im Hintergrund verarbeitet, das kann bis zu 10 Minuten dauern.
    Das Folien-Reel (`--reel`) erscheint nur im Reels-Tab und wird Leuten gezeigt, die noch nicht folgen.
    Schlägt ein Video-Teil fehl: auf `bilder` zurückfallen (Karussell posten), Fehler in `data/probleme.md` notieren.
    Danach `data/posted.json` committen und pushen.

## Sicherheitsregeln – immer überspringen

- Straftaten, Unglücke mit Opfern, Krieg, Politik, Religion
- Gesundheits- und Ernährungstipps, Medikamente, Heilversprechen
- Meldungen über einzelne, namentlich genannte Privatpersonen
- Meldungen von unseriösen Seiten (Boulevard, Blogs ohne Quellen, Social Media)

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

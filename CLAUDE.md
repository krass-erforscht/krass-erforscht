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
   Gepostet wird einmal pro Tag (7:45, 12:15, 18:15 oder 20:45 Uhr). Die Uhrzeit richtet sich nach der besten Reichweite
   (siehe „Immer nach der besten Reichweite“ unten). Verglichen wird die Reichweite im Verhältnis zum Median des jeweiligen Formats.
   **Der Nutzer erlaubt ausdrücklich, die Zeiten weiter anzupassen:** Zeigt die Analyse, dass eine Stunde außerhalb der vier Fenster
   vielversprechend ist oder ein Fenster dauerhaft schlecht läuft, die geplanten Aufgaben (update_trigger) verschieben bzw. ergänzen
   und `SLOTS` in `slot.js` anpassen. Höchstens eine Zeitänderung pro Woche, damit genug Daten entstehen; in `data/strategie.md` begründen.
1. `npm ci`
2. **Lernen:** `node insights.js` (nur wenn `IG_TOKEN` gesetzt ist), `node youtube.js statistik` (nur wenn `YT_REFRESH_TOKEN` gesetzt ist),
   dann `node analyse.js` und danach `node choose.js empfehlung`.
   **Algorithmus-Analyse:** `data/analyse.md` lesen (Vergleich aller Posts nach Format, Thema, Uhrzeit, Überschrift, Videolänge, Wiedergabezeit usw.)
   und `data/strategie.md` aktualisieren (Instagram **und** YouTube, getrennte Abschnitte): neue deutliche Unterschiede als Regel „im Test“ aufnehmen, Regeln mit genug Daten (je 3 Posts mit/ohne)
   auf „bestätigt“ oder „verworfen“ setzen, mit Datum und Zahlen begründen, Verlauf ergänzen. Höchstens 6 Regeln; wenig Daten vorsichtig deuten.
   Beim heutigen Post **alle bestätigten Regeln anwenden** und **genau eine Regel im Test** (abwechselnd, damit es Vergleichsposts mit und ohne gibt);
   deren Kurzname als `"test"` in die Post-Datei schreiben. Ändert sich eine Regel, das dem Nutzer in der Tagesnachricht in einem Satz sagen.
   Die Empfehlung nennt Thema und Ton für heute. Möglichst eine Meldung dazu nehmen; gibt es keine gute (oder wäre sie nach den
   Sicherheitsregeln tabu, z. B. Gesundheitstipps beim Thema „koerper“), das nächstbeste Thema aus der Liste nehmen.
   Eine richtig spannende Meldung schlägt die Empfehlung – Reichweite entsteht vor allem durch gute Geschichten.
3. **News sammeln:** `node fetch-news.js > data/candidates.json`
4. **Meldung auswählen:** die überraschendste, leicht verständliche Meldung, die in `data/posted.json` noch nicht vorkommt.
   Achtung: Spektrum.de-Artikel lassen sich von hier aus nicht abrufen (Fehler 403), der Feed liefert nur einen kurzen Anreißer.
   Eine Spektrum-Meldung nur nehmen, wenn sich dieselbe Nachricht in einer lesbaren Quelle findet (ScienceDaily, scinexx mit vollem Text im Feed,
   Pressemitteilung der Forschungseinrichtung). Bei scinexx steht der ganze Artikel im Feld `content:encoded` des Feeds.
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
     Liegt das Motiv im Foto weit unten, zusätzlich `size` (z. B. „auto 170%“) setzen: das vergrößert das Foto, damit das Motiv nach oben rückt.
     `position` und `size` gelten auch für das Titelbild (`image` des Posts) auf der ersten Folie.
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
   - **Kein passendes Video, aber gute Bilder?** Daraus ein Video machen: `node bilder-video.js videos/<post-id>.mp4 "<bild1>|<beschriftung>" "<bild2>|<beschriftung>"`
     (1–4 Bilder, je ca. 6 Sekunden mit Zoom und Überblendung; z. B. Satellitenbild vorher/nachher, Fossil + Vergleichsbild).
     Vergleichsbilder, die nicht das Objekt aus der Meldung zeigen, in der Beschriftung klar kennzeichnen („Zum Vergleich: … heute“).
     Das zählt dann als Video. Bisher brachten Videos rund zehnmal so viel Reichweite wie reine Bilder.
   - **Format wählen:** `node format.js ja` (Video gefunden) bzw. `node format.js nein`. Ergebnis `bilder`, `video` oder `zusammen`
     in die Post-Datei als `"format"` eintragen. Weil Videos bisher deutlich mehr Reichweite bringen, lohnt sich gründliches Suchen.
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
    Danach `data/posted.json` committen und pushen (auch `data/analyse.md`, `data/analyse.json`, `data/account.json`, `data/strategie.md`).
10b. **YouTube Shorts** (nur wenn `YT_REFRESH_TOKEN` gesetzt ist): `node youtube.js reels posts/<datei>.json` lädt das Video-Reel als Short hoch
    (Folien-Reels nicht mehr: auf YouTube 1–22 Aufrufe gegenüber 755–1.085 bei echten Videos) – mit Beschreibung aus der Caption, Nachweisen,
    Abo-Hinweis und Hashtags. Vorher mit `node youtube.js vorschau posts/<datei>.json` prüfen.
    **Nicht zu viele auf einmal** (Wunsch des Nutzers, viele Shorts direkt hintereinander liefen kaum): höchstens 2 Shorts pro Tag, mindestens
    6 Stunden Abstand; jeder Short erscheint per Zeitplan (publishAt) zur gelernten besten Uhrzeit, freie Plätze bis zu 4 Tage im Voraus.
    Danach `node youtube.js nachholen` (ältere Video-Shorts, auch vom Nutzer gelöschte, höchstens 1 pro Tag, damit Platz für neue bleibt).
    `data/youtube.json` committen und pushen. Kommt der Status „private“ zurück, den Nutzer einmalig bitten, es in YouTube Studio auf „Öffentlich“ zu stellen.
    Zeigt die Analyse, dass etwas auf YouTube dauerhaft kaum Aufrufe bringt (Art, Uhrzeit, Abstand), anpassen und in `data/strategie.md` begründen.
10c. **Kurz-Doku für YouTube** (einmal pro Woche, samstags im Lauf, in dem gepostet wird):
    - Thema: der Post der letzten 14 Tage mit der höchsten Reichweite (`data/posted.json`), der noch keine Doku hat (`data/youtube.json`, type „doku“).
    - Originalquelle nochmal ganz lesen, Drehbuch `doku/<id>.json` nach dem Muster von `doku/dino-blut.json` schreiben: 8–10 Abschnitte, ca. 3 Minuten,
      ruhiger Doku-Ton, nur Fakten aus der Quelle, 4–6 Abschnitte mit `kapitel` (YouTube-Kapitel, der erste Abschnitt immer), 5 passende `hashtags`, Zahlen ausschreiben, sehr kurze Sätze (1–3 Wörter) mit dem Nachbarsatz verbinden, letzte Zeile eine Frage an die Zuschauer.
    - Motive mit `find-video.js`/`find-image.js` suchen (Regeln wie oben); Fremdmotive als „Zum Vergleich“ oder „Symbolbild“ kennzeichnen. Keine Gesichter von Privatpersonen.
      Abschnitte über 15 Sekunden bekommen 2 Motive (`visuals`).
    - Stimme einmalig einrichten (siehe `stimme/sprechen.py`, Python-Umgebung unter /tmp/cb), dann `node doku.js doku/<id>.json` (Sprachaufnahme dauert ca. 25 Minuten).
      WARNUNGEN der Stimmprüfung lesen; klingt ein Satz falsch, umformulieren und neu bauen.
    - Prüfen: Standbilder-Bogen ansehen, Ende des Videos mit Whisper abhören (letzter Satz vollständig?), Vorschaubild ansehen.
    - Hochladen: `node youtube.js doku out/doku-<id>/meta.json`, `doku/<id>.json`, neue Bilder/Videos und `data/youtube.json` committen und pushen.
      Dem Nutzer den Link in der Tagesnachricht nennen.
11. **Selbst verbessern** (einmal am Tag, nach dem Posten):
    - Rückblick: Was ist heute schiefgegangen oder war umständlich (Fehlermeldungen, kein Bild/Video gefunden, Text musste oft korrigiert werden)?
      `data/probleme.md` und `data/learnings.json` lesen: Welche Themen, Töne, Formate, Uhrzeiten laufen gut oder schlecht?
    - **Montags** zusätzlich kurz im Netz nachsehen, ob sich bei Instagram etwas geändert hat (Algorithmus, Regeln, Schnittstelle, neue Funktionen).
      Neue Erkenntnisse oben in `data/strategie.md` eintragen und, wenn sinnvoll, als Regel „im Test“ aufnehmen.
    - Daraus **höchstens eine** kleine, sinnvolle Verbesserung umsetzen (Code, Anleitung, Vorlage, neue freie Quelle).
      Vorher prüfen, dass sie funktioniert: den heutigen Post probeweise neu rendern bzw. das geänderte Skript testen.
      Klappt der Test nicht: Änderung verwerfen (`git checkout -- <datei>`). Nur Funktionierendes committen und pushen.
    - Jede Verbesserung mit Datum und einem Satz in `data/verbesserungen.md` festhalten und dem Nutzer in der Tagesnachricht kurz nennen.
    - **Nicht ohne den Nutzer ändern:** die Grundregeln (kostenlos, nur frei lizenzierte Bilder/Videos/Musik, Sicherheitsregeln,
      Ehrlichkeit über KI), Konten und Zugänge. Das nur vorschlagen. (Uhrzeiten der geplanten Aufgaben darf ich laut Nutzer nach der Analyse anpassen.)
    - **Wenn etwas vom Nutzer gebraucht wird** (neue Berechtigung, freigegebene Internetadresse, neuer Token, ein Konto, eine Entscheidung):
      in der Tagesnachricht klar und kurz Bescheid geben, was genau und warum, mit einfacher Schritt-für-Schritt-Anleitung auf Deutsch.
      Dieselbe Bitte nicht jeden Tag wiederholen; offene Bitten in `data/offene-bitten.md` führen und erst nach 3 Tagen erneut erinnern.

## Ziel und Freiheit (vom Nutzer so festgelegt)

Ziel auf Instagram **und** YouTube: mehr Aufrufe, mehr Likes, mehr Follower bzw. Abonnenten.
Der Nutzer gibt **volle Freiheit** bei Uhrzeiten, Häufigkeit, Format (Foto, Karussell, Video, Reel, Short, Doku), Länge, Aufmachung,
Titeln, Beschreibungen und Hashtags – auf beiden Plattformen. Entscheidungen datenbasiert treffen (`data/analyse.md`), begründen
(`data/strategie.md`) und dem Nutzer Änderungen kurz in der Tagesnachricht nennen. Unverändert gelten die Grundregeln: kostenlos,
nur frei lizenzierte Inhalte mit Nachweis, Sicherheitsregeln, Ehrlichkeit über KI, nur offizielle Schnittstellen, Fakten aus der Quelle.

## Immer nach der besten Reichweite

Uhrzeit (`slot.js`), Format (`format.js`), Thema und Ton (`choose.js empfehlung`) folgen derselben Regel aus `choose.js`:
gezählt werden die erreichten Konten aller Posts, die mindestens einen Tag alt sind. Was noch keine 2 Posts hat, bekommt eine faire Chance;
sonst gewinnt an 3 von 4 Tagen die Variante mit der höchsten mittleren Reichweite (Median, damit ein einzelner viraler Post nicht alles verzerrt),
am 4. wird zum Weiterlernen etwas anderes probiert.
Die Entscheidung hängt nur vom Datum ab, damit alle Läufe eines Tages übereinstimmen.

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
- **Witze und Sprüche:** mitspielen statt belehren. Nicht korrigieren oder erklären, warum etwas nicht geht – das wirkt klugscheißerisch (Wunsch des Nutzers).
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

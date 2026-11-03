# Prompt: einen zweiten Account wie krass.erforscht aufbauen

## Teil 1 – Was du vorher selbst einrichtest (ca. 30 Minuten)

1. **Instagram:** neuen Account anlegen → Profil → ☰ → Kontotyp und Tools → Zu professionellem Konto wechseln → **Creator**.
2. **GitHub:** ein neues, **öffentliches**, leeres Repository anlegen (ohne README), z. B. `<dein-github-name>/<neuer-account>`.
   Claude Zugriff darauf geben: https://claude.ai/connect-github
3. **Meta-Entwickler-App** (am besten am PC): developers.facebook.com/apps → App erstellen →
   Anwendungsfall „Messaging und Content auf Instagram verwalten“ → kein Business-Portfolio → App erstellen.
   Dann: Anwendungsfälle (Stift-Symbol) → Anpassen → „API-Einrichtung mit Instagram-Login“ →
   Schritt 1 „Add all required permissions“, unter „Berechtigungen und Features“ zusätzlich
   `instagram_business_content_publish` und `instagram_business_manage_insights` hinzufügen →
   App-Rollen → Rollen → Instagram-Tester: neuen Account eintragen → Einladung auf instagram.com unter
   Einstellungen → Apps und Websites → Tester-Einladungen annehmen → zurück zu Schritt 2: Konto hinzufügen → Token generieren.
4. **Neue Claude-Code-Sitzung** (claude.ai/code) mit eigener Cloud-Umgebung starten. In der Umgebung
   („Cloud-Umgebung bearbeiten“):
   - **Umgebungsvariablen:** `IG_TOKEN=<dein Token>` (den Token nie in den Chat schreiben)
   - **Netzwerkzugriff:** „Full“ – oder „Custom“ mit diesen Domains (Paketmanager-Häkchen lassen):
     ```
     graph.instagram.com
     raw.githubusercontent.com
     cdn.jsdelivr.net
     commons.wikimedia.org
     upload.wikimedia.org
     images-api.nasa.gov
     images-assets.nasa.gov
     science.nasa.gov
     assets.science.nasa.gov
     api.inaturalist.org
     inaturalist-open-data.s3.amazonaws.com
     api.gbif.org
     esahubble.org
     cdn.esahubble.org
     esawebb.org
     cdn.esawebb.org
     www.eso.org
     cdn.eso.org
     api.si.edu
     ids.si.edu
     www.loc.gov
     tile.loc.gov
     incompetech.com
     ccmixter.org
     archive.org
     fonts.googleapis.com
     fonts.gstatic.com
     ```
     Dazu die Nachrichtenseiten der neuen Nische (siehe Platzhalter unten).
5. Dann den Prompt aus Teil 2 in die neue Sitzung kopieren und die Platzhalter in <spitzen Klammern> ausfüllen.

## Teil 2 – Der Prompt (kopieren, Platzhalter ausfüllen)

```
Baue mir einen vollautomatischen, kostenlosen Instagram-Account nach dem Vorbild von
https://github.com/krass-erforscht/krass-erforscht (öffentliches Repository, dort ist alles fertig gebaut und in CLAUDE.md beschrieben).

Neuer Account:
- Instagram-Name: <@neuer.account>
- Nische: <z. B. „kuriose Geschichte“, „Tiere der Welt“, „Technik-News“>
- Sprache: <Deutsch>
- Nachrichtenquellen (RSS): <z. B. eigene Vorschläge machen, nur seriöse Seiten>
- GitHub-Repository für den neuen Account: <dein-github-name>/<neuer-account> (leer, öffentlich, Zugriff ist erteilt)
- Farben/Look: <eigene Farben vorschlagen, damit es nicht wie krass.erforscht aussieht>

Vorgehen:
1. Hänge das neue Repository an diese Sitzung an und übernimm den Code aus krass-erforscht/krass-erforscht als Startpunkt
   (alle .js-Dateien, package.json, package-lock.json, .gitignore, CLAUDE.md). Nicht übernehmen: posts/, out/, images/, videos/, data/, music/library.json.
2. Passe alles an den neuen Account an: Handle in template.js, reel.js und video-reel.js, Repository-Pfade in publish.js
   (raw.githubusercontent.com und cdn.jsdelivr.net), User-Agent in den Such-Skripten, Kategorien/Themen in choose.js,
   Feeds in fetch-news.js, Texte und Regeln in CLAUDE.md, Farben im Folien-Design. Erstelle ein eigenes Profilbild und schlage Name und Bio vor.
3. Teste alles mit einem echten ersten Post (Recherche, Fotos, ggf. Video, Folien, Reel mit Musik) und zeige mir die Vorschau, bevor du postest.
4. Richte danach drei tägliche geplante Aufgaben in dieser Sitzung ein (7:45, 12:15, 18:15 Uhr, Zeitzone Europe/Berlin), die jeweils
   zuerst Kommentare beantworten und dann per slot.js entscheiden, ob gepostet wird – genau wie im Vorbild.
5. Lege eine Erinnerung 7 Tage vor Ablauf des Instagram-Tokens an (Token gilt ca. 60 Tage).

Grundregeln (unverändert vom Vorbild übernehmen):
- Es darf nichts kosten. Keine kostenpflichtigen Dienste.
- Nur frei lizenzierte Bilder, Videos und Musik (Public Domain, CC0, CC BY, CC BY-SA) mit Nachweis; nie Inhalte von YouTube,
  TikTok, Instagram oder Nachrichtenseiten. Symbolvideos nur, wenn sie das Prinzip zeigen, und sichtbar gekennzeichnet.
- Fakten aus einer seriösen Quelle, nichts übertreiben, vorsichtige Formulierungen beibehalten.
- Sicherheitsregeln: keine Straftaten, Unglücke mit Opfern, Krieg, Politik, Religion, Gesundheitstipps, Privatpersonen.
- Ehrlich über KI: „Text mit KI erstellt“ in jeder Beschreibung; höchstens 5 Hashtags.
- Kein automatisches Folgen/Liken, keine inoffiziellen Bots – nur die offizielle Instagram-Schnittstelle.
- Immer nach der besten Reichweite richten (choose.js): 3 von 4 Tagen das Beste, am 4. Tag etwas anderes zum Weiterlernen.
- Einmal täglich selbst verbessern (höchstens eine getestete Änderung), mich nur fragen, wenn du etwas von mir brauchst.

Sprich mit mir auf Deutsch, einfach und ohne Fachbegriffe; ich arbeite oft vom Handy.
```

## Hinweise

- Jeder Account braucht **eine eigene Sitzung**, weil die geplanten Aufgaben in die Sitzung schreiben, in der sie angelegt wurden.
- Beide Accounts können dieselbe Meta-Entwickler-App nutzen: einfach den zweiten Account auch als Instagram-Tester eintragen
  und dafür einen eigenen Token erzeugen. Dann aber für die neue Sitzung eine **eigene Cloud-Umgebung** anlegen, damit der Token nicht vertauscht wird.
- Die Nische sollte sich deutlich von krass.erforscht unterscheiden, sonst konkurrieren beide Accounts um dieselben Leute.

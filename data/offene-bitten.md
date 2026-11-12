# Offene Bitten an den Nutzer

Was die App vom Nutzer braucht, seit wann, und wann zuletzt erinnert wurde.

## 2026-11-08: Kommentare echter Follower sind über die Schnittstelle unsichtbar
Die Meta-App läuft im Entwicklungsmodus; dann liefert Instagram nur Kommentare von eingetragenen Testern. Der Dino-Post hat 1 Kommentar, die App sieht ihn nicht.
Lösung: App Review bei Meta für erweiterten Zugriff auf instagram_business_manage_comments, dann App auf „Live“ stellen. Bis dahin Kommentare bitte in der Instagram-App selbst beantworten.
Zuerst gefragt: 2026-11-08. Nächste Erinnerung frühestens: 2026-11-11.
Status 2026-11-08: Nutzer will freischalten. Seiten (docs/datenschutz.html, docs/datenloeschung.html), App-Symbol und Anleitung (docs/meta-freischaltung.md) liegen bereit. Wartet auf Nutzer: GitHub Pages, Meta-Einstellungen, App-Prüfung.
Sobald der Nutzer einen Testkommentar meldet: den Kommentar beantworten. Nach Freigabe + neuem Token: Kommentar unter dem Dino-Post beantworten.

## 2026-11-12: Instagram-Vorbilder (Facebook-Login-Zugang)
Für den Blick auf fremde Instagram-Konten (Business Discovery) braucht es einen Schlüssel mit Facebook-Login: Facebook-Seite mit @krass.erforscht verbinden,
im Graph-API-Explorer einen Schlüssel mit instagram_basic, pages_show_list, pages_read_engagement, business_management erzeugen, verlängern
und über das sichere Formular (request_credential, Host graph.facebook.com) speichern. Nutzer hat zugestimmt, Schritt-für-Schritt-Anleitung am 12.11. geschickt.

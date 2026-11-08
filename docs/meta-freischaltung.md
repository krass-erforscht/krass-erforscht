# Meta-App freischalten (damit die App echte Kommentare sieht)

Dauer für dich: ca. 30–45 Minuten am PC, danach prüft Meta (meist einige Tage).

## Schritt 1: Datenschutzseite online stellen (GitHub, 2 Minuten)

1. Öffne **github.com/krass-erforscht/krass-erforscht** und melde dich an.
2. Oben auf **Settings** → links **Pages**.
3. Bei *Build and deployment* → *Source*: **Deploy from a branch**.
4. *Branch*: **main**, Ordner: **/docs** → **Save**.
5. Nach 1–2 Minuten sind die Seiten erreichbar:
   - Datenschutz: `https://krass-erforscht.github.io/krass-erforscht/datenschutz.html`
   - Datenlöschung: `https://krass-erforscht.github.io/krass-erforscht/datenloeschung.html`

## Schritt 2: App-Einstellungen bei Meta ausfüllen

1. developers.facebook.com/apps → App **krass.erforscht** öffnen.
2. Links **App-Einstellungen → Allgemeines** (bzw. *App settings → Basic*).
3. Eintragen:
   - **Datenschutzrichtlinien-URL** (*Privacy Policy URL*): die Datenschutz-Adresse von oben
   - **Datenlöschung** (*User data deletion*): „Anleitungs-URL zur Datenlöschung“ wählen → die Datenlöschungs-Adresse
   - **App-Symbol**: `brand/app-icon-1024.png` (auf GitHub öffnen → *Download*)
   - **Kategorie**: z. B. „Unternehmen und Seiten“ / *Business and Pages*
   - **Kontakt-E-Mail**: deine E-Mail-Adresse
4. **Änderungen speichern**.

## Schritt 3: Erweiterten Zugriff beantragen (App-Prüfung)

1. Links **App-Prüfung → Berechtigungen und Funktionen** (*App Review → Permissions and Features*).
2. Bei diesen vier Berechtigungen auf **„Erweiterten Zugriff anfordern“** (*Request advanced access*):
   - `instagram_business_basic`
   - `instagram_business_manage_comments` ← die wichtigste
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights`
3. Meta fragt pro Berechtigung nach einer **Beschreibung** und einem **Bildschirmvideo**. Texte siehe unten.
4. Falls Meta eine **Unternehmensverifizierung** verlangt: den Schritten folgen (als Einzelperson/Creator meist mit Ausweis/Adresse). Sag mir Bescheid, falls du dort hängst.

### Das Bildschirmvideo (eins für alle reicht meist, 1–2 Minuten)

So geht’s am einfachsten:
1. Schreib mit deinem **privaten Instagram-Account** einen Kommentar unter einen Post von @krass.erforscht, z. B. „Wie alt ist das Fossil genau?“.
   (Dein privater Account muss dafür als **Instagram-Tester** in der App eingetragen sein – genauso wie damals @krass.erforscht.)
2. Sag mir Bescheid – ich beantworte den Kommentar über die App.
3. Nimm am PC den Bildschirm auf (Windows: **Win + Alt + R**, Mac: **Cmd + Shift + 5**) und zeig darin:
   - das Profil von @krass.erforscht mit den automatisch veröffentlichten Posts,
   - den Post mit deinem Kommentar und der Antwort von @krass.erforscht,
   - die Statistik eines Posts (in der Instagram-App: Post → „Statistiken ansehen“).
4. Dieses Video bei allen vier Berechtigungen hochladen.

### Beschreibungstexte zum Kopieren (auf Englisch, so erwartet es Meta)

**instagram_business_basic**
> This app is a private tool used only to manage our own Instagram professional account @krass.erforscht (a German science-news account). We need instagram_business_basic to read our own account ID, username and media list so that our publishing and reply features can work. We do not access any other account's profile data.

**instagram_business_content_publish**
> We use instagram_business_content_publish to publish our own science-news posts (carousels and reels) to our own account @krass.erforscht. All content is created by us from freely licensed images/videos and labelled as AI-assisted. The screencast shows the posts published by the app on our profile.

**instagram_business_manage_comments**
> We use instagram_business_manage_comments to read comments that people leave on our own posts and to reply to them, so that followers get answers to their questions about the science news. We only read comments on @krass.erforscht's media, we store only the comment ID after replying (no names, no text), and we never comment on other accounts. The screencast shows a comment on our post and the reply sent by the app.

**instagram_business_manage_insights**
> We use instagram_business_manage_insights to read the statistics (reach, likes, saves, shares) of our own posts. This tells us which topics and formats our audience finds most useful, so we can post better content. Insights are only used internally and never shared.

## Schritt 4: Nach der Freigabe

1. Oben im App-Dashboard den Schalter **App-Modus** von „Entwicklung“ auf **„Live“** stellen.
2. In der App unter *API-Einrichtung mit Instagram-Login* einen **neuen Token generieren** und ihn wie bisher als `IG_TOKEN` eintragen
   (Sitzungstitel ⌄ → *Cloud-Umgebung bearbeiten* → *Umgebungsvariablen*).
3. Mir „fertig“ schreiben – ich teste, ob die Kommentare jetzt ankommen, und beantworte den Kommentar unter dem Dino-Post.

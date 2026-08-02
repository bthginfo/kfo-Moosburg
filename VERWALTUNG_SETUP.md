# KFO Moosburg Verwaltung – Einrichtung

Der Verwaltungsbereich ist unter `/verwaltung` erreichbar. Patientendaten und SMTP-Zugangsdaten werden nicht im Browser gespeichert. Als persistenter Datenspeicher dient ein ausschließlich für die Praxis bestimmtes Google Sheet; die API legt darin das ausgeblendete technische Tabellenblatt `KFO_Daten` automatisch an.

## Vercel-Umgebungsvariablen

Folgende Variablen müssen für Production, Preview und bei Bedarf Development gesetzt werden:

- `ADMIN_PASSWORD`: Passwort für den Praxis-Login.
- `ADMIN_SESSION_SECRET`: zufälliger, langer Wert zum Signieren der HttpOnly-Session.
- `ADMIN_ENCRYPTION_KEY`: separater zufälliger, langer Wert zur AES-256-Verschlüsselung des SMTP-Passworts.
- `CRON_SECRET`: zufälliger, langer Wert zum Schutz des täglichen Versandlaufs.
- `KFO_ADMIN_SHEET_ID`: ID eines eigenen Google Sheets für die Verwaltungsdaten.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: E-Mail-Adresse des Google-Service-Accounts.
- `GOOGLE_SERVICE_ACCOUNT_KEY`: privater Schlüssel des Service-Accounts; Zeilenumbrüche dürfen als `\\n` hinterlegt sein.
- `MAX_REMINDERS_PER_RUN` (optional): maximales Versandvolumen pro Lauf, Standard `100`.

Das Google Sheet muss für `GOOGLE_SERVICE_ACCOUNT_EMAIL` mit Bearbeitungsrechten freigegeben werden. Nicht die alten, generischen `GOOGLE_SHEET_ID`-Datenquellen verwenden.

## Automatischer Versand

Vercel ruft täglich um 07:00 Uhr UTC `/api/admin-reminders/dispatch` auf. Die Fälligkeit wird unabhängig davon in `Europe/Berlin` berechnet. Jeder Versand wird mit einer eindeutigen Kombination aus Regel, Termin und geplantem Versanddatum protokolliert; Wiederholungen des Cron-Laufs erzeugen deshalb keine Doppelmail.

## Datenschutz und Betrieb

- SMTP-Passwörter werden mit AES-256-GCM verschlüsselt gespeichert und nie an den Browser zurückgesendet.
- Admin-Sessions liegen in `HttpOnly`, `SameSite=Strict` Cookies und laufen nach zwölf Stunden ab.
- Vor dem Produktivbetrieb sollten Auftragsverarbeitung, Zugriffsrechte, Löschfristen und Backup-Prozess für Google Workspace mit dem Datenschutzkonzept der Praxis abgestimmt werden.
- Für mehrere Mitarbeitende oder granulare Rollen sollte als nächster Schritt ein individueller Benutzer-Login mit MFA ergänzt werden.

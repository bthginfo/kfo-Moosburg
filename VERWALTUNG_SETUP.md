# KFO Moosburg Verwaltung – Einrichtung

Der Verwaltungsbereich ist unter `/verwaltung` erreichbar. Patientendaten und SMTP-Zugangsdaten werden nicht im Browser gespeichert. Alle Kunden, Termine, Reminder-Regeln, Zielgruppen, SMTP-Einstellungen und Versandprotokolle liegen in einer relationalen PostgreSQL-Datenbank.

## PostgreSQL über Vercel anbinden

1. Im Vercel-Projekt den Bereich **Storage / Marketplace** öffnen.
2. **Neon Postgres** hinzufügen und eine Datenbank in einer passenden EU-Region anlegen.
3. Die Datenbank mit dem Projekt und den benötigten Umgebungen (Production, Preview, Development) verbinden.
4. Prüfen, dass Vercel `DATABASE_URL` oder die projektspezifisch präfixierte Variable `moosburg_DATABASE_URL` angelegt hat, und anschließend neu deployen.

Beim ersten geschützten API-Aufruf legt die Anwendung die benötigten Tabellen und Indizes automatisch an. Es sind keine manuellen SQL-Schritte erforderlich.

## Vercel-Umgebungsvariablen

Folgende Variablen müssen für Production, Preview und bei Bedarf Development gesetzt werden:

- `ADMIN_PASSWORD`: Passwort für den Praxis-Login.
- `ADMIN_SESSION_SECRET`: zufälliger, langer Wert zum Signieren der HttpOnly-Session.
- `ADMIN_ENCRYPTION_KEY`: separater zufälliger, langer Wert zur AES-256-Verschlüsselung des SMTP-Passworts.
- `CRON_SECRET`: zufälliger, langer Wert zum Schutz des täglichen Versandlaufs.
- `DATABASE_URL` oder `moosburg_DATABASE_URL`: gepoolte PostgreSQL-Verbindungsadresse; wird bei der Neon-Vercel-Integration automatisch gesetzt. Beide Namen werden von der Anwendung erkannt.
- `MAX_REMINDERS_PER_RUN` (optional): maximales Versandvolumen pro Lauf, Standard `100`.

## Automatischer Versand

Vercel ruft täglich um 07:00 Uhr UTC `/api/admin-reminders/dispatch` auf. Die Fälligkeit wird unabhängig davon in `Europe/Berlin` berechnet. Jeder Versand wird mit einer eindeutigen Kombination aus Regel, Termin und geplantem Versanddatum protokolliert; Wiederholungen des Cron-Laufs erzeugen deshalb keine Doppelmail.

## Datenschutz und Betrieb

- SMTP-Passwörter werden mit AES-256-GCM verschlüsselt gespeichert und nie an den Browser zurückgesendet.
- Admin-Sessions liegen in `HttpOnly`, `SameSite=Strict` Cookies und laufen nach zwölf Stunden ab.
- Die Datenbank sollte in einer EU-Region betrieben werden. Vor dem Produktivbetrieb müssen Auftragsverarbeitung, Zugriffsrechte, Löschfristen, Point-in-Time-Recovery und Backups mit dem Datenschutzkonzept der Praxis abgestimmt werden.
- Für mehrere Mitarbeitende oder granulare Rollen sollte als nächster Schritt ein individueller Benutzer-Login mit MFA ergänzt werden.

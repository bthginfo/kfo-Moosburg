# KFO Moosburg Verwaltung – Einrichtung

Der Verwaltungsbereich ist unter `/verwaltung` erreichbar. Patientendaten und SMTP-Zugangsdaten werden nicht im Browser gespeichert. Alle Kunden, Termine, Terminarten, Ressourcen, Online-Verfügbarkeiten, Reminder-Regeln, Zielgruppen, SMTP-Einstellungen und Versandprotokolle liegen in einer relationalen PostgreSQL-Datenbank.

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

## Terminverwaltung und Online-Buchung

Die Terminverwaltung ist unter `/verwaltung/termine` erreichbar. Der Admin kann interne Patiententermine, KFO-spezifische Terminarten, Behandler/Räume, wiederkehrende Online-Zeitfenster und Ausnahmen verwalten. Freie Online-Slots werden konfliktgeprüft aus diesen Regeln berechnet.

Die öffentliche Buchung ist bewusst doppelt abgesichert: Es wird weder ein öffentliches Buchungs-Widget eingebunden noch kann die Veröffentlichung im Admin aktiviert werden. Auf der Live-Website bleibt Dr. Flex unverändert aktiv, bis die Umstellung ausdrücklich beauftragt wird.

## Vorbereitete ivoris®-Anbindung

Termine besitzen Felder für Quellsystem, externe ID, Synchronisationsstatus und letzten Abgleich. Damit ist die Datenstruktur für `ivoris® termin` vorbereitet. Die echte Echtzeit-Synchronisation benötigt eine offiziell freigeschaltete `ivoris® webservice`-/`ivoris® connect pro`-Anbindung und die technische Dokumentation bzw. Zugangsdaten von Computer konkret/ivoris. Bis diese vorliegen, zeigt der Admin den Status `Zugang erforderlich` und führt keinen vorgetäuschten Abgleich aus. Dafür sind aktuell keine zusätzlichen Vercel-Umgebungsvariablen nötig.

## Interne Kostenvoranschläge

Unter `/verwaltung/kostenvoranschlaege` werden Kostenvoranschläge relational in PostgreSQL gespeichert. Jeder Stand ist mit einer Patientin oder einem Patienten verknüpft und enthält Preis-Snapshots der einzelnen Positionen, Status, Gültigkeit, Version, Patient:innenhinweise, interne Notizen und ein Ereignisprotokoll. Angenommene Kostenvoranschläge sind gegen nachträgliche Bearbeitung gesperrt; Änderungen werden als neue Version angelegt.

Der Leistungskatalog wird bewusst nicht mit unbestätigten BEMA-, GOZ- oder KZVB-Werten vorbelegt. Festpreise und das optionale Modell `Punkte × Punktwert` müssen von der Praxis fachlich geprüft und gepflegt werden. Eine erwartete Kassenbeteiligung wird manuell erfasst und nicht pauschal angenommen. Der öffentliche Preisrechner aus dem Referenzprojekt wird nicht übernommen.

Die geschützte Druckansicht lässt sich über den Browser drucken oder als PDF speichern. Der E-Mail-Versand nutzt die bereits gespeicherten SMTP-Einstellungen; zusätzliche Vercel-Variablen sind dafür nicht erforderlich.

## Datenschutz und Betrieb

- SMTP-Passwörter werden mit AES-256-GCM verschlüsselt gespeichert und nie an den Browser zurückgesendet.
- Admin-Sessions liegen in `HttpOnly`, `SameSite=Strict` Cookies und laufen nach zwölf Stunden ab.
- Die Datenbank sollte in einer EU-Region betrieben werden. Vor dem Produktivbetrieb müssen Auftragsverarbeitung, Zugriffsrechte, Löschfristen, Point-in-Time-Recovery und Backups mit dem Datenschutzkonzept der Praxis abgestimmt werden.
- Für mehrere Mitarbeitende oder granulare Rollen sollte als nächster Schritt ein individueller Benutzer-Login mit MFA ergänzt werden.

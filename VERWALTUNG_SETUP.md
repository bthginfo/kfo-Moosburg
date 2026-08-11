# KFO Moosburg Verwaltung – Einrichtung

Der Verwaltungsbereich ist unter `/verwaltung` erreichbar. Patientendaten und SMTP-Zugangsdaten werden nicht im Browser gespeichert. Alle Kunden, Termine, Terminarten, Ressourcen, Online-Verfügbarkeiten, Reminder-Regeln, Zielgruppen, SMTP-Einstellungen und Versandprotokolle liegen in einer relationalen PostgreSQL-Datenbank.

## PostgreSQL über Vercel anbinden

1. Im Vercel-Projekt den Bereich **Storage / Marketplace** öffnen.
2. **Neon Postgres** hinzufügen und eine Datenbank in einer passenden EU-Region anlegen.
3. Die produktive Datenbank ausschließlich mit der Vercel-Umgebung **Production** verbinden.
4. Für **Preview** eine eigene, leere Neon-Branch oder ein separates Neon-Projekt verwenden und dort ausschließlich synthetische Testdaten anlegen. Eine Branch, die von der befüllten Production-Datenbank geklont wurde, enthält zunächst dieselben Patientendaten und ist deshalb nicht als Testumgebung geeignet.
5. Für lokale Entwicklung ebenfalls eine getrennte Testdatenbank verwenden. Niemals eine lokale oder Preview-Installation mit der Production-Datenbank verbinden.
6. Prüfen, dass Vercel je Umgebung `DATABASE_URL` oder die projektspezifisch präfixierte Variable `moosburg_DATABASE_URL` angelegt hat, und anschließend neu deployen.

Die Neon-Vercel-Integration legt häufig mehrere Variablen wie `POSTGRES_URL`, `PGHOST` oder `DATABASE_URL_UNPOOLED` an. Die Anwendung verwendet ausschließlich die gepoolte `DATABASE_URL` beziehungsweise `moosburg_DATABASE_URL`. Die übrigen Variablen müssen nicht manuell auf einen der beiden unterstützten Namen kopiert werden.

Beim ersten geschützten API-Aufruf legt die Anwendung die benötigten Tabellen und Indizes automatisch an. Es sind keine manuellen SQL-Schritte erforderlich.

## Strikte Trennung der Vercel-Umgebungen

Production und Preview dürfen weder Datenbank, SMTP-Zugang noch Admin-Secrets teilen:

| Konfiguration | Production | Preview / Development |
| --- | --- | --- |
| PostgreSQL | Produktive Neon-Datenbank, nur Scope `Production` | Eigene leere Datenbank/Branch mit synthetischen Testdaten |
| Admin-Passwort | Eigenes starkes Production-Passwort | Je Umgebung ein anderes Test-Passwort |
| Session-, Verschlüsselungs- und Cron-Secrets | Eigene Production-Werte | Eigene, nicht wiederverwendete Testwerte; `CRON_SECRET` ist für Preview normalerweise nicht nötig |
| SMTP | Produktives Praxiskonto nur in der Production-Datenbank konfigurieren | Separates Testkonto oder Mail-Sink; niemals das Praxiskonto |

In Vercel muss bei jeder Variable der passende Environment-Scope kontrolliert werden. Insbesondere dürfen die Production-Werte von `DATABASE_URL`, `moosburg_DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_ENCRYPTION_KEY` und `CRON_SECRET` nicht zusätzlich für Preview oder Development freigeschaltet sein.

SMTP-Zugangsdaten werden nicht als Vercel-Variable hinterlegt, sondern im geschützten Adminbereich verschlüsselt in der jeweiligen Datenbank gespeichert. Deshalb darf auch keine Kopie der Production-Datenbank an Preview angebunden werden: Sie würde neben Patientendaten die verschlüsselten SMTP-Einstellungen enthalten. In Preview nur ein separates Testpostfach oder einen Mail-Sink konfigurieren.

## Erforderliche Vercel-Umgebungsvariablen

### Geheimnisse und Datenbank

- `DATABASE_URL` oder `moosburg_DATABASE_URL`: gepoolte PostgreSQL-Verbindungsadresse der jeweiligen Umgebung. Die URL enthält Zugangsdaten und ist wie ein Passwort zu behandeln. Genau einer der beiden Namen genügt.
- `ADMIN_PASSWORD`: einzigartiges Passwort für den Praxis-Login. Empfohlen sind mindestens 20 zufällige Zeichen aus einem Passwortmanager. Nicht für andere Dienste oder Umgebungen wiederverwenden.
- `ADMIN_SESSION_SECRET`: signiert die HttpOnly-Session. Pro Umgebung mindestens 32 kryptografisch zufällige Bytes verwenden. Eine Rotation meldet alle bestehenden Admin-Sessions ab.
- `ADMIN_ENCRYPTION_KEY`: verschlüsselt das gespeicherte SMTP-Passwort per AES-256-GCM. Pro Umgebung mindestens 32 kryptografisch zufällige Bytes verwenden und getrennt vom Session-Secret aufbewahren. Dieser Wert muss dauerhaft verfügbar bleiben; nach einer Rotation kann das bisher gespeicherte SMTP-Passwort nicht mehr entschlüsselt werden und muss im Adminbereich neu eingetragen werden.
- `CRON_SECRET`: schützt den automatischen Versandlauf. Nur für Production erforderlich, mindestens 32 kryptografisch zufällige Bytes und niemals identisch mit einem anderen Secret.

Die vier Secrets müssen unabhängig voneinander sein. Werte mit einem Passwortmanager oder einem kryptografisch sicheren Secret-Generator erzeugen, niemals aus Namen, Praxisdaten oder wiederkehrenden Mustern ableiten. Secrets nicht in Quellcode, Dokumentation, Screenshots, Tickets, Chatnachrichten oder Git-Commits einfügen. Bei vermuteter Offenlegung den betroffenen Wert sofort in Vercel rotieren; beim `ADMIN_ENCRYPTION_KEY` anschließend das SMTP-Passwort neu speichern.

### Optionale Variablen

- `MAX_REMINDERS_PER_RUN` (optional): maximales Versandvolumen pro Lauf, Standard `25`, maximal `100`. Diese Zahl ist kein Secret.
- `REMINDER_GRACE_DAYS` (optional): Zeitraum, in dem fehlgeschlagene oder wegen eines Ausfalls verpasste Erinnerungen erneut geprüft werden, Standard `7`, maximal `30` Tage.

## Preview-Deployments schützen

Im Vercel-Projekt unter **Settings → Deployment Protection** alle Preview-Deployments mit Vercel Authentication oder einer gleichwertigen Zugriffskontrolle schützen. Nur berechtigte Teammitglieder dürfen Preview-URLs öffnen. Die öffentliche Production-Domain der Praxis bleibt davon ausgenommen.

Zusätzlich gilt:

- Preview-Links nicht öffentlich teilen oder in Suchmaschinen indexieren lassen.
- In Preview nur synthetische Patient:innen verwenden; keine Exporte oder Backups aus Production importieren.
- Kein produktives SMTP-Konto in Preview testen. Ein Testversand darf ausschließlich an kontrollierte Testpostfächer gehen.
- Production-Secrets niemals temporär in Preview kopieren. Für jeden Scope eigene Werte erzeugen.
- Nach Änderungen an Variablen die betroffene Umgebung neu deployen und anschließend Login, Datenbankzugriff und – nur in Production – den Cron-Schutz prüfen.

## Automatischer Versand

Vercel ruft täglich um 07:00 Uhr UTC `/api/admin-reminders/dispatch` auf. Die Fälligkeit wird unabhängig davon in `Europe/Berlin` berechnet. Jeder Versand wird mit einer eindeutigen Kombination aus Regel, Termin und geplantem Versanddatum protokolliert. Ein nach SMTP-Versand nicht sicher abgeschlossener Lauf wird als „Versandstatus unklar“ quarantänisiert und nicht automatisch wiederholt, damit keine unkontrollierte Doppelmail entsteht.

## Terminverwaltung und Online-Buchung

Die Terminverwaltung ist unter `/verwaltung/termine` erreichbar. Der Admin kann interne Patiententermine, KFO-spezifische Terminarten, Behandler/Räume, wiederkehrende Online-Zeitfenster und Ausnahmen verwalten. Freie Online-Slots werden konfliktgeprüft aus diesen Regeln berechnet.

Die öffentliche Buchung ist bewusst doppelt abgesichert: Es wird weder ein öffentliches Buchungs-Widget eingebunden noch kann die Veröffentlichung im Admin aktiviert werden. Auf der Live-Website bleibt Dr. Flex unverändert aktiv, bis die Umstellung ausdrücklich beauftragt wird.

## Vorbereitete ivoris®-Anbindung

Termine besitzen Felder für Quellsystem, externe ID, Synchronisationsstatus und letzten Abgleich. Damit ist die Datenstruktur für `ivoris® termin` vorbereitet. Die echte Echtzeit-Synchronisation benötigt eine offiziell freigeschaltete `ivoris® webservice`-/`ivoris® connect pro`-Anbindung und die technische Dokumentation bzw. Zugangsdaten von Computer konkret/ivoris. Bis diese vorliegen, zeigt der Admin den Status `Zugang erforderlich` und führt keinen vorgetäuschten Abgleich aus. Dafür sind aktuell keine zusätzlichen Vercel-Umgebungsvariablen nötig.

## Rechnungsversand

Unter `/verwaltung/rechnungen` können passwortgeschützte PDF-Rechnungen oder ZIP-Dateien eingelesen und anhand der Patientennummer eindeutig zugeordnet werden. ZIP-Dateien werden ausschließlich im Browser entpackt. Der Server verarbeitet pro Versand genau eine PDF kurzzeitig im Arbeitsspeicher und übergibt sie direkt an den SMTP-Server; Rechnungsdateien werden weder in PostgreSQL noch in Blob-Speichern oder im Dateisystem persistiert. Gespeichert werden nur minimal erforderliche Status- und Versandnachweise.

Ein Versand ist nur mit gültiger E-Mail-Adresse, dokumentierter Rechnungs-E-Mail-Einwilligung und verschlüsselter PDF möglich. Das PDF-Kennwort darf nicht zusammen mit der Rechnung versendet werden. Der Browser-Tab muss während eines Stapelversands geöffnet bleiben; ein fortsetzbarer Hintergrundversand ist ohne temporäre Dokumentenspeicherung technisch nicht möglich. SMTP-Transportverschlüsselung ist keine Ende-zu-Ende-Verschlüsselung. Vor produktivem Einsatz sind Rechtsgrundlage, Einwilligungstext, AV-Verträge, technische und organisatorische Maßnahmen sowie das Kennwortverfahren fachlich und datenschutzrechtlich freizugeben.

Der Rechnungsstatus wird je Rechnung historisch geführt. `Bezahlt` darf nicht manuell gesetzt werden und wird erst mit der offiziellen iVoris-Anbindung aus dem Quellsystem übernommen. Ohne freigegebene iVoris-API findet kein vorgetäuschter Stammdaten- oder Zahlungsabgleich statt.

## Öffentliche Website-Inhalte

Texte und Praxisbilder der öffentlichen Website sind als lokaler Snapshot im Repository hinterlegt. Storyblok wird zur Laufzeit nicht mehr verwendet; Änderungen erfolgen künftig direkt am Quellcode und den lokalen Assets.

## Interne Kostenvoranschläge

Unter `/verwaltung/kostenvoranschlaege` werden Kostenvoranschläge relational in PostgreSQL gespeichert. Jeder Stand ist mit einer Patientin oder einem Patienten verknüpft und enthält Preis-Snapshots der einzelnen Positionen, Status, Gültigkeit, Version, Patient:innenhinweise, interne Notizen und ein Ereignisprotokoll. Angenommene Kostenvoranschläge sind gegen nachträgliche Bearbeitung gesperrt; Änderungen werden als neue Version angelegt.

Der Admin enthält einen kuratierten Import des offiziellen KFO-relevanten BEMA-Katalogs mit Stand 01.01.2026. Die bundeseinheitlichen BEMA-Punkte und der regional bzw. kassengruppenbezogen geltende KFO-Punktwert werden getrennt verwaltet. Über „Aktuelles Quartal von KZVB abrufen“ lädt die Anwendung ausschließlich die offizielle Quartals-CSV der KZVB; alternativ können CSV- oder XLSX-Dateien mit Vorschau und Zeilenprüfung importiert werden. Änderungen am BEMA müssen nach Veröffentlichung einer neuen offiziellen Fassung bewusst als neuer Katalogstand übernommen und fachlich kontrolliert werden.

Ein Kostenvoranschlag speichert die verwendeten BEMA-Punkte, das Punktwert-Quartal, die Kassenart und den verwendeten KFO-Punktwert als historischen Snapshot. So bleiben bereits erstellte Stände nachvollziehbar, auch wenn später neue Quartalswerte importiert werden. Der berechnete BEMA-Honorarbetrag ist keine individuelle Erstattungszusage. KIG-Voraussetzungen, gesetzlicher Versichertenanteil, Mehr- und Zusatzleistungen sowie private Versicherungsbedingungen müssen separat geprüft werden; die voraussichtliche Kassenbeteiligung bleibt deshalb bewusst manuell. Der öffentliche Preisrechner aus dem Referenzprojekt wird nicht übernommen.

Offizielle Quellen:

- KZBV: `https://www.kzbv.de/zahnaerzte/rechtsgrundlagen/bema-und-goz/gebuehrenverzeichnisse/`
- KZVB Punktwerte: `https://www.kzvb.de/abrechnung/punktwerte`

Die geschützte Druckansicht lässt sich über den Browser drucken oder als PDF speichern. Aus Datenschutzgründen wird der eigentliche Kostenvoranschlag nicht unverschlüsselt per E-Mail verschickt. Der optionale SMTP-Versand sendet nur einen neutralen Abholhinweis; nach einer sicheren Übergabe markiert die Praxis den Stand manuell als „Versendet“.

## Datenschutz und Betrieb

- SMTP-Passwörter werden mit AES-256-GCM verschlüsselt gespeichert und nie an den Browser zurückgesendet.
- Admin-Sessions liegen in `HttpOnly`, `SameSite=Strict` Cookies und laufen nach zwölf Stunden ab.
- Die Datenbank sollte in einer EU-Region betrieben werden. Vor dem Produktivbetrieb müssen Auftragsverarbeitung, Zugriffsrechte, Löschfristen, Point-in-Time-Recovery und Backups mit dem Datenschutzkonzept der Praxis abgestimmt werden.
- Für mehrere Mitarbeitende oder granulare Rollen sollte als nächster Schritt ein individueller Benutzer-Login mit MFA ergänzt werden.

# ivoris REST API v2 – Integrations- und Sicherheitskonzept

Stand: 2. Oktober 2026

Diese Anwendung bereitet ausschließlich eine Anbindung der Praxis an die **ivoris REST API v2** vor. Es wird keine Partner-API vorausgesetzt. Solange die vollständige Herstellerdokumentation, eine unterschriebene NDA, die Freischaltung und ein technisches Praxiskonto fehlen, bleibt jeder Datenaustausch im Code bewusst gesperrt.

Offizielle Übersicht: <https://www.ivoris.de/news/rest-api/>

## Voraussichtlich benötigte API-Pakete

| Paket | Verwendungszweck | Einstufung |
| --- | --- | --- |
| Basic | Patientenstammdaten, Dokumente, Kartei und Merkmale | erforderlich |
| Management | Termine, freie Zeiten, Terminarten, Behandler und Planeränderungen | erforderlich |
| Controlling | Zahlungsinformationen | nur bestellen, wenn ein rechnungsbezogener Zahlstatus tatsächlich enthalten ist |

Die öffentliche ivoris-Beschreibung nennt derzeit nur das **Zahlungsverhalten eines Patienten**. Sie bestätigt nicht, dass einzelne Rechnungen, Rechnungsnummern, offene Posten oder deren Bezahlt-Status abrufbar sind. Der Status `bezahlt` darf deshalb erst automatisch gesetzt werden, wenn ivoris diesen konkreten Endpunkt schriftlich bestätigt und die eindeutige Zuordnung beschrieben hat.

## Vor Freischaltung schriftlich von ivoris klären

### Vertrag und Berechtigungen

- Ist die REST API v2 die richtige **Praxis-API** für eine kundeneigene Anwendung der KFO Moosburg?
- Welche der Pakete Basic, Management und Controlling werden für die unten genannten Endpunkte benötigt?
- Sind `security plus`, Nutzerverwaltung und ivoris-Webanwendung vollständig eingerichtet?
- Kann ein separates technisches Konto ohne interaktiven Praxiszugang und mit minimalen Scopes angelegt werden?
- Lassen sich Lese- und Schreibrechte je Funktionsbereich getrennt vergeben?

### Verbindung und Authentifizierung

- Exakte Basis-URL je Production/Test, API-Version und Relay-v3-Verhalten
- Authentifizierungsverfahren, Token-Lebensdauer, Rotation und Widerruf
- Zulässige Quell-IP-Adressen, mTLS-Unterstützung und Zertifikatsrotation
- Mandanten-/Profilauswahl und eindeutige Praxiskennung
- Rate-Limits, maximale Seitengröße, Timeouts und Retry-Vorgaben
- Idempotency-Key für schreibende Anfragen
- Versionsfeld/ETag für konkurrierende Änderungen
- Verbindliche Fehlercodes und Verhalten bei Teilerfolgen

### Patientenstammdaten

- Unveränderliche externe Patienten-ID und fachliche Patientennummer
- Anrede, Vorname, Nachname, Geburtsdatum, Anschrift, Telefon, Mobil, E-Mail
- Aktiv-/Sperr-/Archivstatus sowie Änderungs- und Löschkennzeichen
- E-Mail-/Kommunikationseinwilligungen einschließlich Zeitpunkt und Quelle
- Änderungsfeed oder `updatedSince` mit stabiler Pagination

### Termine und Online-Buchung

- Termin-ID, Patient-ID, Terminart, Behandler, Stuhl/Raum, Beginn, Ende, Zeitzone
- Terminstatus, Bestätigung, Absage, No-show und fachliche Kommentare
- Freie Termine, Sprechzeiten, Sonderzeiten, Feiertage, Schulferien und Planeränderungen
- Atomare Reservierung bzw. `can-create` unmittelbar vor dem Anlegen
- Eindeutiges Konfliktverhalten bei parallelen Buchungen
- Webhooks/Events oder belastbarer Delta-Endpunkt für Änderungen

### Krankenversicherung

- Versicherungsart, Kasse, IK/Kassennummer, Gültigkeit und Änderungsverlauf
- Welcher Datensatz ist bei mehreren Versicherungsverhältnissen aktuell?
- Welche Felder dürfen für Kostenvoranschläge und Punktwertzuordnung genutzt werden?

### Rechnungen und Zahlungen

- Gibt es Endpunkte für einzelne Rechnungen/offene Posten oder nur aggregiertes Zahlungsverhalten?
- Eindeutige Rechnungs-ID, Rechnungsnummer, Patienten-ID, Rechnungsdatum, Fälligkeit und Betrag
- Statuswerte für offen, teilweise bezahlt, bezahlt, storniert und ausgebucht
- Änderungszeitpunkt und Delta-Abfrage für Zahlungen
- Können Rechnungs-PDFs sicher abgerufen werden? Falls ja: MIME-Typ, Größenlimit, Integritätswert und Abrufberechtigung
- Darf der automatisierte E-Mail-Versand nach Vertrag und Rollenmodell außerhalb von ivoris erfolgen?

## Technischer Sicherheitsrahmen

1. **Standardmäßig aus:** Der aktuelle Adapter wirft immer einen Sperrfehler. Eine UI-Einstellung kann ihn nicht aktivieren.
2. **Keine erfundenen Zugangsdaten:** Umgebungsvariablen für Authentifizierung werden erst benannt, wenn das dokumentierte Verfahren vorliegt.
3. **Nur Server-zu-Server:** Zugangsdaten und ivoris-Antworten werden niemals an den Browser ausgeliefert.
4. **Datenminimierung:** Sync-Protokolle speichern nur Bereich, Status und Zähler. Keine Namen, Patientennummern, externen IDs, Payloads oder Freitextfehler.
5. **Strikte Validierung:** Jede Remote-Antwort muss vor der Fachlogik gegen ein versionsgebundenes Schema geprüft werden. Unbekannte Pflichtfelder oder Enum-Werte stoppen den Lauf.
6. **Idempotenz:** Jeder Schreibbefehl benötigt einen stabilen Idempotency-Key. Wiederholungen dürfen keine doppelten Patienten oder Termine erzeugen.
7. **Konflikte statt Überschreiben:** Lokale und entfernte Änderungen mit abweichender Version landen in einer manuellen Konfliktprüfung.
8. **Least Privilege:** Separate technische Identität, getrennte Lese-/Schreibscopes und Production/Test-Zugänge.
9. **Keine sensiblen Logs:** HTTP-Header, Tokens, URLs mit Parametern, Payloads und personenbezogene IDs werden nicht geloggt.
10. **Sicherer Ausfall:** Bei Timeout nach einem Schreibbefehl gilt der Status als unklar. Vor einer Wiederholung muss über ivoris geprüft werden, ob die Änderung bereits übernommen wurde.

## Geplanter Synchronisationsablauf

1. Delta/Änderungen mit einem dokumentierten Cursor abrufen.
2. Antwortgröße, Content-Type und versionsgebundenes Schema prüfen.
3. Externe IDs eindeutig auf lokale Datensätze abbilden.
4. Änderungen in einer Datenbanktransaktion mit Versionsprüfung anwenden.
5. Konflikte und unklare Schreibvorgänge separat zur manuellen Prüfung markieren.
6. Erst nach erfolgreichem Commit den Cursor fortschreiben.
7. Im Audit nur Zähler und standardisierte Fehlercodes erfassen.

## Produktionsfreigabe

Vor dem ersten echten Datensatz müssen folgende Punkte abgeschlossen sein:

- Herstellerdokumentation und Berechtigungsmatrix technisch geprüft
- AV-Verträge, Rollen, Rechtsgrundlage, Löschfristen und TOMs mit Datenschutzbeauftragten geprüft
- Separate Testumgebung ausschließlich mit synthetischen Daten
- Bedrohungsmodell und Code-Review für Adapter, Mapping und Webhooks
- Negativtests für Rechte, Mandantentrennung, Pagination, Retries, Timeouts und Schemaänderungen
- Wiederanlauf-, Konflikt- und Notfallverfahren mit der Praxis getestet
- Monitoring ohne Patientendaten und Alarmierung für fehlgeschlagene/unklare Läufe
- Erst danach kontrollierte Pilotfreigabe mit wenigen Datensätzen

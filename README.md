# KFO Moosburg

Website und interne Praxisverwaltung der Kieferorthopädie Moosburg. Die öffentliche Website läuft unter `/`, die geschützte Verwaltung unter `/verwaltung`.

## Lokale Entwicklung

```bash
npm ci
npm run dev
```

Für lokale Admin-API-Tests `.env.example` als `.env.local` kopieren und ausschließlich mit einer separaten Testdatenbank befüllen.

Qualitätsprüfungen:

```bash
npm run typecheck
npm run build
npm audit
```

## Deployment

Das Projekt ist für Vercel und Neon PostgreSQL konfiguriert. Alle benötigten Umgebungsvariablen sowie die zwingende Trennung von Production und Preview sind in [VERWALTUNG_SETUP.md](./VERWALTUNG_SETUP.md) beschrieben.

Das vorbereitete Online-Buchungssystem ist bewusst noch nicht auf der öffentlichen Website aktiviert. Bis zur ausdrücklichen Umstellung bleibt die bestehende DR.FLEX-Buchung verlinkt. Die ivoris-Anbindung ist auf die REST API v2 vorbereitet, bleibt aber bis zur Prüfung der Praxis-API-Dokumentation und Freischaltung technisch gesperrt. Details stehen in [IVORIS_INTEGRATION.md](./IVORIS_INTEGRATION.md).

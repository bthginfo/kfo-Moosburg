import { randomUUID } from "node:crypto";
import { database } from "./kfoAdmin.js";

export type IvorisSyncScope = "patients" | "appointments" | "insurance" | "payments";
export type IvorisSyncDirection = "pull" | "push" | "bidirectional";
export type IvorisSyncRunStatus = "running" | "succeeded" | "failed" | "uncertain";

export type IvorisSyncRun = {
  id: string;
  scope: IvorisSyncScope;
  direction: IvorisSyncDirection;
  status: IvorisSyncRunStatus;
  recordsSeen: number;
  recordsChanged: number;
  recordsSkipped: number;
  errorCode: string;
  startedAt: string;
  finishedAt: string;
};

export type IvorisIntegrationStatus = {
  provider: "ivoris";
  apiVersion: "v2";
  state: "awaiting_contract" | "awaiting_configuration" | "ready" | "error";
  executionEnabled: boolean;
  message: string;
  packages: Array<{
    id: "basic" | "management" | "controlling";
    label: string;
    purpose: string;
    requirement: "required" | "conditional";
  }>;
  capabilities: Array<{
    id: IvorisSyncScope;
    label: string;
    state: "documented" | "needs_confirmation";
    direction: IvorisSyncDirection;
  }>;
  prerequisites: string[];
  securityControls: string[];
  recentRuns: IvorisSyncRun[];
};

/**
 * Boundary implemented by the eventual ivoris REST API v2 adapter.
 *
 * Remote payloads intentionally stay `unknown` here. The adapter must validate
 * every response against the vendor contract before it reaches a domain mapper.
 * This prevents an API change from silently corrupting patient data.
 */
export interface IvorisApiAdapter {
  readonly apiVersion: "v2";
  readonly executionEnabled: boolean;
  pullPage(scope: IvorisSyncScope, cursor?: string): Promise<{
    records: readonly unknown[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
  pushCommand(command: Readonly<{ type: string; idempotencyKey: string; payload: unknown }>): Promise<unknown>;
}

export class IvorisIntegrationUnavailableError extends Error {
  code = "ivoris_integration_unavailable";

  constructor() {
    super("Die ivoris-Anbindung ist gesperrt, bis die offizielle REST-API-v2-Dokumentation und Praxis-Zugangsdaten vorliegen.");
    this.name = "IvorisIntegrationUnavailableError";
  }
}

/** Fail-closed adapter used until authentication, endpoints and schemas are known. */
export const unavailableIvorisAdapter: IvorisApiAdapter = Object.freeze({
  apiVersion: "v2" as const,
  executionEnabled: false,
  async pullPage() {
    throw new IvorisIntegrationUnavailableError();
  },
  async pushCommand() {
    throw new IvorisIntegrationUnavailableError();
  },
});

let schemaReady: Promise<void> | null = null;

async function ensureIvorisSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = database();
    await sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS kfo_ivoris_sync_runs (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL CHECK (scope IN ('patients', 'appointments', 'insurance', 'payments')),
        direction TEXT NOT NULL CHECK (direction IN ('pull', 'push', 'bidirectional')),
        status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'uncertain')),
        records_seen INTEGER NOT NULL DEFAULT 0 CHECK (records_seen >= 0),
        records_changed INTEGER NOT NULL DEFAULT 0 CHECK (records_changed >= 0),
        records_skipped INTEGER NOT NULL DEFAULT 0 CHECK (records_skipped >= 0),
        error_code TEXT NOT NULL DEFAULT '',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE INDEX IF NOT EXISTS kfo_ivoris_sync_runs_started_idx
        ON kfo_ivoris_sync_runs (started_at DESC)`,
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function iso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRun(row: any): IvorisSyncRun {
  return {
    id: String(row.id),
    scope: row.scope,
    direction: row.direction,
    status: row.status,
    recordsSeen: Number(row.recordsSeen || 0),
    recordsChanged: Number(row.recordsChanged || 0),
    recordsSkipped: Number(row.recordsSkipped || 0),
    errorCode: String(row.errorCode || ""),
    startedAt: iso(row.startedAt),
    finishedAt: iso(row.finishedAt),
  };
}

export async function getIvorisIntegrationStatus(): Promise<IvorisIntegrationStatus> {
  await ensureIvorisSchema();
  const sql = database();
  await sql`UPDATE kfo_ivoris_sync_runs SET status = 'uncertain', error_code = 'stale_run', finished_at = NOW()
    WHERE status = 'running' AND started_at < NOW() - INTERVAL '30 minutes'`;
  const rows = await sql`SELECT id, scope, direction, status,
      records_seen AS "recordsSeen", records_changed AS "recordsChanged",
      records_skipped AS "recordsSkipped", error_code AS "errorCode",
      started_at AS "startedAt", finished_at AS "finishedAt"
    FROM kfo_ivoris_sync_runs ORDER BY started_at DESC LIMIT 20`;

  return {
    provider: "ivoris",
    apiVersion: "v2",
    state: "awaiting_contract",
    executionEnabled: false,
    message: "Sicher vorbereitet. Der Datenaustausch bleibt technisch gesperrt, bis Vertrag, Berechtigungen und die vollständige Herstellerdokumentation geprüft sind.",
    packages: [
      { id: "basic", label: "Basic", purpose: "Patientenstammdaten, Dokumente, Kartei und Merkmale", requirement: "required" },
      { id: "management", label: "Management", purpose: "Termine, Planer, Behandler und Wartezimmer", requirement: "required" },
      { id: "controlling", label: "Controlling", purpose: "Zahlungsinformationen; Rechnungsstatus muss ivoris noch bestätigen", requirement: "conditional" },
    ],
    capabilities: [
      { id: "patients", label: "Patientenstammdaten", state: "documented", direction: "bidirectional" },
      { id: "appointments", label: "Termine und freie Zeiten", state: "documented", direction: "bidirectional" },
      { id: "insurance", label: "Krankenversicherung", state: "documented", direction: "pull" },
      { id: "payments", label: "Rechnungsbezogener Zahlstatus", state: "needs_confirmation", direction: "pull" },
    ],
    prerequisites: [
      "ivoris security plus und Webanwendung betriebsbereit",
      "Nutzerverwaltung mit eigenem technischen Konto und Minimalrechten",
      "Unterzeichnete NDA und freigeschaltete API-v2-Pakete",
      "Praxis-API-Dokumentation inklusive Authentifizierung, Limits und Fehlercodes",
    ],
    securityControls: [
      "Keine Zugangsdaten im Browser oder in der Datenbank",
      "Standardmäßig deaktiviert und ohne Herstellervertrag nicht ausführbar",
      "Synchronisationsprotokolle enthalten nur Zähler und Fehlercodes, keine Patientendaten",
      "Spätere Schreibzugriffe benötigen Idempotenz, Versionsprüfung und Konfliktwarteschlange",
    ],
    recentRuns: (rows as any[]).map(mapRun),
  };
}

/**
 * Creates a metadata-only audit record. Do not pass names, patient numbers,
 * external identifiers, payloads or free-text errors into this function.
 */
export async function beginIvorisSyncRun(scope: IvorisSyncScope, direction: IvorisSyncDirection): Promise<string> {
  await ensureIvorisSchema();
  const id = randomUUID();
  const sql = database();
  await sql`INSERT INTO kfo_ivoris_sync_runs (id, scope, direction, status)
    VALUES (${id}, ${scope}, ${direction}, 'running')`;
  return id;
}

export async function finishIvorisSyncRun(input: {
  id: string;
  status: Exclude<IvorisSyncRunStatus, "running">;
  recordsSeen?: number;
  recordsChanged?: number;
  recordsSkipped?: number;
  errorCode?: string;
}): Promise<void> {
  await ensureIvorisSchema();
  const sql = database();
  const safeErrorCode = /^[a-z0-9_.-]{0,80}$/i.test(input.errorCode || "") ? input.errorCode || "" : "redacted_error";
  await sql`UPDATE kfo_ivoris_sync_runs SET status = ${input.status},
      records_seen = ${safeCount(input.recordsSeen)},
      records_changed = ${safeCount(input.recordsChanged)},
      records_skipped = ${safeCount(input.recordsSkipped)},
      error_code = ${safeErrorCode}, finished_at = NOW()
    WHERE id = ${input.id} AND status = 'running'`;
}

function safeCount(value: number | undefined): number {
  return Math.min(2_147_483_647, Math.max(0, Math.trunc(Number.isFinite(value) ? value || 0 : 0)));
}

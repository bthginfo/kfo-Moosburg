import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { buildTransport, isValidEmail, loadStore } from "./kfoAdmin.js";
import { practiceMail } from "./kfoMail.js";
import {
  BEMA_SOURCE_URL,
  BEMA_SOURCE_VERSION,
  FUND_TYPE_LABELS,
  KZVB_POINT_VALUE_PAGE_URL,
  OFFICIAL_BEMA_KFO_2026,
  pointValueCsvUrl,
} from "./kfoFeeData.js";

export type EstimateStatus = "draft" | "in_review" | "sent" | "accepted" | "declined" | "expired" | "archived";
export type EstimateEntity = "estimate" | "catalogItem";

export class EstimateError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "validation_error") {
    super(message);
    this.name = "EstimateError";
    this.status = status;
    this.code = code;
  }
}

export type EstimateCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  calculationType: "fixed" | "points";
  points: number;
  pointValue: number;
  unitPriceCents: number;
  computedUnitPriceCents: number;
  unit: string;
  active: boolean;
  externalReference: string;
  feeSystem: "BEMA" | "GOZ" | "private";
  source: string;
  sourceVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type EstimateLineItem = {
  id: string;
  catalogItemId: string;
  position: number;
  code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  discountPercent: number;
  totalCents: number;
  note: string;
  feeSystem: "BEMA" | "GOZ" | "private";
  points: number;
  pointValue: number;
};

export type EstimatePointValue = {
  id: string;
  quarter: string;
  fundGroup: number;
  fundType: string;
  fundTypeLabel: string;
  fundNumber: string;
  pwKfo: number;
  source: string;
  sourceUrl: string;
  importedAt: string;
};

export type CostEstimate = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerBirthDate: string;
  customerEmail: string;
  customerAddress: string;
  title: string;
  diagnosis: string;
  insuranceType: string;
  insurer: string;
  kigLevel: string;
  pointValueQuarter: string;
  insurerGroup: string;
  status: EstimateStatus;
  validUntil: string;
  version: number;
  revisionOfId: string;
  internalNotes: string;
  patientNote: string;
  terms: string;
  subtotalCents: number;
  insuranceShareCents: number;
  patientShareCents: number;
  currency: "EUR";
  sentAt: string;
  acceptedAt: string;
  pickupNoticeSent: boolean;
  createdAt: string;
  updatedAt: string;
  items: EstimateLineItem[];
};

export type EstimateEvent = {
  id: number;
  estimateId: string;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  detail: string;
  createdAt: string;
};

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function database() {
  const connectionString = env("DATABASE_URL") || env("moosburg_DATABASE_URL");
  if (!connectionString) throw new Error("DATABASE_URL oder moosburg_DATABASE_URL fehlt.");
  return neon(connectionString);
}

let schemaReady: Promise<void> | null = null;

async function ensureEstimateSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await loadStore();
    const sql = database();
    await sql.transaction([
      sql`CREATE SEQUENCE IF NOT EXISTS kfo_estimate_number_seq START 1`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimate_catalog (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Behandlung',
        calculation_type TEXT NOT NULL DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'points')),
        points NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (points >= 0),
        point_value NUMERIC(12,6) NOT NULL DEFAULT 0 CHECK (point_value >= 0),
        unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
        unit TEXT NOT NULL DEFAULT 'Stück',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        external_reference TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS kfo_estimate_catalog_code_idx ON kfo_estimate_catalog (LOWER(code)) WHERE code <> ''`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimates (
        id TEXT PRIMARY KEY,
        estimate_number TEXT UNIQUE NOT NULL,
        customer_id TEXT REFERENCES kfo_customers(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_birth_date DATE,
        customer_email TEXT NOT NULL DEFAULT '',
        customer_address TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT 'Kieferorthopädischer Kostenvoranschlag',
        diagnosis TEXT NOT NULL DEFAULT '',
        insurance_type TEXT NOT NULL DEFAULT '',
        insurer TEXT NOT NULL DEFAULT '',
        kig_level TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'sent', 'accepted', 'declined', 'expired', 'archived')),
        valid_until DATE,
        version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
        revision_of_id TEXT REFERENCES kfo_estimates(id) ON DELETE SET NULL,
        internal_notes TEXT NOT NULL DEFAULT '',
        patient_note TEXT NOT NULL DEFAULT '',
        terms TEXT NOT NULL DEFAULT '',
        subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
        insurance_share_cents INTEGER NOT NULL DEFAULT 0 CHECK (insurance_share_cents >= 0),
        patient_share_cents INTEGER NOT NULL DEFAULT 0 CHECK (patient_share_cents >= 0),
        currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
        sent_at TIMESTAMPTZ,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimate_items (
        id TEXT PRIMARY KEY,
        estimate_id TEXT NOT NULL REFERENCES kfo_estimates(id) ON DELETE CASCADE,
        catalog_item_id TEXT REFERENCES kfo_estimate_catalog(id) ON DELETE SET NULL,
        position INTEGER NOT NULL DEFAULT 0,
        code TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
        unit TEXT NOT NULL DEFAULT 'Stück',
        unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
        discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
        total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
        note TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimate_events (
        id BIGSERIAL PRIMARY KEY,
        estimate_id TEXT NOT NULL REFERENCES kfo_estimates(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        from_status TEXT NOT NULL DEFAULT '',
        to_status TEXT NOT NULL DEFAULT '',
        detail TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimate_deliveries (
        estimate_id TEXT PRIMARY KEY REFERENCES kfo_estimates(id) ON DELETE CASCADE,
        recipient TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('processing', 'sent', 'failed')),
        claim_token TEXT NOT NULL,
        error TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_estimate_point_values (
        id TEXT PRIMARY KEY,
        quarter TEXT NOT NULL CHECK (quarter ~ '^\\d{4}Q[1-4]$'),
        kzv_number INTEGER NOT NULL DEFAULT 11,
        fund_group INTEGER NOT NULL,
        fund_type TEXT NOT NULL,
        fund_number TEXT NOT NULL DEFAULT '',
        pw_kfo NUMERIC(12,6) NOT NULL CHECK (pw_kfo >= 0),
        source TEXT NOT NULL DEFAULT 'KZVB',
        source_url TEXT NOT NULL DEFAULT '',
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (quarter, fund_group, fund_type, fund_number)
      )`,
      sql`ALTER TABLE kfo_estimate_catalog ADD COLUMN IF NOT EXISTS fee_system TEXT NOT NULL DEFAULT 'private' CHECK (fee_system IN ('BEMA', 'GOZ', 'private'))`,
      sql`ALTER TABLE kfo_estimate_catalog ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'Praxis'`,
      sql`ALTER TABLE kfo_estimate_catalog ADD COLUMN IF NOT EXISTS source_version TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_estimates ADD COLUMN IF NOT EXISTS point_value_quarter TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_estimates ADD COLUMN IF NOT EXISTS insurer_group TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_estimate_items ADD COLUMN IF NOT EXISTS fee_system TEXT NOT NULL DEFAULT 'private' CHECK (fee_system IN ('BEMA', 'GOZ', 'private'))`,
      sql`ALTER TABLE kfo_estimate_items ADD COLUMN IF NOT EXISTS points NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (points >= 0)`,
      sql`ALTER TABLE kfo_estimate_items ADD COLUMN IF NOT EXISTS point_value NUMERIC(12,6) NOT NULL DEFAULT 0 CHECK (point_value >= 0)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimates_customer_idx ON kfo_estimates (customer_id, created_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimates_status_idx ON kfo_estimates (status, updated_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimate_items_estimate_idx ON kfo_estimate_items (estimate_id, position)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimate_events_estimate_idx ON kfo_estimate_events (estimate_id, created_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimate_point_values_quarter_idx ON kfo_estimate_point_values (quarter DESC, fund_group, fund_type)`,
      sql`WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY revision_of_id ORDER BY created_at, id) + 1 AS next_version
        FROM kfo_estimates WHERE revision_of_id IS NOT NULL
      ) UPDATE kfo_estimates e SET version = ranked.next_version
        FROM ranked WHERE e.id = ranked.id AND e.version <> ranked.next_version`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS kfo_estimates_revision_version_idx ON kfo_estimates (revision_of_id, version) WHERE revision_of_id IS NOT NULL`,
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function cleanText(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoDate(value: unknown): string {
  const date = cleanText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : "";
}

function numberValue(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function integer(value: unknown, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return Math.max(min, Math.min(max, Math.round(numberValue(value, fallback))));
}

function databaseErrorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : "";
}

function timestamp(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
}

function mapCatalog(row: any): EstimateCatalogItem {
  const points = Number(row.points) || 0;
  const pointValue = Number(row.pointValue) || 0;
  const unitPriceCents = Number(row.unitPriceCents) || 0;
  return {
    id: row.id,
    code: row.code || "",
    name: row.name,
    description: row.description || "",
    category: row.category || "Behandlung",
    calculationType: row.calculationType,
    points,
    pointValue,
    unitPriceCents,
    computedUnitPriceCents: row.calculationType === "points" ? Math.round(points * pointValue * 100) : unitPriceCents,
    unit: row.unit || "Stück",
    active: Boolean(row.active),
    externalReference: row.externalReference || "",
    feeSystem: row.feeSystem === "BEMA" || row.feeSystem === "GOZ" ? row.feeSystem : "private",
    source: row.source || "Praxis",
    sourceVersion: row.sourceVersion || "",
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
  };
}

function mapItem(row: any): EstimateLineItem {
  return {
    id: row.id,
    catalogItemId: row.catalogItemId || "",
    position: Number(row.position),
    code: row.code || "",
    description: row.description,
    category: row.category || "",
    quantity: Number(row.quantity),
    unit: row.unit || "Stück",
    unitPriceCents: Number(row.unitPriceCents),
    discountPercent: Number(row.discountPercent),
    totalCents: Number(row.totalCents),
    note: row.note || "",
    feeSystem: row.feeSystem === "BEMA" || row.feeSystem === "GOZ" ? row.feeSystem : "private",
    points: Number(row.points) || 0,
    pointValue: Number(row.pointValue) || 0,
  };
}

function mapEstimate(row: any, items: EstimateLineItem[]): CostEstimate {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customerId || "",
    customerName: row.customerName,
    customerBirthDate: row.customerBirthDate || "",
    customerEmail: row.customerEmail || "",
    customerAddress: row.customerAddress || "",
    title: row.title,
    diagnosis: row.diagnosis || "",
    insuranceType: row.insuranceType || "",
    insurer: row.insurer || "",
    kigLevel: row.kigLevel || "",
    pointValueQuarter: row.pointValueQuarter || "",
    insurerGroup: row.insurerGroup || "",
    status: row.status,
    validUntil: row.validUntil || "",
    version: Number(row.version) || 1,
    revisionOfId: row.revisionOfId || "",
    internalNotes: row.internalNotes || "",
    patientNote: row.patientNote || "",
    terms: row.terms || "",
    subtotalCents: Number(row.subtotalCents),
    insuranceShareCents: Number(row.insuranceShareCents),
    patientShareCents: Number(row.patientShareCents),
    currency: "EUR",
    sentAt: timestamp(row.sentAt),
    acceptedAt: timestamp(row.acceptedAt),
    pickupNoticeSent: row.pickupNoticeSent === true,
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
    items,
  };
}

async function readBundle() {
  await ensureEstimateSchema();
  const sql = database();
  const [estimateRows, itemRows, catalogRows, eventRows, pointValueRows] = await sql.transaction([
    sql`SELECT id, estimate_number AS number, COALESCE(customer_id, '') AS "customerId", customer_name AS "customerName",
      COALESCE(customer_birth_date::text, '') AS "customerBirthDate", customer_email AS "customerEmail",
      customer_address AS "customerAddress", title, diagnosis, insurance_type AS "insuranceType", insurer,
      kig_level AS "kigLevel", point_value_quarter AS "pointValueQuarter", insurer_group AS "insurerGroup",
      status, COALESCE(valid_until::text, '') AS "validUntil", version,
      COALESCE(revision_of_id, '') AS "revisionOfId", internal_notes AS "internalNotes",
      patient_note AS "patientNote", terms, subtotal_cents AS "subtotalCents",
      insurance_share_cents AS "insuranceShareCents", patient_share_cents AS "patientShareCents",
      sent_at AS "sentAt", accepted_at AS "acceptedAt",
      EXISTS (SELECT 1 FROM kfo_estimate_deliveries delivery
        WHERE delivery.estimate_id = kfo_estimates.id AND delivery.status = 'sent') AS "pickupNoticeSent",
      created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_estimates ORDER BY updated_at DESC LIMIT 2000`,
    sql`SELECT id, estimate_id AS "estimateId", COALESCE(catalog_item_id, '') AS "catalogItemId", position,
      code, description, category, quantity, unit, unit_price_cents AS "unitPriceCents",
      discount_percent AS "discountPercent", total_cents AS "totalCents", note,
      fee_system AS "feeSystem", points, point_value AS "pointValue"
      FROM kfo_estimate_items ORDER BY estimate_id, position`,
    sql`SELECT id, code, name, description, category, calculation_type AS "calculationType", points,
      point_value AS "pointValue", unit_price_cents AS "unitPriceCents", unit, active,
      external_reference AS "externalReference", fee_system AS "feeSystem", source,
      source_version AS "sourceVersion", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_estimate_catalog ORDER BY active DESC, category, code, name`,
    sql`SELECT id, estimate_id AS "estimateId", event_type AS "eventType", from_status AS "fromStatus",
      to_status AS "toStatus", detail, created_at AS "createdAt"
      FROM kfo_estimate_events ORDER BY created_at DESC LIMIT 500`,
    sql`SELECT id, quarter, fund_group AS "fundGroup", fund_type AS "fundType",
      fund_number AS "fundNumber", pw_kfo AS "pwKfo", source, source_url AS "sourceUrl",
      imported_at AS "importedAt"
      FROM kfo_estimate_point_values ORDER BY quarter DESC, fund_group, fund_type, fund_number`,
  ], { readOnly: true, isolationLevel: "RepeatableRead" });
  const itemsByEstimate = new Map<string, EstimateLineItem[]>();
  for (const row of itemRows as any[]) {
    const item = mapItem(row);
    itemsByEstimate.set(row.estimateId, [...(itemsByEstimate.get(row.estimateId) || []), item]);
  }
  return {
    estimates: (estimateRows as any[]).map((row) => mapEstimate(row, itemsByEstimate.get(row.id) || [])),
    catalog: (catalogRows as any[]).map(mapCatalog),
    events: (eventRows as any[]).map((row) => ({
      id: Number(row.id), estimateId: row.estimateId, eventType: row.eventType, fromStatus: row.fromStatus || "",
      toStatus: row.toStatus || "", detail: row.detail || "", createdAt: timestamp(row.createdAt),
    } as EstimateEvent)),
    pointValues: (pointValueRows as any[]).map((row) => ({
      id: row.id,
      quarter: row.quarter,
      fundGroup: Number(row.fundGroup),
      fundType: row.fundType,
      fundTypeLabel: FUND_TYPE_LABELS[row.fundType] || `Kassenart ${row.fundType}`,
      fundNumber: row.fundNumber || "",
      pwKfo: Number(row.pwKfo) || 0,
      source: row.source || "KZVB",
      sourceUrl: row.sourceUrl || KZVB_POINT_VALUE_PAGE_URL,
      importedAt: timestamp(row.importedAt),
    } as EstimatePointValue)),
  };
}

export async function loadEstimateBundle() {
  return readBundle();
}

function normalizeItems(input: any): EstimateLineItem[] {
  if (!Array.isArray(input) || !input.length) throw new EstimateError("Bitte fügen Sie mindestens eine Leistungsposition hinzu.");
  if (input.length > 200) throw new EstimateError("Bitte verwenden Sie höchstens 200 Leistungspositionen.");
  return input.map((row, index) => {
    const description = cleanText(row?.description, 500);
    if (!description) throw new EstimateError(`Bei Position ${index + 1} fehlt die Bezeichnung.`);
    const quantity = Math.round(Math.max(0.01, Math.min(9999, numberValue(row?.quantity, 1))) * 100) / 100;
    const unitPriceCents = integer(row?.unitPriceCents, 0, 0, 100_000_000);
    const discountPercent = Math.round(Math.max(0, Math.min(100, numberValue(row?.discountPercent, 0))) * 100) / 100;
    const totalCents = Math.max(0, Math.round(quantity * unitPriceCents * (1 - discountPercent / 100)));
    if (totalCents > 2_000_000_000) throw new EstimateError(`Der Betrag bei Position ${index + 1} ist zu hoch.`);
    return {
      id: randomUUID(),
      catalogItemId: cleanText(row?.catalogItemId, 100),
      position: index + 1,
      code: cleanText(row?.code, 80),
      description,
      category: cleanText(row?.category, 100),
      quantity,
      unit: cleanText(row?.unit, 40) || "Stück",
      unitPriceCents,
      discountPercent,
      totalCents,
      note: cleanText(row?.note, 500),
      feeSystem: row?.feeSystem === "BEMA" || row?.feeSystem === "GOZ" ? row.feeSystem : "private",
      points: Math.round(Math.max(0, Math.min(999_999_999.999, numberValue(row?.points))) * 1000) / 1000,
      pointValue: Math.round(Math.max(0, Math.min(999_999.999999, numberValue(row?.pointValue))) * 1_000_000) / 1_000_000,
    };
  });
}

const statuses: EstimateStatus[] = ["draft", "in_review", "sent", "accepted", "declined", "expired", "archived"];

export async function saveEstimate(input: any, fixedNewId = "") {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(input?.id, 100) || cleanText(fixedNewId, 100) || randomUUID();
  const existingRows = await sql`SELECT * FROM kfo_estimates WHERE id = ${id}`;
  const existing = (existingRows as any[])[0];
  if (input?.id && !existing) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  if (existing && !["draft", "in_review"].includes(existing.status)) {
    throw new EstimateError("Dieser Kostenvoranschlag ist unveränderlich. Erstellen Sie stattdessen eine neue Version.", 409, "estimate_locked");
  }
  if (existing && input?.updatedAt && timestamp(existing.updated_at) !== String(input.updatedAt)) {
    throw new EstimateError("Der Kostenvoranschlag wurde zwischenzeitlich geändert. Bitte laden Sie ihn neu.", 409, "stale_version");
  }

  const customerId = cleanText(input?.customerId, 100);
  if (!customerId) throw new EstimateError("Bitte wählen Sie eine Patientin oder einen Patienten aus.");
  const customerRows = await sql`SELECT id, first_name AS "firstName", last_name AS "lastName", birth_date::text AS "birthDate",
    email, street, postal_code AS "postalCode", city, insurance_type AS "insuranceType", insurer
    FROM kfo_customers WHERE id = ${customerId}`;
  const customer = (customerRows as any[])[0];
  if (!customer) throw new EstimateError("Die ausgewählte Patientin oder der ausgewählte Patient wurde nicht gefunden.", 404, "customer_not_found");

  const items = normalizeItems(input?.items);
  const pointValueQuarter = cleanText(input?.pointValueQuarter, 6);
  const insurerGroup = cleanText(input?.insurerGroup, 12);
  if (pointValueQuarter && !/^\d{4}Q[1-4]$/.test(pointValueQuarter)) throw new EstimateError("Bitte prüfen Sie das Punktwert-Quartal.");
  if (insurerGroup && !/^[0-9BDF]$/.test(insurerGroup)) throw new EstimateError("Bitte prüfen Sie die Kassenart.");
  const bemaItems = items.filter((item) => item.feeSystem === "BEMA");
  if (bemaItems.length) {
    if (!pointValueQuarter || !insurerGroup) {
      throw new EstimateError("Für BEMA-Positionen müssen Quartal und Kassenart ausgewählt sein.");
    }
    const pointRows = await sql`SELECT pw_kfo AS "pwKfo" FROM kfo_estimate_point_values
      WHERE quarter = ${pointValueQuarter} AND fund_type = ${insurerGroup} AND pw_kfo > 0
      ORDER BY fund_group, fund_number LIMIT 1`;
    const resolvedPointValue = Number((pointRows as any[])[0]?.pwKfo) || 0;
    if (!resolvedPointValue) {
      throw new EstimateError("Für diese Kassenart und dieses Quartal ist kein gültiger KFO-Punktwert hinterlegt.", 409, "missing_point_value");
    }
    const catalogIds = [...new Set(bemaItems.map((item) => item.catalogItemId).filter(Boolean))];
    const catalogRows = catalogIds.length
      ? await sql`SELECT id, points FROM kfo_estimate_catalog WHERE id = ANY(${catalogIds}) AND fee_system = 'BEMA'`
      : [];
    const catalogPoints = new Map((catalogRows as any[]).map((row) => [String(row.id), Number(row.points)]));
    for (const item of bemaItems) {
      const officialPoints = item.catalogItemId ? catalogPoints.get(item.catalogItemId) : item.points;
      if (!officialPoints || officialPoints <= 0) throw new EstimateError(`Für BEMA-Position ${item.code || item.position} fehlen gültige Punkte.`);
      item.points = officialPoints;
      item.pointValue = resolvedPointValue;
      item.unitPriceCents = Math.round(officialPoints * resolvedPointValue * 100);
      item.totalCents = Math.max(0, Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100)));
    }
  }
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  if (subtotalCents > 2_000_000_000) throw new EstimateError("Die Gesamtsumme ist zu hoch.");
  const insuranceShareCents = integer(input?.insuranceShareCents, 0, 0, subtotalCents);
  const patientShareCents = subtotalCents - insuranceShareCents;
  const status: EstimateStatus = existing?.status || "draft";
  const defaultTerms = "Dieser Kostenvoranschlag ist unverbindlich und basiert auf dem derzeit bekannten Behandlungsumfang. Tatsächliche Kosten, Erstattungen und Eigenanteile können sich durch den Behandlungsverlauf oder die Entscheidung des Kostenträgers ändern.";
  let number = existing?.estimate_number || "";
  if (!number) {
    const rows = await sql`SELECT CONCAT('KV-', TO_CHAR(CURRENT_DATE, 'YYYY'), '-', LPAD(nextval('kfo_estimate_number_seq')::text, 5, '0')) AS number`;
    number = (rows as any[])[0].number;
  }
  const beforeStatus = existing?.status || "";
  const validUntil = input?.validUntil ? isoDate(input.validUntil) : "";
  if (input?.validUntil && !validUntil) throw new EstimateError("Bitte prüfen Sie das Gültigkeitsdatum.");
  const address = [customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const queries: any[] = [
    sql`INSERT INTO kfo_estimates
      (id, estimate_number, customer_id, customer_name, customer_birth_date, customer_email, customer_address,
        title, diagnosis, insurance_type, insurer, kig_level, point_value_quarter, insurer_group,
        status, valid_until, version, revision_of_id,
        internal_notes, patient_note, terms, subtotal_cents, insurance_share_cents, patient_share_cents,
        currency, sent_at, accepted_at, created_at, updated_at)
      VALUES (${id}, ${number}, ${customerId}, ${`${customer.firstName} ${customer.lastName}`.trim()}, ${customer.birthDate || null},
        ${customer.email || ""}, ${address}, ${cleanText(input?.title, 200) || "Kieferorthopädischer Kostenvoranschlag"},
        ${cleanText(input?.diagnosis, 4000)}, ${cleanText(input?.insuranceType, 80) || customer.insuranceType || ""},
        ${cleanText(input?.insurer, 160) || customer.insurer || ""}, ${cleanText(input?.kigLevel, 20)},
        ${pointValueQuarter}, ${insurerGroup}, ${status},
        ${validUntil || addDays(today(), 30)}, ${Number(existing?.version) || 1}, ${existing?.revision_of_id || null},
        ${cleanText(input?.internalNotes, 4000)}, ${cleanText(input?.patientNote, 4000)},
        ${cleanText(input?.terms, 5000) || defaultTerms}, ${subtotalCents}, ${insuranceShareCents}, ${patientShareCents},
        'EUR', ${existing?.sent_at || null}, ${existing?.accepted_at || null}, ${existing?.created_at || new Date()}, NOW())
      ON CONFLICT (id) DO UPDATE SET customer_id = EXCLUDED.customer_id, customer_name = EXCLUDED.customer_name,
        customer_birth_date = EXCLUDED.customer_birth_date, customer_email = EXCLUDED.customer_email,
        customer_address = EXCLUDED.customer_address, title = EXCLUDED.title, diagnosis = EXCLUDED.diagnosis,
        insurance_type = EXCLUDED.insurance_type, insurer = EXCLUDED.insurer, kig_level = EXCLUDED.kig_level,
        point_value_quarter = EXCLUDED.point_value_quarter, insurer_group = EXCLUDED.insurer_group,
        status = EXCLUDED.status, valid_until = EXCLUDED.valid_until, internal_notes = EXCLUDED.internal_notes,
        patient_note = EXCLUDED.patient_note, terms = EXCLUDED.terms, subtotal_cents = EXCLUDED.subtotal_cents,
        insurance_share_cents = EXCLUDED.insurance_share_cents, patient_share_cents = EXCLUDED.patient_share_cents,
        updated_at = NOW()`,
    sql`DELETE FROM kfo_estimate_items WHERE estimate_id = ${id}`,
  ];
  for (const item of items) {
    queries.push(sql`INSERT INTO kfo_estimate_items
      (id, estimate_id, catalog_item_id, position, code, description, category, quantity, unit,
        unit_price_cents, discount_percent, total_cents, note, fee_system, points, point_value)
      VALUES (${item.id}, ${id}, ${item.catalogItemId || null}, ${item.position}, ${item.code}, ${item.description},
        ${item.category}, ${item.quantity}, ${item.unit}, ${item.unitPriceCents}, ${item.discountPercent}, ${item.totalCents},
        ${item.note}, ${item.feeSystem}, ${item.points}, ${item.pointValue})`);
  }
  queries.push(sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
    VALUES (${id}, ${existing ? "updated" : "created"}, ${beforeStatus}, ${status}, ${existing ? "Kostenvoranschlag bearbeitet" : "Kostenvoranschlag angelegt"})`);
  const guardQueries = existing ? [
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-estimate:${id}`}, 0))`,
    sql`SELECT 1 / CASE WHEN EXISTS (
      SELECT 1 FROM kfo_estimates e WHERE e.id = ${id} AND e.updated_at = ${existing.updated_at}
        AND e.status IN ('draft', 'in_review')
    ) AND NOT EXISTS (
      SELECT 1 FROM kfo_estimate_deliveries d WHERE d.estimate_id = ${id} AND d.status = 'processing'
    ) THEN 1 ELSE 0 END AS concurrency_guard`,
  ] : [];
  try {
    await sql.transaction([...guardQueries, ...queries]);
  } catch (error) {
    if (databaseErrorCode(error) === "22012") {
      throw new EstimateError("Der Kostenvoranschlag wurde zwischenzeitlich geändert oder wird gerade versendet. Bitte laden Sie ihn neu.", 409, "stale_version");
    }
    throw error;
  }
  return readBundle();
}

export async function saveCatalogItem(input: any) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(input?.id, 100) || randomUUID();
  let existing: any = null;
  if (input?.id) {
    const existingRows = await sql`SELECT * FROM kfo_estimate_catalog WHERE id = ${id}`;
    existing = (existingRows as any[])[0];
    if (!existing) throw new EstimateError("Die Katalogposition wurde nicht gefunden.", 404, "not_found");
  }
  const name = cleanText(input?.name, 240);
  if (!name) throw new EstimateError("Bitte geben Sie eine Bezeichnung für die Katalogposition ein.");
  const code = cleanText(input?.code, 80);
  if (code) {
    const duplicates = await sql`SELECT id FROM kfo_estimate_catalog WHERE LOWER(code) = LOWER(${code}) AND id <> ${id} LIMIT 1`;
    if ((duplicates as any[]).length) throw new EstimateError("Diese Positionsnummer ist im Leistungskatalog bereits vergeben.", 409, "duplicate_catalog_code");
  }
  const calculationType = input?.calculationType === "points" ? "points" : "fixed";
  const feeSystem = input?.feeSystem === "BEMA" || input?.feeSystem === "GOZ"
    ? input.feeSystem
    : input?.feeSystem === "private" ? "private" : existing?.fee_system || "private";
  const source = typeof input?.source === "string" ? cleanText(input.source, 120) || "Praxis" : existing?.source || "Praxis";
  const sourceVersion = typeof input?.sourceVersion === "string" ? cleanText(input.sourceVersion, 40) : existing?.source_version || "";
  const points = Math.round(Math.max(0, Math.min(999_999_999.999, numberValue(input?.points))) * 1000) / 1000;
  const pointValue = Math.round(Math.max(0, Math.min(999_999.999999, numberValue(input?.pointValue))) * 1_000_000) / 1_000_000;
  try {
    await sql`INSERT INTO kfo_estimate_catalog
      (id, code, name, description, category, calculation_type, points, point_value, unit_price_cents,
        unit, active, external_reference, fee_system, source, source_version, created_at, updated_at)
      VALUES (${id}, ${code}, ${name}, ${cleanText(input?.description, 1500)},
        ${cleanText(input?.category, 100) || "Behandlung"}, ${calculationType}, ${points},
        ${pointValue}, ${integer(input?.unitPriceCents, 0, 0, 100_000_000)},
        ${cleanText(input?.unit, 40) || "Stück"}, ${input?.active !== false}, ${cleanText(input?.externalReference, 160)},
        ${feeSystem}, ${source}, ${sourceVersion}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name,
        description = EXCLUDED.description, category = EXCLUDED.category,
        calculation_type = EXCLUDED.calculation_type, points = EXCLUDED.points,
        point_value = EXCLUDED.point_value, unit_price_cents = EXCLUDED.unit_price_cents,
        unit = EXCLUDED.unit, active = EXCLUDED.active, external_reference = EXCLUDED.external_reference,
        fee_system = EXCLUDED.fee_system, source = EXCLUDED.source, source_version = EXCLUDED.source_version,
        updated_at = NOW()`;
  } catch (error) {
    if (databaseErrorCode(error) === "23505") {
      throw new EstimateError("Diese Positionsnummer ist im Leistungskatalog bereits vergeben.", 409, "duplicate_catalog_code");
    }
    throw error;
  }
  return readBundle();
}

function currentBerlinQuarter(): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric" })
    .formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return `${year}Q${Math.ceil(month / 3)}`;
}

function decimalValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = cleanText(value, 80).replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedQuarter(value: unknown): string {
  const raw = cleanText(value, 20).toUpperCase().replace(/[\s./_-]/g, "");
  const direct = /^(\d{4})Q([1-4])$/.exec(raw);
  if (direct) return `${direct[1]}Q${direct[2]}`;
  const reversed = /^Q([1-4])(\d{4})$/.exec(raw);
  if (reversed) return `${reversed[2]}Q${reversed[1]}`;
  return "";
}

function firstValue(row: Record<string, unknown>, aliases: string[]): unknown {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9äöüß]/g, ""), value]));
  for (const alias of aliases) {
    const found = normalized.get(alias.toLowerCase().replace(/[^a-z0-9äöüß]/g, ""));
    if (found !== undefined && found !== null && String(found).trim() !== "") return found;
  }
  return "";
}

type PointValueInput = {
  quarter: string;
  kzvNumber: number;
  fundGroup: number;
  fundType: string;
  fundNumber: string;
  pwKfo: number;
};

function normalizePointValueRows(input: unknown): PointValueInput[] {
  if (!Array.isArray(input) || !input.length) throw new EstimateError("Die Punktwert-Datei enthält keine Datenzeilen.");
  if (input.length > 5000) throw new EstimateError("Bitte importieren Sie höchstens 5.000 Punktwertzeilen auf einmal.");
  return input.map((raw, index) => {
    const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const quarter = normalizedQuarter(firstValue(row, ["quarter", "quartal", "abrzeit", "ABR_ZEIT"]));
    const fundType = cleanText(firstValue(row, ["fundType", "kassenart", "kkart", "KK_ART"]), 4).toUpperCase();
    const fundGroup = integer(firstValue(row, ["fundGroup", "kassengruppe", "kgr", "KGR"]), 0, 0, 9999);
    const pwKfo = Math.round(decimalValue(firstValue(row, ["pwKfo", "punktwertkfo", "kfo", "PW_KFO"])) * 1_000_000) / 1_000_000;
    if (!quarter) throw new EstimateError(`Zeile ${index + 2}: Quartal fehlt oder ist ungültig.`);
    if (!/^[0-9BDF]$/.test(fundType)) throw new EstimateError(`Zeile ${index + 2}: Kassenart fehlt oder ist ungültig.`);
    if (!fundGroup) throw new EstimateError(`Zeile ${index + 2}: Kassengruppe fehlt oder ist ungültig.`);
    if (pwKfo < 0 || pwKfo > 100) throw new EstimateError(`Zeile ${index + 2}: KFO-Punktwert ist ungültig.`);
    return {
      quarter,
      kzvNumber: integer(firstValue(row, ["kzvNumber", "kzvnr", "KZV_NR"]), 11, 1, 99),
      fundGroup,
      fundType,
      fundNumber: cleanText(firstValue(row, ["fundNumber", "kassennummer", "kknrbkv", "KK_NR_BKV"]), 40),
      pwKfo,
    };
  });
}

async function storePointValues(rows: PointValueInput[], source: string, sourceUrl: string) {
  await ensureEstimateSchema();
  const sql = database();
  const queries = rows.map((row) => {
    const id = `${row.quarter}:${row.fundGroup}:${row.fundType}:${row.fundNumber || "-"}`;
    return sql`INSERT INTO kfo_estimate_point_values
      (id, quarter, kzv_number, fund_group, fund_type, fund_number, pw_kfo, source, source_url, imported_at)
      VALUES (${id}, ${row.quarter}, ${row.kzvNumber}, ${row.fundGroup}, ${row.fundType}, ${row.fundNumber},
        ${row.pwKfo}, ${source}, ${sourceUrl}, NOW())
      ON CONFLICT (quarter, fund_group, fund_type, fund_number) DO UPDATE SET
        kzv_number = EXCLUDED.kzv_number, pw_kfo = EXCLUDED.pw_kfo, source = EXCLUDED.source,
        source_url = EXCLUDED.source_url, imported_at = NOW()`;
  });
  await sql.transaction(queries);
  return readBundle();
}

export async function syncKzvbPointValues(quarterValue?: unknown) {
  const quarter = normalizedQuarter(quarterValue) || currentBerlinQuarter();
  const url = pointValueCsvUrl(quarter);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { Accept: "text/csv,text/plain" } });
  } catch (error) {
    throw new EstimateError(error instanceof Error && error.name === "AbortError"
      ? "Der Abruf bei der KZVB hat zu lange gedauert. Bitte verwenden Sie den Datei-Import."
      : "Die KZVB-Punktwerte konnten nicht abgerufen werden. Bitte verwenden Sie den Datei-Import.", 502, "kzvb_fetch_failed");
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new EstimateError(`Für ${quarter} wurde bei der KZVB keine CSV-Datei gefunden.`, 502, "kzvb_csv_unavailable");
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 1_000_000) throw new EstimateError("Die KZVB-Datei ist unerwartet groß.", 502, "kzvb_csv_too_large");
  const csv = await response.text();
  if (csv.length > 1_000_000) throw new EstimateError("Die KZVB-Datei ist unerwartet groß.", 502, "kzvb_csv_too_large");
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = (lines.shift() || "").split(";");
  const rows = lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(";")[index] ?? ""])));
  const normalized = normalizePointValueRows(rows);
  if (normalized.some((row) => row.quarter !== quarter || row.kzvNumber !== 11)) {
    throw new EstimateError("Die abgerufene Datei passt nicht zum angeforderten KZVB-Quartal.", 502, "kzvb_csv_mismatch");
  }
  return storePointValues(normalized, "KZVB-CSV", url);
}

export async function importEstimatePointValues(input: unknown) {
  return storePointValues(normalizePointValueRows(input), "Datei-Import", KZVB_POINT_VALUE_PAGE_URL);
}

type CatalogImportRow = {
  code: string;
  name: string;
  description: string;
  category: string;
  calculationType: "fixed" | "points";
  points: number;
  pointValue: number;
  unitPriceCents: number;
  unit: string;
  feeSystem: "BEMA" | "GOZ" | "private";
  source: string;
  sourceVersion: string;
};

function normalizeCatalogRows(input: unknown): CatalogImportRow[] {
  if (!Array.isArray(input) || !input.length) throw new EstimateError("Die Katalogdatei enthält keine Datenzeilen.");
  if (input.length > 2000) throw new EstimateError("Bitte importieren Sie höchstens 2.000 Leistungen auf einmal.");
  const seen = new Set<string>();
  return input.map((raw, index) => {
    const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const code = cleanText(firstValue(row, ["code", "position", "bema", "bemanr", "gebnr"]), 80);
    const name = cleanText(firstValue(row, ["name", "bezeichnung", "leistung", "leistungsbeschreibung"]), 240);
    const points = Math.round(decimalValue(firstValue(row, ["points", "punkte", "bewertungszahl", "bewzahl"])) * 1000) / 1000;
    if (!code) throw new EstimateError(`Zeile ${index + 2}: Positionscode fehlt.`);
    if (!name) throw new EstimateError(`Zeile ${index + 2}: Bezeichnung fehlt.`);
    if (seen.has(code.toLowerCase())) throw new EstimateError(`Zeile ${index + 2}: Positionscode ${code} kommt mehrfach vor.`);
    seen.add(code.toLowerCase());
    const feeRaw = cleanText(firstValue(row, ["feeSystem", "gebührensystem", "system"]), 20).toUpperCase();
    const feeSystem = feeRaw === "BEMA" || feeRaw === "GOZ" ? feeRaw : "private";
    const calculationType = feeSystem === "BEMA" || points > 0 ? "points" : "fixed";
    if (calculationType === "points" && points <= 0) throw new EstimateError(`Zeile ${index + 2}: Punktzahl fehlt oder ist ungültig.`);
    const unitPrice = decimalValue(firstValue(row, ["unitPrice", "einzelpreis", "preis", "betrag"]));
    return {
      code,
      name,
      description: cleanText(firstValue(row, ["description", "beschreibung", "hinweis"]), 1500),
      category: cleanText(firstValue(row, ["category", "kategorie", "bereich"]), 100) || "Behandlung",
      calculationType,
      points,
      pointValue: Math.round(decimalValue(firstValue(row, ["pointValue", "punktwert"])) * 1_000_000) / 1_000_000,
      unitPriceCents: integer(Math.round(unitPrice * 100), 0, 0, 100_000_000),
      unit: cleanText(firstValue(row, ["unit", "einheit"]), 40) || "Leistung",
      feeSystem,
      source: cleanText(firstValue(row, ["source", "quelle"]), 120) || "Datei-Import",
      sourceVersion: cleanText(firstValue(row, ["sourceVersion", "stand", "version", "gültigab"]), 40),
    };
  });
}

async function storeCatalogRows(rows: CatalogImportRow[]) {
  await ensureEstimateSchema();
  const sql = database();
  await sql.transaction(rows.map((row) => sql`INSERT INTO kfo_estimate_catalog
    (id, code, name, description, category, calculation_type, points, point_value, unit_price_cents,
      unit, active, external_reference, fee_system, source, source_version, created_at, updated_at)
    VALUES (${randomUUID()}, ${row.code}, ${row.name}, ${row.description}, ${row.category}, ${row.calculationType},
      ${row.points}, ${row.pointValue}, ${row.unitPriceCents}, ${row.unit}, TRUE, '', ${row.feeSystem},
      ${row.source}, ${row.sourceVersion}, NOW(), NOW())
    ON CONFLICT (LOWER(code)) WHERE code <> '' DO UPDATE SET name = EXCLUDED.name,
      description = EXCLUDED.description, category = EXCLUDED.category, calculation_type = EXCLUDED.calculation_type,
      points = EXCLUDED.points, point_value = EXCLUDED.point_value, unit_price_cents = EXCLUDED.unit_price_cents,
      unit = EXCLUDED.unit, active = TRUE, fee_system = EXCLUDED.fee_system, source = EXCLUDED.source,
      source_version = EXCLUDED.source_version, updated_at = NOW()`));
  return readBundle();
}

export async function importOfficialBemaCatalog() {
  return storeCatalogRows(OFFICIAL_BEMA_KFO_2026.map((item) => ({
    ...item,
    description: "",
    calculationType: "points" as const,
    pointValue: 0,
    unitPriceCents: 0,
    feeSystem: "BEMA" as const,
    source: "KZBV BEMA",
    sourceVersion: BEMA_SOURCE_VERSION,
  })));
}

export async function importEstimateCatalog(input: unknown) {
  return storeCatalogRows(normalizeCatalogRows(input));
}

export function estimateFeeSources() {
  return { bema: BEMA_SOURCE_URL, pointValues: KZVB_POINT_VALUE_PAGE_URL, bemaVersion: BEMA_SOURCE_VERSION };
}

export async function updateEstimateStatus(idValue: unknown, statusValue: unknown) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(idValue, 100);
  const status = cleanText(statusValue, 30) as EstimateStatus;
  if (!id || !statuses.includes(status)) throw new EstimateError("Ungültiger Status.");
  const rows = await sql`SELECT status FROM kfo_estimates WHERE id = ${id}`;
  const current = (rows as any[])[0];
  if (!current) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  if (current.status === status) return readBundle();
  const transitions: Record<EstimateStatus, EstimateStatus[]> = {
    draft: ["in_review", "archived"],
    in_review: ["draft", "sent", "archived"],
    sent: ["accepted", "declined", "expired", "archived"],
    accepted: ["archived"],
    declined: ["archived"],
    expired: ["archived"],
    archived: [],
  };
  if (!transitions[current.status as EstimateStatus]?.includes(status)) {
    throw new EstimateError("Dieser Statuswechsel ist nicht zulässig. Erstellen Sie bei Änderungen eine neue Version.", 409, "invalid_status_transition");
  }
  try {
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-estimate:${id}`}, 0))`,
      sql`SELECT 1 / CASE WHEN EXISTS (
        SELECT 1 FROM kfo_estimates e WHERE e.id = ${id} AND e.status = ${current.status}
      ) AND NOT EXISTS (
        SELECT 1 FROM kfo_estimate_deliveries d WHERE d.estimate_id = ${id} AND d.status = 'processing'
      ) THEN 1 ELSE 0 END AS status_guard`,
      sql`UPDATE kfo_estimates SET status = ${status},
      sent_at = CASE WHEN ${status} = 'sent' AND sent_at IS NULL THEN NOW() ELSE sent_at END,
      accepted_at = CASE WHEN ${status} = 'accepted' THEN NOW() ELSE accepted_at END,
      updated_at = NOW() WHERE id = ${id}`,
      sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
        VALUES (${id}, 'status_changed', ${current.status}, ${status}, 'Status geändert')`,
    ]);
  } catch (error) {
    if (databaseErrorCode(error) === "22012") {
      throw new EstimateError("Der Kostenvoranschlag wurde zwischenzeitlich geändert oder wird gerade versendet. Bitte laden Sie ihn neu.", 409, "stale_version");
    }
    throw error;
  }
  return readBundle();
}

export async function duplicateEstimate(idValue: unknown) {
  const bundle = await readBundle();
  const source = bundle.estimates.find((item) => item.id === cleanText(idValue, 100));
  if (!source) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  const copy = {
    ...source,
    id: "",
    status: "draft",
    title: source.title,
    items: source.items.map((item) => ({ ...item, id: "" })),
  };
  const createdId = randomUUID();
  await saveEstimate(copy, createdId);
  const sql = database();
  const rootId = source.revisionOfId || source.id;
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-estimate-revision:${rootId}`}, 0))`,
    sql`UPDATE kfo_estimates SET revision_of_id = ${rootId}, version = (
      SELECT COALESCE(MAX(version), 1) + 1 FROM kfo_estimates WHERE id = ${rootId} OR revision_of_id = ${rootId}
    ), updated_at = NOW() WHERE id = ${createdId}`,
    sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
      VALUES (${createdId}, 'revision_created', '', 'draft', ${`Neue Version aus ${source.number}`})`,
  ]);
  return readBundle();
}

export async function archiveEstimateEntity(entity: EstimateEntity, idValue: unknown) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(idValue, 100);
  if (!id) throw new EstimateError("Datensatz nicht gefunden.");
  if (entity === "estimate") {
    return updateEstimateStatus(id, "archived");
  } else {
    const rows = await sql`UPDATE kfo_estimate_catalog SET active = FALSE, updated_at = NOW() WHERE id = ${id} RETURNING id`;
    if (!(rows as any[]).length) throw new EstimateError("Die Katalogposition wurde nicht gefunden.", 404, "not_found");
  }
  return readBundle();
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

function euro(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function germanDate(date: string): string {
  if (!date) return "—";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function estimateDocumentHtml(estimate: CostEstimate, printControls: boolean): string {
  const rows = estimate.items.map((item) => {
    const basis = item.feeSystem === "BEMA" && item.points > 0 && item.pointValue > 0
      ? `<small>${escapeHtml(item.points.toLocaleString("de-DE"))} BEMA-Punkte × ${escapeHtml(item.pointValue.toLocaleString("de-DE", { minimumFractionDigits: 4, maximumFractionDigits: 6 }))} €</small>`
      : "";
    return `<tr><td>${escapeHtml(item.code || String(item.position))}</td><td><strong>${escapeHtml(item.description)}</strong>${basis}${item.discountPercent ? `<small>Rabatt: ${escapeHtml(item.discountPercent.toLocaleString("de-DE"))} %</small>` : ""}${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</td><td class="num">${item.quantity.toLocaleString("de-DE")} ${escapeHtml(item.unit)}</td><td class="num">${escapeHtml(euro(item.unitPriceCents))}</td><td class="num">${escapeHtml(euro(item.totalCents))}</td></tr>`;
  }).join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(estimate.number)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eaf3f8;color:#173249;font-family:Arial,sans-serif}.toolbar{position:sticky;top:0;padding:12px;text-align:center;background:#063255}.toolbar button{border:0;border-radius:9px;background:#f58a07;color:#fff;padding:11px 18px;font-weight:700;cursor:pointer}.page{width:210mm;min-height:297mm;margin:18px auto;background:#fff;padding:18mm 17mm;box-shadow:0 12px 35px #17324922}.head{display:flex;justify-content:space-between;gap:30px;padding-bottom:18px;border-bottom:4px solid #f58a07}.brand{font-size:23px;font-weight:800;color:#063255}.brand span{color:#f58a07}.muted{color:#627989;font-size:12px;line-height:1.6}.meta{text-align:right}.title{margin:28px 0 18px;font-size:24px;color:#063255}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;background:#edf7ff;border-radius:12px;padding:16px}.label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#718795}.value{font-size:13px;font-weight:700;margin-top:3px}.section{margin-top:24px}.section h2{font-size:14px;color:#063255;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#063255;color:#fff;padding:9px;text-align:left}td{border-bottom:1px solid #dce8ef;padding:10px 9px;vertical-align:top}td small{display:block;color:#728795;margin-top:4px}.num{text-align:right;white-space:nowrap}.summary{margin:18px 0 0 auto;width:310px}.summary div{display:flex;justify-content:space-between;padding:7px 0}.summary .patient{margin-top:5px;border-top:2px solid #063255;font-size:17px;font-weight:800;color:#063255}.notice{margin-top:28px;padding:14px;border-left:4px solid #f58a07;background:#fff8eb;font-size:11px;line-height:1.6}.footer{margin-top:35px;padding-top:13px;border-top:1px solid #ccdce6;font-size:9px;color:#637887;line-height:1.6}@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;width:auto;min-height:auto;padding:13mm 15mm}@page{size:A4;margin:0}}
  </style></head><body>${printControls ? '<div class="toolbar"><button onclick="window.print()">Drucken / als PDF speichern</button></div>' : ""}<main class="page"><header class="head"><div><div class="brand">KFO <span>Moosburg</span></div><div class="muted">Dr. Amann &amp; Dr. Burg<br>Kieferorthopädie</div></div><div class="meta"><strong>${escapeHtml(estimate.number)}</strong><div class="muted">Version ${estimate.version}<br>Gültig bis ${escapeHtml(germanDate(estimate.validUntil))}</div></div></header><h1 class="title">${escapeHtml(estimate.title)}</h1><section class="grid"><div><div class="label">Patient:in</div><div class="value">${escapeHtml(estimate.customerName)}</div></div><div><div class="label">Geburtsdatum</div><div class="value">${escapeHtml(germanDate(estimate.customerBirthDate))}</div></div><div><div class="label">Versicherung</div><div class="value">${escapeHtml([estimate.insuranceType, estimate.insurer].filter(Boolean).join(" · ") || "—")}</div></div><div><div class="label">KIG</div><div class="value">${escapeHtml(estimate.kigLevel || "—")}</div></div></section>${estimate.pointValueQuarter && estimate.insurerGroup ? `<section class="notice"><strong>Berechnungsgrundlage:</strong> BEMA-Punkte und KZVB-KFO-Punktwert für ${escapeHtml(estimate.pointValueQuarter)}, Kassenart ${escapeHtml(FUND_TYPE_LABELS[estimate.insurerGroup] || estimate.insurerGroup)}. Die Angabe ist keine Erstattungszusage der Krankenkasse.</section>` : ""}${estimate.diagnosis ? `<section class="section"><h2>Diagnose / Behandlungsziel</h2><div class="muted">${escapeHtml(estimate.diagnosis).replace(/\n/g, "<br>")}</div></section>` : ""}<section class="section"><h2>Leistungspositionen</h2><table><thead><tr><th>Pos.</th><th>Leistung</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Gesamt</th></tr></thead><tbody>${rows}</tbody></table></section><section class="summary"><div><span>Gesamtsumme</span><strong>${escapeHtml(euro(estimate.subtotalCents))}</strong></div>${estimate.insuranceShareCents ? `<div><span>Voraussichtliche Kassenbeteiligung</span><strong>− ${escapeHtml(euro(estimate.insuranceShareCents))}</strong></div>` : ""}<div class="patient"><span>Voraussichtlicher Eigenanteil</span><span>${escapeHtml(euro(estimate.patientShareCents))}</span></div></section>${estimate.patientNote ? `<section class="notice"><strong>Hinweis:</strong><br>${escapeHtml(estimate.patientNote).replace(/\n/g, "<br>")}</section>` : ""}<section class="notice">${escapeHtml(estimate.terms).replace(/\n/g, "<br>")}</section><footer class="footer">Kieferorthopädie Moosburg · Dr. Amann &amp; Dr. Burg · Münchener Straße 4a · 85368 Moosburg an der Isar · Tel. 08761 7222750 · praxis@kfo-moosburg.de</footer></main></body></html>`;
}

export async function printEstimateHtml(idValue: unknown): Promise<string> {
  const bundle = await readBundle();
  const estimate = bundle.estimates.find((item) => item.id === cleanText(idValue, 100));
  if (!estimate) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  return estimateDocumentHtml(estimate, true);
}

function estimateEmailHtml(): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#edf7ff;padding:24px"><div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;font-family:Arial,sans-serif;color:#173249"><div style="background:#063255;padding:22px 28px;color:#fff;font-size:18px;font-weight:700">KFO <span style="color:#f58a07">Moosburg</span></div><div style="padding:30px 28px;line-height:1.7;font-size:15px"><p>Guten Tag,</p><p>persönliche Unterlagen liegen für Sie in unserer Praxis bereit.</p><p>Aus Datenschutzgründen enthält diese E-Mail keine medizinischen, versicherungsbezogenen oder finanziellen Angaben. Bitte wenden Sie sich für die sichere Übergabe direkt an unser Praxisteam.</p><p>Viele Grüße<br>Ihre KFO Moosburg</p></div><div style="padding:18px 28px;border-top:1px solid #dceaf5;color:#627989;font-size:12px">Kieferorthopädie Moosburg · Münchener Straße 4a · 85368 Moosburg</div></div></body></html>`;
}

export async function sendEstimate(idValue: unknown) {
  const bundle = await readBundle();
  const estimateId = cleanText(idValue, 100);
  const initialEstimate = bundle.estimates.find((item) => item.id === estimateId);
  if (!initialEstimate) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  if (!["draft", "in_review"].includes(initialEstimate.status)) throw new EstimateError("Dieser Kostenvoranschlag wurde bereits versendet oder abgeschlossen. Erstellen Sie für Änderungen eine neue Version.", 409, "estimate_locked");
  const store = await loadStore();
  const settings = store.settings.find((item) => item.id === "smtp");
  if (!settings) throw new EstimateError("Bitte richten Sie zuerst den E-Mail-Versand in den Einstellungen ein.");
  const sql = database();
  const claimToken = randomUUID();
  const claimResults = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-estimate:${estimateId}`}, 0))`,
    sql`INSERT INTO kfo_estimate_deliveries (estimate_id, recipient, status, claim_token, error, created_at, updated_at)
      SELECT e.id, c.email, 'processing', ${claimToken}, '', NOW(), NOW()
      FROM kfo_estimates e JOIN kfo_customers c ON c.id = e.customer_id
      WHERE e.id = ${estimateId} AND e.status IN ('draft', 'in_review')
      ON CONFLICT (estimate_id) DO UPDATE SET recipient = EXCLUDED.recipient, status = 'processing',
        claim_token = EXCLUDED.claim_token, error = '', updated_at = NOW()
      WHERE kfo_estimate_deliveries.status = 'failed'
      RETURNING estimate_id, recipient`,
  ]);
  const claims = claimResults[1] as any[];
  if (!(claims as any[]).length) throw new EstimateError("Der Kostenvoranschlag wurde geändert, wird bereits versendet oder ist schon abgeschlossen. Bitte laden Sie ihn neu.", 409, "delivery_already_claimed");
  const recipient = cleanText(claims[0]?.recipient, 320);
  if (!isValidEmail(recipient)) {
    await sql`UPDATE kfo_estimate_deliveries SET status = 'failed', error = 'Keine gültige aktuelle Empfängeradresse', updated_at = NOW()
      WHERE estimate_id = ${estimateId} AND claim_token = ${claimToken}`;
    throw new EstimateError("Für diese Patientin oder diesen Patienten ist keine gültige aktuelle E-Mail-Adresse hinterlegt.");
  }
  const claimedBundle = await readBundle();
  const estimate = claimedBundle.estimates.find((item) => item.id === estimateId);
  if (!estimate || !["draft", "in_review"].includes(estimate.status)) {
    await sql`UPDATE kfo_estimate_deliveries SET status = 'failed', error = 'Kostenvoranschlag nach Versand-Claim nicht lesbar', updated_at = NOW()
      WHERE estimate_id = ${estimateId} AND claim_token = ${claimToken}`;
    throw new EstimateError("Der Kostenvoranschlag konnte für den Versand nicht sicher geladen werden.", 409, "delivery_snapshot_unavailable");
  }
  const transport = buildTransport(settings);
  try {
    await transport.verify();
    const mail = practiceMail({
      subject: "Persönliche Unterlagen – KFO Moosburg",
      body: "persönliche Unterlagen liegen für Sie in unserer Praxis bereit.\n\nAus Datenschutzgründen enthält diese E-Mail keine medizinischen, versicherungsbezogenen oder finanziellen Angaben. Bitte wenden Sie sich für die sichere Übergabe direkt an unser Praxisteam.",
      eyebrow: "Persönliche Unterlagen",
    });
    await transport.sendMail({
      from: { name: settings.fromName, address: settings.fromEmail },
      to: recipient,
      replyTo: settings.replyTo || settings.fromEmail,
      subject: "Persönliche Unterlagen – KFO Moosburg",
      text: mail.text,
      html: mail.html,
    });
  } catch (error) {
    const message = error instanceof Error ? cleanText(error.message, 500) : "Unbekannter Versandfehler";
    await sql`UPDATE kfo_estimate_deliveries SET status = 'failed', error = ${message}, updated_at = NOW()
      WHERE estimate_id = ${estimate.id} AND claim_token = ${claimToken}`;
    throw error;
  }
  let finalResults: any[][];
  try {
    finalResults = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-estimate:${estimate.id}`}, 0))`,
      sql`SELECT 1 / CASE WHEN EXISTS (
        SELECT 1 FROM kfo_estimate_deliveries d WHERE d.estimate_id = ${estimate.id}
          AND d.status = 'processing' AND d.claim_token = ${claimToken}
      ) AND EXISTS (
        SELECT 1 FROM kfo_estimates e WHERE e.id = ${estimate.id} AND e.status IN ('draft', 'in_review')
      ) THEN 1 ELSE 0 END AS delivery_guard`,
      sql`UPDATE kfo_estimate_deliveries SET status = 'sent', error = '', updated_at = NOW()
        WHERE estimate_id = ${estimate.id} AND status = 'processing' AND claim_token = ${claimToken}
        RETURNING estimate_id`,
      sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
        VALUES (${estimate.id}, 'pickup_notice_sent', ${estimate.status}, ${estimate.status}, 'Neutraler Abholhinweis per E-Mail versendet')`,
    ]) as any[][];
  } catch (error) {
    if (databaseErrorCode(error) === "22012") {
      throw new EstimateError("Die E-Mail wurde versendet, der Status konnte aber nicht sicher abgeschlossen werden. Bitte prüfen Sie den Vorgang vor einem erneuten Versand.", 500, "delivery_finalize_failed");
    }
    throw error;
  }
  if (!finalResults[2]?.length) {
    throw new EstimateError("Die E-Mail wurde versendet, der Status konnte aber nicht sicher abgeschlossen werden. Bitte prüfen Sie den Vorgang vor einem erneuten Versand.", 500, "delivery_finalize_failed");
  }
  return readBundle();
}

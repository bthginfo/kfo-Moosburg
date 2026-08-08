import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { buildTransport, loadStore } from "./kfoAdmin.js";

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
      sql`CREATE INDEX IF NOT EXISTS kfo_estimates_customer_idx ON kfo_estimates (customer_id, created_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimates_status_idx ON kfo_estimates (status, updated_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimate_items_estimate_idx ON kfo_estimate_items (estimate_id, position)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_estimate_events_estimate_idx ON kfo_estimate_events (estimate_id, created_at DESC)`,
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
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function numberValue(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function integer(value: unknown, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return Math.max(min, Math.min(max, Math.round(numberValue(value, fallback))));
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
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
    items,
  };
}

async function readBundle() {
  await ensureEstimateSchema();
  const sql = database();
  const [estimateRows, itemRows, catalogRows, eventRows] = await sql.transaction([
    sql`SELECT id, estimate_number AS number, COALESCE(customer_id, '') AS "customerId", customer_name AS "customerName",
      COALESCE(customer_birth_date::text, '') AS "customerBirthDate", customer_email AS "customerEmail",
      customer_address AS "customerAddress", title, diagnosis, insurance_type AS "insuranceType", insurer,
      kig_level AS "kigLevel", status, COALESCE(valid_until::text, '') AS "validUntil", version,
      COALESCE(revision_of_id, '') AS "revisionOfId", internal_notes AS "internalNotes",
      patient_note AS "patientNote", terms, subtotal_cents AS "subtotalCents",
      insurance_share_cents AS "insuranceShareCents", patient_share_cents AS "patientShareCents",
      sent_at AS "sentAt", accepted_at AS "acceptedAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_estimates ORDER BY updated_at DESC LIMIT 2000`,
    sql`SELECT id, estimate_id AS "estimateId", COALESCE(catalog_item_id, '') AS "catalogItemId", position,
      code, description, category, quantity, unit, unit_price_cents AS "unitPriceCents",
      discount_percent AS "discountPercent", total_cents AS "totalCents", note
      FROM kfo_estimate_items ORDER BY estimate_id, position`,
    sql`SELECT id, code, name, description, category, calculation_type AS "calculationType", points,
      point_value AS "pointValue", unit_price_cents AS "unitPriceCents", unit, active,
      external_reference AS "externalReference", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_estimate_catalog ORDER BY active DESC, category, code, name`,
    sql`SELECT id, estimate_id AS "estimateId", event_type AS "eventType", from_status AS "fromStatus",
      to_status AS "toStatus", detail, created_at AS "createdAt"
      FROM kfo_estimate_events ORDER BY created_at DESC LIMIT 500`,
  ], { readOnly: true });
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
  };
}

export async function loadEstimateBundle() {
  return readBundle();
}

function normalizeItems(input: any): EstimateLineItem[] {
  if (!Array.isArray(input) || !input.length) throw new EstimateError("Bitte fügen Sie mindestens eine Leistungsposition hinzu.");
  return input.map((row, index) => {
    const description = cleanText(row?.description, 500);
    if (!description) throw new EstimateError(`Bei Position ${index + 1} fehlt die Bezeichnung.`);
    const quantity = Math.max(0.01, Math.min(9999, numberValue(row?.quantity, 1)));
    const unitPriceCents = integer(row?.unitPriceCents, 0, 0, 100_000_000);
    const discountPercent = Math.max(0, Math.min(100, numberValue(row?.discountPercent, 0)));
    return {
      id: cleanText(row?.id, 100) || randomUUID(),
      catalogItemId: cleanText(row?.catalogItemId, 100),
      position: index + 1,
      code: cleanText(row?.code, 80),
      description,
      category: cleanText(row?.category, 100),
      quantity,
      unit: cleanText(row?.unit, 40) || "Stück",
      unitPriceCents,
      discountPercent,
      totalCents: Math.max(0, Math.round(quantity * unitPriceCents * (1 - discountPercent / 100))),
      note: cleanText(row?.note, 500),
    };
  });
}

const statuses: EstimateStatus[] = ["draft", "in_review", "sent", "accepted", "declined", "expired", "archived"];

export async function saveEstimate(input: any) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(input?.id, 100) || randomUUID();
  const existingRows = await sql`SELECT * FROM kfo_estimates WHERE id = ${id}`;
  const existing = (existingRows as any[])[0];
  if (input?.id && !existing) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  if (existing?.status === "accepted") throw new EstimateError("Angenommene Kostenvoranschläge sind gesperrt. Erstellen Sie stattdessen eine neue Version.", 409, "estimate_locked");

  const customerId = cleanText(input?.customerId, 100);
  if (!customerId) throw new EstimateError("Bitte wählen Sie eine Patientin oder einen Patienten aus.");
  const customerRows = await sql`SELECT id, first_name AS "firstName", last_name AS "lastName", birth_date::text AS "birthDate",
    email, street, postal_code AS "postalCode", city, insurance_type AS "insuranceType", insurer
    FROM kfo_customers WHERE id = ${customerId}`;
  const customer = (customerRows as any[])[0];
  if (!customer) throw new EstimateError("Die ausgewählte Patientin oder der ausgewählte Patient wurde nicht gefunden.", 404, "customer_not_found");

  const items = normalizeItems(input?.items);
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const insuranceShareCents = integer(input?.insuranceShareCents, 0, 0, subtotalCents);
  const patientShareCents = subtotalCents - insuranceShareCents;
  const status: EstimateStatus = existing && statuses.includes(input?.status) ? input.status : existing?.status || "draft";
  const defaultTerms = "Dieser Kostenvoranschlag ist unverbindlich und basiert auf dem derzeit bekannten Behandlungsumfang. Tatsächliche Kosten, Erstattungen und Eigenanteile können sich durch den Behandlungsverlauf oder die Entscheidung des Kostenträgers ändern.";
  let number = existing?.estimate_number || "";
  if (!number) {
    const rows = await sql`SELECT CONCAT('KV-', TO_CHAR(CURRENT_DATE, 'YYYY'), '-', LPAD(nextval('kfo_estimate_number_seq')::text, 5, '0')) AS number`;
    number = (rows as any[])[0].number;
  }
  const beforeStatus = existing?.status || "";
  const address = [customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const queries: any[] = [
    sql`INSERT INTO kfo_estimates
      (id, estimate_number, customer_id, customer_name, customer_birth_date, customer_email, customer_address,
        title, diagnosis, insurance_type, insurer, kig_level, status, valid_until, version, revision_of_id,
        internal_notes, patient_note, terms, subtotal_cents, insurance_share_cents, patient_share_cents,
        currency, sent_at, accepted_at, created_at, updated_at)
      VALUES (${id}, ${number}, ${customerId}, ${`${customer.firstName} ${customer.lastName}`.trim()}, ${customer.birthDate || null},
        ${customer.email || ""}, ${address}, ${cleanText(input?.title, 200) || "Kieferorthopädischer Kostenvoranschlag"},
        ${cleanText(input?.diagnosis, 4000)}, ${cleanText(input?.insuranceType, 80) || customer.insuranceType || ""},
        ${cleanText(input?.insurer, 160) || customer.insurer || ""}, ${cleanText(input?.kigLevel, 20)}, ${status},
        ${isoDate(input?.validUntil) || addDays(today(), 30)}, ${Number(existing?.version) || 1}, ${existing?.revision_of_id || null},
        ${cleanText(input?.internalNotes, 4000)}, ${cleanText(input?.patientNote, 4000)},
        ${cleanText(input?.terms, 5000) || defaultTerms}, ${subtotalCents}, ${insuranceShareCents}, ${patientShareCents},
        'EUR', ${existing?.sent_at || null}, ${existing?.accepted_at || null}, ${existing?.created_at || new Date()}, NOW())
      ON CONFLICT (id) DO UPDATE SET customer_id = EXCLUDED.customer_id, customer_name = EXCLUDED.customer_name,
        customer_birth_date = EXCLUDED.customer_birth_date, customer_email = EXCLUDED.customer_email,
        customer_address = EXCLUDED.customer_address, title = EXCLUDED.title, diagnosis = EXCLUDED.diagnosis,
        insurance_type = EXCLUDED.insurance_type, insurer = EXCLUDED.insurer, kig_level = EXCLUDED.kig_level,
        status = EXCLUDED.status, valid_until = EXCLUDED.valid_until, internal_notes = EXCLUDED.internal_notes,
        patient_note = EXCLUDED.patient_note, terms = EXCLUDED.terms, subtotal_cents = EXCLUDED.subtotal_cents,
        insurance_share_cents = EXCLUDED.insurance_share_cents, patient_share_cents = EXCLUDED.patient_share_cents,
        updated_at = NOW()`,
    sql`DELETE FROM kfo_estimate_items WHERE estimate_id = ${id}`,
  ];
  for (const item of items) {
    queries.push(sql`INSERT INTO kfo_estimate_items
      (id, estimate_id, catalog_item_id, position, code, description, category, quantity, unit,
        unit_price_cents, discount_percent, total_cents, note)
      VALUES (${item.id}, ${id}, ${item.catalogItemId || null}, ${item.position}, ${item.code}, ${item.description},
        ${item.category}, ${item.quantity}, ${item.unit}, ${item.unitPriceCents}, ${item.discountPercent}, ${item.totalCents}, ${item.note})`);
  }
  queries.push(sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
    VALUES (${id}, ${existing ? "updated" : "created"}, ${beforeStatus}, ${status}, ${existing ? "Kostenvoranschlag bearbeitet" : "Kostenvoranschlag angelegt"})`);
  await sql.transaction(queries);
  return readBundle();
}

export async function saveCatalogItem(input: any) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(input?.id, 100) || randomUUID();
  const name = cleanText(input?.name, 240);
  if (!name) throw new EstimateError("Bitte geben Sie eine Bezeichnung für die Katalogposition ein.");
  const code = cleanText(input?.code, 80);
  if (code) {
    const duplicates = await sql`SELECT id FROM kfo_estimate_catalog WHERE LOWER(code) = LOWER(${code}) AND id <> ${id} LIMIT 1`;
    if ((duplicates as any[]).length) throw new EstimateError("Diese Positionsnummer ist im Leistungskatalog bereits vergeben.", 409, "duplicate_catalog_code");
  }
  const calculationType = input?.calculationType === "points" ? "points" : "fixed";
  await sql`INSERT INTO kfo_estimate_catalog
    (id, code, name, description, category, calculation_type, points, point_value, unit_price_cents,
      unit, active, external_reference, created_at, updated_at)
    VALUES (${id}, ${code}, ${name}, ${cleanText(input?.description, 1500)},
      ${cleanText(input?.category, 100) || "Behandlung"}, ${calculationType}, ${Math.max(0, numberValue(input?.points))},
      ${Math.max(0, numberValue(input?.pointValue))}, ${integer(input?.unitPriceCents, 0, 0, 100_000_000)},
      ${cleanText(input?.unit, 40) || "Stück"}, ${input?.active !== false}, ${cleanText(input?.externalReference, 160)}, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name,
      description = EXCLUDED.description, category = EXCLUDED.category,
      calculation_type = EXCLUDED.calculation_type, points = EXCLUDED.points,
      point_value = EXCLUDED.point_value, unit_price_cents = EXCLUDED.unit_price_cents,
      unit = EXCLUDED.unit, active = EXCLUDED.active, external_reference = EXCLUDED.external_reference,
      updated_at = NOW()`;
  return readBundle();
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
  if (current.status === "accepted" && status !== "accepted") {
    throw new EstimateError("Angenommene Kostenvoranschläge sind gesperrt. Erstellen Sie für Änderungen eine neue Version.", 409, "estimate_locked");
  }
  await sql.transaction([
    sql`UPDATE kfo_estimates SET status = ${status},
      sent_at = CASE WHEN ${status} = 'sent' AND sent_at IS NULL THEN NOW() ELSE sent_at END,
      accepted_at = CASE WHEN ${status} = 'accepted' THEN NOW() ELSE accepted_at END,
      updated_at = NOW() WHERE id = ${id}`,
    sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
      VALUES (${id}, 'status_changed', ${current.status}, ${status}, 'Status geändert')`,
  ]);
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
  const result = await saveEstimate(copy);
  const created = result.estimates[0];
  const sql = database();
  const rootId = source.revisionOfId || source.id;
  await sql.transaction([
    sql`UPDATE kfo_estimates SET revision_of_id = ${rootId}, version = ${source.version + 1}, updated_at = NOW() WHERE id = ${created.id}`,
    sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
      VALUES (${created.id}, 'revision_created', '', 'draft', ${`Neue Version aus ${source.number}`})`,
  ]);
  return readBundle();
}

export async function archiveEstimateEntity(entity: EstimateEntity, idValue: unknown) {
  await ensureEstimateSchema();
  const sql = database();
  const id = cleanText(idValue, 100);
  if (!id) throw new EstimateError("Datensatz nicht gefunden.");
  if (entity === "estimate") {
    await sql.transaction([
      sql`UPDATE kfo_estimates SET status = 'archived', updated_at = NOW() WHERE id = ${id}`,
      sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, to_status, detail)
        VALUES (${id}, 'archived', 'archived', 'Kostenvoranschlag archiviert')`,
    ]);
  } else {
    await sql`UPDATE kfo_estimate_catalog SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
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
  const rows = estimate.items.map((item) => `<tr><td>${escapeHtml(item.code || String(item.position))}</td><td><strong>${escapeHtml(item.description)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</td><td class="num">${item.quantity.toLocaleString("de-DE")} ${escapeHtml(item.unit)}</td><td class="num">${escapeHtml(euro(item.unitPriceCents))}</td><td class="num">${escapeHtml(euro(item.totalCents))}</td></tr>`).join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(estimate.number)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eaf3f8;color:#173249;font-family:Arial,sans-serif}.toolbar{position:sticky;top:0;padding:12px;text-align:center;background:#063255}.toolbar button{border:0;border-radius:9px;background:#f58a07;color:#fff;padding:11px 18px;font-weight:700;cursor:pointer}.page{width:210mm;min-height:297mm;margin:18px auto;background:#fff;padding:18mm 17mm;box-shadow:0 12px 35px #17324922}.head{display:flex;justify-content:space-between;gap:30px;padding-bottom:18px;border-bottom:4px solid #f58a07}.brand{font-size:23px;font-weight:800;color:#063255}.brand span{color:#f58a07}.muted{color:#627989;font-size:12px;line-height:1.6}.meta{text-align:right}.title{margin:28px 0 18px;font-size:24px;color:#063255}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;background:#edf7ff;border-radius:12px;padding:16px}.label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#718795}.value{font-size:13px;font-weight:700;margin-top:3px}.section{margin-top:24px}.section h2{font-size:14px;color:#063255;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#063255;color:#fff;padding:9px;text-align:left}td{border-bottom:1px solid #dce8ef;padding:10px 9px;vertical-align:top}td small{display:block;color:#728795;margin-top:4px}.num{text-align:right;white-space:nowrap}.summary{margin:18px 0 0 auto;width:310px}.summary div{display:flex;justify-content:space-between;padding:7px 0}.summary .patient{margin-top:5px;border-top:2px solid #063255;font-size:17px;font-weight:800;color:#063255}.notice{margin-top:28px;padding:14px;border-left:4px solid #f58a07;background:#fff8eb;font-size:11px;line-height:1.6}.footer{margin-top:35px;padding-top:13px;border-top:1px solid #ccdce6;font-size:9px;color:#637887;line-height:1.6}@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;width:auto;min-height:auto;padding:13mm 15mm}@page{size:A4;margin:0}}
  </style></head><body>${printControls ? '<div class="toolbar"><button onclick="window.print()">Drucken / als PDF speichern</button></div>' : ""}<main class="page"><header class="head"><div><div class="brand">KFO <span>Moosburg</span></div><div class="muted">Dr. Amann &amp; Dr. Burg<br>Kieferorthopädie</div></div><div class="meta"><strong>${escapeHtml(estimate.number)}</strong><div class="muted">Version ${estimate.version}<br>Gültig bis ${escapeHtml(germanDate(estimate.validUntil))}</div></div></header><h1 class="title">${escapeHtml(estimate.title)}</h1><section class="grid"><div><div class="label">Patient:in</div><div class="value">${escapeHtml(estimate.customerName)}</div></div><div><div class="label">Geburtsdatum</div><div class="value">${escapeHtml(germanDate(estimate.customerBirthDate))}</div></div><div><div class="label">Versicherung</div><div class="value">${escapeHtml([estimate.insuranceType, estimate.insurer].filter(Boolean).join(" · ") || "—")}</div></div><div><div class="label">KIG</div><div class="value">${escapeHtml(estimate.kigLevel || "—")}</div></div></section>${estimate.diagnosis ? `<section class="section"><h2>Diagnose / Behandlungsziel</h2><div class="muted">${escapeHtml(estimate.diagnosis).replace(/\n/g, "<br>")}</div></section>` : ""}<section class="section"><h2>Leistungspositionen</h2><table><thead><tr><th>Pos.</th><th>Leistung</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Gesamt</th></tr></thead><tbody>${rows}</tbody></table></section><section class="summary"><div><span>Gesamtsumme</span><strong>${escapeHtml(euro(estimate.subtotalCents))}</strong></div>${estimate.insuranceShareCents ? `<div><span>Voraussichtliche Kassenbeteiligung</span><strong>− ${escapeHtml(euro(estimate.insuranceShareCents))}</strong></div>` : ""}<div class="patient"><span>Voraussichtlicher Eigenanteil</span><span>${escapeHtml(euro(estimate.patientShareCents))}</span></div></section>${estimate.patientNote ? `<section class="notice"><strong>Hinweis:</strong><br>${escapeHtml(estimate.patientNote).replace(/\n/g, "<br>")}</section>` : ""}<section class="notice">${escapeHtml(estimate.terms).replace(/\n/g, "<br>")}</section><footer class="footer">Kieferorthopädie Moosburg · Dr. Amann &amp; Dr. Burg · Münchener Straße 4a · 85368 Moosburg an der Isar · Tel. 08761 7222750 · praxis@kfo-moosburg.de</footer></main></body></html>`;
}

export async function printEstimateHtml(idValue: unknown): Promise<string> {
  const bundle = await readBundle();
  const estimate = bundle.estimates.find((item) => item.id === cleanText(idValue, 100));
  if (!estimate) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  return estimateDocumentHtml(estimate, true);
}

export async function sendEstimate(idValue: unknown) {
  const bundle = await readBundle();
  const estimate = bundle.estimates.find((item) => item.id === cleanText(idValue, 100));
  if (!estimate) throw new EstimateError("Der Kostenvoranschlag wurde nicht gefunden.", 404, "not_found");
  if (estimate.status === "archived") throw new EstimateError("Archivierte Kostenvoranschläge können nicht versendet werden.", 409, "estimate_archived");
  if (!estimate.customerEmail) throw new EstimateError("Für diese Patientin oder diesen Patienten ist keine E-Mail-Adresse hinterlegt.");
  const store = await loadStore();
  const settings = store.settings.find((item) => item.id === "smtp");
  if (!settings) throw new EstimateError("Bitte richten Sie zuerst den E-Mail-Versand in den Einstellungen ein.");
  const transport = buildTransport(settings);
  await transport.sendMail({
    from: { name: settings.fromName, address: settings.fromEmail },
    to: estimate.customerEmail,
    replyTo: settings.replyTo || settings.fromEmail,
    subject: `Ihr Kostenvoranschlag ${estimate.number} – KFO Moosburg`,
    text: `Guten Tag ${estimate.customerName},\n\nanbei erhalten Sie die Übersicht zu Ihrem Kostenvoranschlag ${estimate.number}. Der voraussichtliche Eigenanteil beträgt ${euro(estimate.patientShareCents)}.\n\n${estimate.terms}\n\nViele Grüße\nIhre KFO Moosburg`,
    html: estimateDocumentHtml(estimate, false),
  });
  if (estimate.status !== "accepted") await updateEstimateStatus(estimate.id, "sent");
  const sql = database();
  await sql`INSERT INTO kfo_estimate_events (estimate_id, event_type, from_status, to_status, detail)
    VALUES (${estimate.id}, 'email_sent', '', 'sent', ${`E-Mail an ${estimate.customerEmail} versendet`})`;
  return readBundle();
}

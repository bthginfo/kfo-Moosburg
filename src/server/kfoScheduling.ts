import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { loadStore, type Appointment, type Customer } from "./kfoAdmin.js";

export type ScheduleEntity = "appointment" | "appointmentType" | "resource" | "availabilityRule" | "exception" | "settings";

export class SchedulingError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "validation_error") {
    super(message);
    this.name = "SchedulingError";
    this.status = status;
    this.code = code;
  }
}

type AppointmentType = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  color: string;
  publicBookable: boolean;
  newPatientOnly: boolean;
  active: boolean;
  description: string;
  preparation: string;
  sortOrder: number;
};

type ScheduleResource = {
  id: string;
  name: string;
  kind: "practitioner" | "room" | "chair";
  color: string;
  active: boolean;
  sortOrder: number;
};

type AvailabilityRule = {
  id: string;
  appointmentTypeId: string;
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  stepMinutes: number;
  active: boolean;
};

type AvailabilityException = {
  id: string;
  kind: "closed" | "additional";
  date: string;
  startTime: string;
  endTime: string;
  appointmentTypeId: string;
  providerId: string;
  reason: string;
};

type BookingSettings = {
  id: "booking";
  publicEnabled: false;
  publicationLocked: true;
  timezone: string;
  bookingHorizonDays: number;
  minNoticeHours: number;
  cancellationNoticeHours: number;
  slotIntervalMinutes: number;
  introText: string;
  integrationSystem: "ivoris";
  integrationStatus: "awaiting_access" | "ready" | "error";
  lastSyncAt: string;
};

type ScheduleAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  type: string;
  appointmentTypeId: string;
  providerId: string;
  providerName: string;
  roomId: string;
  roomName: string;
  durationMinutes: number;
  note: string;
  status: "scheduled" | "confirmed" | "arrived" | "completed" | "cancelled" | "no_show";
  source: "admin" | "import" | "online" | "ivoris";
  externalId: string;
  syncStatus: "local" | "pending" | "synced" | "error";
  lastSyncedAt: string;
  seriesId: string;
  seriesIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type PreviewSlot = {
  id: string;
  date: string;
  time: string;
  endTime: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  providerId: string;
  providerName: string;
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

async function ensureSchedulingSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    // Create the core customer/appointment tables before extending them with scheduling metadata.
    await loadStore();
    const sql = database();
    await sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS kfo_appointment_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'other',
        duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 240),
        buffer_before_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_before_minutes BETWEEN 0 AND 120),
        buffer_after_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_after_minutes BETWEEN 0 AND 120),
        color TEXT NOT NULL DEFAULT '#2f7d76',
        public_bookable BOOLEAN NOT NULL DEFAULT FALSE,
        new_patient_only BOOLEAN NOT NULL DEFAULT FALSE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT NOT NULL DEFAULT '',
        preparation TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_schedule_resources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        resource_kind TEXT NOT NULL DEFAULT 'practitioner' CHECK (resource_kind IN ('practitioner', 'room', 'chair')),
        color TEXT NOT NULL DEFAULT '#32698c',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_availability_rules (
        id TEXT PRIMARY KEY,
        appointment_type_id TEXT NOT NULL REFERENCES kfo_appointment_types(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL REFERENCES kfo_schedule_resources(id) ON DELETE CASCADE,
        weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        valid_from DATE,
        valid_until DATE,
        step_minutes INTEGER NOT NULL DEFAULT 15 CHECK (step_minutes BETWEEN 5 AND 120),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_availability_exceptions (
        id TEXT PRIMARY KEY,
        exception_kind TEXT NOT NULL CHECK (exception_kind IN ('closed', 'additional')),
        exception_date DATE NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        appointment_type_id TEXT REFERENCES kfo_appointment_types(id) ON DELETE CASCADE,
        provider_id TEXT REFERENCES kfo_schedule_resources(id) ON DELETE CASCADE,
        reason TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_booking_settings (
        id TEXT PRIMARY KEY CHECK (id = 'booking'),
        public_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
        booking_horizon_days INTEGER NOT NULL DEFAULT 120 CHECK (booking_horizon_days BETWEEN 7 AND 365),
        min_notice_hours INTEGER NOT NULL DEFAULT 48 CHECK (min_notice_hours BETWEEN 0 AND 720),
        cancellation_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (cancellation_notice_hours BETWEEN 0 AND 336),
        slot_interval_minutes INTEGER NOT NULL DEFAULT 15 CHECK (slot_interval_minutes BETWEEN 5 AND 60),
        intro_text TEXT NOT NULL DEFAULT '',
        integration_system TEXT NOT NULL DEFAULT 'ivoris',
        integration_status TEXT NOT NULL DEFAULT 'awaiting_access',
        last_sync_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS appointment_type_id TEXT`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS provider_id TEXT`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS room_id TEXT`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin'`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS external_id TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'local'`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS series_id TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_appointments ADD COLUMN IF NOT EXISTS series_index INTEGER NOT NULL DEFAULT 0`,
      sql`DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'kfo_appointments_status_check'
            AND pg_get_constraintdef(oid) LIKE '%no_show%'
        ) THEN
          ALTER TABLE kfo_appointments DROP CONSTRAINT IF EXISTS kfo_appointments_status_check;
          ALTER TABLE kfo_appointments ADD CONSTRAINT kfo_appointments_status_check
            CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'));
        END IF;
      END $$`,
      sql`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kfo_appointments_type_fk') THEN
          ALTER TABLE kfo_appointments ADD CONSTRAINT kfo_appointments_type_fk FOREIGN KEY (appointment_type_id) REFERENCES kfo_appointment_types(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kfo_appointments_provider_fk') THEN
          ALTER TABLE kfo_appointments ADD CONSTRAINT kfo_appointments_provider_fk FOREIGN KEY (provider_id) REFERENCES kfo_schedule_resources(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kfo_appointments_room_fk') THEN
          ALTER TABLE kfo_appointments ADD CONSTRAINT kfo_appointments_room_fk FOREIGN KEY (room_id) REFERENCES kfo_schedule_resources(id) ON DELETE SET NULL;
        END IF;
      END $$`,
      sql`CREATE INDEX IF NOT EXISTS kfo_appointments_provider_idx ON kfo_appointments (appointment_date, provider_id, appointment_time)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_appointments_series_idx ON kfo_appointments (series_id, series_index) WHERE series_id <> ''`,
      sql`CREATE INDEX IF NOT EXISTS kfo_availability_rules_lookup_idx ON kfo_availability_rules (weekday, active)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_availability_exceptions_date_idx ON kfo_availability_exceptions (exception_date)`,
      sql`INSERT INTO kfo_booking_settings (id, public_enabled, intro_text)
        VALUES ('booking', FALSE, 'Buchen Sie hier Ihr persönliches Erstgespräch in unserer Praxis.')
        ON CONFLICT (id) DO NOTHING`,
      sql`INSERT INTO kfo_schedule_resources (id, name, resource_kind, color, sort_order) VALUES
        ('resource-praxis-team', 'Praxisteam', 'practitioner', '#32698c', 10),
        ('resource-chair-1', 'Behandlungsplatz 1', 'chair', '#6d5aa7', 20)
        ON CONFLICT (id) DO NOTHING`,
      sql`INSERT INTO kfo_appointment_types
        (id, name, short_name, category, duration_minutes, buffer_before_minutes, buffer_after_minutes, color, public_bookable, new_patient_only, description, preparation, sort_order)
        VALUES
        ('type-first-consult', 'Erstgespräch Neupatient:in', 'Erstgespräch', 'consultation', 30, 0, 5, '#2f7d76', TRUE, TRUE, 'Unverbindliches kieferorthopädisches Erstgespräch und erste Einschätzung.', 'Bitte Versichertenkarte und – falls vorhanden – aktuelle Unterlagen mitbringen.', 10),
        ('type-diagnostics', 'Diagnostik & Unterlagen', 'Diagnostik', 'diagnostics', 45, 5, 5, '#32698c', FALSE, FALSE, 'Fotos, Scan, Röntgen und Behandlungsunterlagen.', '', 20),
        ('type-fixed-control', 'Kontrolle feste Spange', 'Feste Spange', 'control', 15, 0, 0, '#7a5aa6', FALSE, FALSE, 'Regelmäßige Kontrolle und Anpassung der festsitzenden Apparatur.', '', 30),
        ('type-aligner-control', 'Aligner-/lose-Spange-Kontrolle', 'Aligner / lose', 'control', 15, 0, 0, '#3f7faf', FALSE, FALSE, 'Fortschrittskontrolle bei Alignern oder herausnehmbarer Apparatur.', '', 40),
        ('type-appliance', 'Apparatur einsetzen / entfernen', 'Apparatur', 'treatment', 45, 5, 5, '#d07a23', FALSE, FALSE, 'Längerer Behandlungstermin zum Einsetzen oder Entfernen einer Apparatur.', '', 50),
        ('type-retainer', 'Retainer-Kontrolle', 'Retainer', 'retention', 20, 0, 0, '#3f8062', FALSE, FALSE, 'Kontrolle in der Retentionsphase.', '', 60),
        ('type-sos', 'SOS – Bracket / Draht / Schmerzen', 'SOS', 'emergency', 20, 0, 5, '#b65755', FALSE, FALSE, 'Kurzfristiger Akuttermin für Reparaturen und Beschwerden.', '', 70)
        ON CONFLICT (id) DO NOTHING`,
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function cleanText(value: unknown, max = 1000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoDate(value: unknown): string {
  const text = cleanText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const parsed = new Date(`${text}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text ? text : "";
}

function timeValue(value: unknown): string {
  const text = cleanText(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  const color = cleanText(value, 7);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function timestamp(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function concurrencyTimestamp(value: unknown): string {
  const text = cleanText(value, 64);
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function weekday(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function localNow(timezone: string): { date: string; instantMs: number } {
  const instant = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, instantMs: instant.getTime() };
}

function zonedDateTimeEpoch(date: string, time: string, timezone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let candidate = targetAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    const correction = targetAsUtc - representedAsUtc;
    if (correction === 0) return candidate;
    candidate += correction;
  }
  return Number.NaN;
}

function mapType(row: any): AppointmentType {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName || "",
    category: row.category,
    durationMinutes: Number(row.durationMinutes),
    bufferBeforeMinutes: Number(row.bufferBeforeMinutes),
    bufferAfterMinutes: Number(row.bufferAfterMinutes),
    color: row.color,
    publicBookable: Boolean(row.publicBookable),
    newPatientOnly: Boolean(row.newPatientOnly),
    active: Boolean(row.active),
    description: row.description || "",
    preparation: row.preparation || "",
    sortOrder: Number(row.sortOrder),
  };
}

function mapResource(row: any): ScheduleResource {
  return { id: row.id, name: row.name, kind: row.kind, color: row.color, active: Boolean(row.active), sortOrder: Number(row.sortOrder) };
}

function mapRule(row: any): AvailabilityRule {
  return {
    id: row.id,
    appointmentTypeId: row.appointmentTypeId,
    providerId: row.providerId,
    weekday: Number(row.weekday),
    startTime: row.startTime,
    endTime: row.endTime,
    validFrom: row.validFrom || "",
    validUntil: row.validUntil || "",
    stepMinutes: Number(row.stepMinutes),
    active: Boolean(row.active),
  };
}

function mapException(row: any): AvailabilityException {
  return {
    id: row.id,
    kind: row.kind,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    appointmentTypeId: row.appointmentTypeId || "",
    providerId: row.providerId || "",
    reason: row.reason || "",
  };
}

function mapAppointment(row: any): ScheduleAppointment {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail || "",
    date: row.date,
    time: row.time,
    type: row.type || "Termin",
    appointmentTypeId: row.appointmentTypeId || "",
    providerId: row.providerId || "",
    providerName: row.providerName || "",
    roomId: row.roomId || "",
    roomName: row.roomName || "",
    durationMinutes: Number(row.durationMinutes) || 30,
    note: row.note || "",
    status: row.status,
    source: row.source || "admin",
    externalId: row.externalId || "",
    syncStatus: row.syncStatus || "local",
    lastSyncedAt: timestamp(row.lastSyncedAt),
    seriesId: row.seriesId || "",
    seriesIndex: Number(row.seriesIndex) || 0,
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
  };
}

async function rawBundle() {
  await ensureSchedulingSchema();
  const sql = database();
  const [appointmentRows, typeRows, resourceRows, ruleRows, exceptionRows, settingRows] = await sql.transaction([
    sql`SELECT a.id, a.customer_id AS "customerId", CONCAT(c.first_name, ' ', c.last_name) AS "customerName",
      c.email AS "customerEmail", a.appointment_date::text AS date, a.appointment_time AS time,
      COALESCE(t.name, a.appointment_type) AS type, COALESCE(a.appointment_type_id, '') AS "appointmentTypeId",
      COALESCE(a.provider_id, '') AS "providerId", COALESCE(p.name, '') AS "providerName",
      COALESCE(a.room_id, '') AS "roomId", COALESCE(r.name, '') AS "roomName",
      a.duration_minutes AS "durationMinutes", a.notes AS note, a.status, a.source,
      a.external_id AS "externalId", a.sync_status AS "syncStatus", a.last_synced_at AS "lastSyncedAt",
      a.series_id AS "seriesId", a.series_index AS "seriesIndex",
      a.created_at AS "createdAt", a.updated_at AS "updatedAt"
      FROM kfo_appointments a
      JOIN kfo_customers c ON c.id = a.customer_id
      LEFT JOIN kfo_appointment_types t ON t.id = a.appointment_type_id
      LEFT JOIN kfo_schedule_resources p ON p.id = a.provider_id
      LEFT JOIN kfo_schedule_resources r ON r.id = a.room_id
      ORDER BY CASE WHEN a.appointment_date >= CURRENT_DATE THEN 0 ELSE 1 END,
        CASE WHEN a.appointment_date >= CURRENT_DATE THEN a.appointment_date END ASC,
        CASE WHEN a.appointment_date < CURRENT_DATE THEN a.appointment_date END DESC,
        a.appointment_time LIMIT 5000`,
    sql`SELECT id, name, short_name AS "shortName", category, duration_minutes AS "durationMinutes",
      buffer_before_minutes AS "bufferBeforeMinutes", buffer_after_minutes AS "bufferAfterMinutes", color,
      public_bookable AS "publicBookable", new_patient_only AS "newPatientOnly", active, description,
      preparation, sort_order AS "sortOrder" FROM kfo_appointment_types ORDER BY sort_order, name`,
    sql`SELECT id, name, resource_kind AS kind, color, active, sort_order AS "sortOrder"
      FROM kfo_schedule_resources ORDER BY sort_order, name`,
    sql`SELECT id, appointment_type_id AS "appointmentTypeId", provider_id AS "providerId", weekday,
      start_time AS "startTime", end_time AS "endTime", COALESCE(valid_from::text, '') AS "validFrom",
      COALESCE(valid_until::text, '') AS "validUntil", step_minutes AS "stepMinutes", active
      FROM kfo_availability_rules ORDER BY weekday, start_time`,
    sql`SELECT id, exception_kind AS kind, exception_date::text AS date, start_time AS "startTime",
      end_time AS "endTime", COALESCE(appointment_type_id, '') AS "appointmentTypeId",
      COALESCE(provider_id, '') AS "providerId", reason FROM kfo_availability_exceptions
      ORDER BY exception_date, start_time`,
    sql`SELECT id, public_enabled AS "publicEnabled", timezone, booking_horizon_days AS "bookingHorizonDays",
      min_notice_hours AS "minNoticeHours", cancellation_notice_hours AS "cancellationNoticeHours",
      slot_interval_minutes AS "slotIntervalMinutes", intro_text AS "introText",
      integration_system AS "integrationSystem", integration_status AS "integrationStatus", last_sync_at AS "lastSyncAt"
      FROM kfo_booking_settings WHERE id = 'booking'`,
  ], { readOnly: true, isolationLevel: "RepeatableRead" });

  const setting = (settingRows as any[])[0] || {};
  const settings: BookingSettings = {
    id: "booking",
    publicEnabled: false,
    publicationLocked: true,
    timezone: setting.timezone || "Europe/Berlin",
    bookingHorizonDays: Number(setting.bookingHorizonDays ?? 120),
    minNoticeHours: Number(setting.minNoticeHours ?? 48),
    cancellationNoticeHours: Number(setting.cancellationNoticeHours ?? 24),
    slotIntervalMinutes: Number(setting.slotIntervalMinutes ?? 15),
    introText: setting.introText || "",
    integrationSystem: "ivoris",
    integrationStatus: setting.integrationStatus || "awaiting_access",
    lastSyncAt: timestamp(setting.lastSyncAt),
  };
  return {
    appointments: (appointmentRows as any[]).map(mapAppointment),
    appointmentTypes: (typeRows as any[]).map(mapType),
    resources: (resourceRows as any[]).map(mapResource),
    availabilityRules: (ruleRows as any[]).map(mapRule),
    exceptions: (exceptionRows as any[]).map(mapException),
    settings,
  };
}

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

function generatePreview(bundle: Awaited<ReturnType<typeof rawBundle>>): PreviewSlot[] {
  const { settings, appointmentTypes, resources, availabilityRules, exceptions, appointments } = bundle;
  const types = new Map(appointmentTypes.map((item) => [item.id, item]));
  const resourceNames = new Map(resources.filter((item) => item.active && item.kind === "practitioner").map((item) => [item.id, item.name]));
  const now = localNow(settings.timezone);
  const maxDays = settings.bookingHorizonDays;
  const candidates: PreviewSlot[] = [];

  const addWindow = (date: string, typeId: string, providerId: string, startTime: string, endTime: string, step: number) => {
    const type = types.get(typeId);
    if (!type?.active || !type.publicBookable || !resourceNames.has(providerId)) return;
    const windowStart = toMinutes(startTime);
    const windowEnd = toMinutes(endTime);
    for (let start = windowStart; start + type.durationMinutes <= windowEnd; start += step) {
      const end = start + type.durationMinutes;
      const startsAt = zonedDateTimeEpoch(date, fromMinutes(start), settings.timezone);
      if (!Number.isFinite(startsAt) || startsAt - now.instantMs < settings.minNoticeHours * 60 * 60 * 1000) continue;
      const blocked = exceptions.some((item) => item.kind === "closed" && item.date === date
        && (!item.providerId || item.providerId === providerId)
        && (!item.appointmentTypeId || item.appointmentTypeId === typeId)
        && overlaps(start - type.bufferBeforeMinutes, end + type.bufferAfterMinutes, toMinutes(item.startTime), toMinutes(item.endTime)));
      if (blocked) continue;
      const occupied = appointments.some((item) => {
        if (item.date !== date || item.providerId !== providerId || !["scheduled", "confirmed", "arrived"].includes(item.status)) return false;
        const existingType = types.get(item.appointmentTypeId);
        const existingStart = toMinutes(item.time);
        return overlaps(
          start - type.bufferBeforeMinutes,
          end + type.bufferAfterMinutes,
          existingStart - (existingType?.bufferBeforeMinutes || 0),
          existingStart + item.durationMinutes + (existingType?.bufferAfterMinutes || 0),
        );
      });
      if (occupied) continue;
      candidates.push({
        id: `${date}-${fromMinutes(start)}-${typeId}-${providerId}`,
        date,
        time: fromMinutes(start),
        endTime: fromMinutes(end),
        appointmentTypeId: typeId,
        appointmentTypeName: type.name,
        providerId,
        providerName: resourceNames.get(providerId) || "Praxisteam",
      });
    }
  };

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const date = addDays(now.date, offset);
    for (const rule of availabilityRules) {
      if (!rule.active || rule.weekday !== weekday(date)) continue;
      if (rule.validFrom && date < rule.validFrom) continue;
      if (rule.validUntil && date > rule.validUntil) continue;
      addWindow(date, rule.appointmentTypeId, rule.providerId, rule.startTime, rule.endTime, rule.stepMinutes);
    }
    for (const item of exceptions) {
      if (item.kind !== "additional" || item.date !== date || !item.appointmentTypeId || !item.providerId) continue;
      addWindow(date, item.appointmentTypeId, item.providerId, item.startTime, item.endTime, settings.slotIntervalMinutes);
    }
  }
  return [...new Map(candidates.map((item) => [item.id, item])).values()]
    .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`))
    .slice(0, 500);
}

export async function loadSchedulingBundle() {
  const bundle = await rawBundle();
  return { ...bundle, previewSlots: generatePreview(bundle) };
}

export async function importCustomersWithScheduleAppointments(customers: Customer[], appointments: Appointment[]) {
  await ensureSchedulingSchema();
  if (customers.length > 1000 || appointments.length > 20_000) {
    throw new SchedulingError("Der Import ist zu groß. Bitte teilen Sie ihn in kleinere Dateien auf.", 413, "import_too_large");
  }

  const sql = database();
  const uniqueCustomers = [...new Map(customers.map((customer) => [customer.id, customer])).values()];
  const customerIds = new Set(uniqueCustomers.map((customer) => customer.id));
  const normalizedAppointments = appointments.map((appointment) => {
    const id = cleanText(appointment.id, 100);
    const customerId = cleanText(appointment.customerId, 100);
    const date = isoDate(appointment.date);
    const time = timeValue(appointment.time);
    if (!id || !customerId || !customerIds.has(customerId) || !date || !time) {
      throw new SchedulingError("Mindestens ein Importtermin ist unvollständig oder ungültig.", 400, "invalid_import_appointment");
    }
    const status = ["scheduled", "confirmed", "arrived", "completed", "cancelled", "no_show"].includes(appointment.status)
      ? appointment.status
      : "scheduled";
    return {
      id,
      customerId,
      date,
      time,
      type: cleanText(appointment.type, 160),
      notes: cleanText(appointment.notes, 1000),
      status,
    };
  });

  const lockQueries = [...new Set(normalizedAppointments.map((appointment) => appointment.date))]
    .sort()
    .map((date) => sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-appointments:${date}`}, 0))`);
  const customerQueries = uniqueCustomers.map((customer) => sql`INSERT INTO kfo_customers (
      id, salutation, first_name, last_name, birth_date, email, phone, mobile, street, postal_code, city,
      insurance_type, insurer, patient_number, status, notes, email_consent, created_at, updated_at
    ) VALUES (${customer.id}, ${customer.salutation}, ${customer.firstName}, ${customer.lastName}, ${customer.birthDate || null},
      ${customer.email}, ${customer.phone}, ${customer.mobile}, ${customer.street}, ${customer.postalCode}, ${customer.city},
      ${customer.insuranceType}, ${customer.insurer}, ${customer.patientNumber}, ${customer.status}, ${customer.notes},
      ${customer.emailConsent}, ${customer.createdAt}, ${customer.updatedAt})
    ON CONFLICT (id) DO UPDATE SET salutation = EXCLUDED.salutation, first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name, birth_date = EXCLUDED.birth_date, email = EXCLUDED.email,
      phone = EXCLUDED.phone, mobile = EXCLUDED.mobile, street = EXCLUDED.street,
      postal_code = EXCLUDED.postal_code, city = EXCLUDED.city, insurance_type = EXCLUDED.insurance_type,
      insurer = EXCLUDED.insurer, patient_number = EXCLUDED.patient_number, status = EXCLUDED.status,
      notes = EXCLUDED.notes, email_consent = EXCLUDED.email_consent, updated_at = EXCLUDED.updated_at`);
  const appointmentQueries = normalizedAppointments.map((appointment) => {
    const start = toMinutes(appointment.time);
    const end = start + 30;
    const blocksSchedule = ["scheduled", "confirmed", "arrived"].includes(appointment.status);
    return sql`INSERT INTO kfo_appointments (
        id, customer_id, appointment_date, appointment_time, appointment_type, notes, status,
        duration_minutes, source, sync_status, created_at, updated_at
      ) SELECT ${appointment.id}, ${appointment.customerId}, ${appointment.date}, ${appointment.time},
        ${appointment.type}, ${appointment.notes}, ${appointment.status}, 30, 'import', 'local', NOW(), NOW()
      WHERE ${!blocksSchedule} OR NOT EXISTS (
        SELECT 1 FROM kfo_appointments existing
        LEFT JOIN kfo_appointment_types existing_type ON existing_type.id = existing.appointment_type_id
        WHERE existing.customer_id = ${appointment.customerId}
          AND existing.appointment_date = ${appointment.date}
          AND existing.status IN ('scheduled', 'confirmed', 'arrived')
          AND existing.appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND ${start} < (
            split_part(existing.appointment_time, ':', 1)::int * 60
            + split_part(existing.appointment_time, ':', 2)::int
            + existing.duration_minutes + COALESCE(existing_type.buffer_after_minutes, 0)
          )
          AND ${end} > (
            split_part(existing.appointment_time, ':', 1)::int * 60
            + split_part(existing.appointment_time, ':', 2)::int
            - COALESCE(existing_type.buffer_before_minutes, 0)
          )
      ) RETURNING id`;
  });

  if (!customerQueries.length && !appointmentQueries.length) return { insertedAppointmentIds: [], skippedAppointmentIds: [] };
  const results = await sql.transaction([...lockQueries, ...customerQueries, ...appointmentQueries]);
  const appointmentResults = results.slice(lockQueries.length + customerQueries.length) as any[][];
  const insertedAppointmentIds = appointmentResults.flatMap((rows) => rows.map((row) => String(row.id)));
  const inserted = new Set(insertedAppointmentIds);
  return {
    insertedAppointmentIds,
    skippedAppointmentIds: normalizedAppointments.filter((appointment) => !inserted.has(appointment.id)).map((appointment) => appointment.id),
  };
}

export async function saveScheduleEntity(entity: ScheduleEntity, input: any) {
  await ensureSchedulingSchema();
  const sql = database();
  const id = cleanText(input?.id, 100) || randomUUID();

  if (entity === "appointment") {
    const customerId = cleanText(input?.customerId, 100);
    const date = isoDate(input?.date);
    const time = timeValue(input?.time);
    const appointmentTypeId = cleanText(input?.appointmentTypeId, 100);
    if (!customerId || !date || !time || !appointmentTypeId) throw new SchedulingError("Patient:in, Datum, Uhrzeit und Terminart sind erforderlich.");
    const expectedUpdatedAt = input?.id ? concurrencyTimestamp(input?.updatedAt) : "";
    if (input?.id && !expectedUpdatedAt) {
      throw new SchedulingError("Der Bearbeitungsstand des Termins fehlt. Bitte laden Sie den Terminplan neu.", 409, "stale_version");
    }
    const providerId = cleanText(input?.providerId, 100);
    const roomId = cleanText(input?.roomId, 100);
    const [customerRows, typeRows, oldRows, resourceRows] = await Promise.all([
      sql`SELECT id FROM kfo_customers WHERE id = ${customerId}`,
      sql`SELECT id, name, duration_minutes AS "durationMinutes", buffer_before_minutes AS "bufferBeforeMinutes",
        buffer_after_minutes AS "bufferAfterMinutes" FROM kfo_appointment_types
        WHERE id = ${appointmentTypeId} AND (active = TRUE OR EXISTS (
          SELECT 1 FROM kfo_appointments WHERE id = ${id} AND appointment_type_id = ${appointmentTypeId}
        ))`,
      sql`SELECT source, external_id AS "externalId", sync_status AS "syncStatus", last_synced_at AS "lastSyncedAt",
        series_id AS "seriesId", series_index AS "seriesIndex", COALESCE(provider_id, '') AS "providerId",
        COALESCE(room_id, '') AS "roomId", appointment_date::text AS date,
        updated_at AS "updatedAt" FROM kfo_appointments WHERE id = ${id}`,
      sql`SELECT id, resource_kind AS kind, active FROM kfo_schedule_resources
        WHERE id = ${providerId || "__none__"} OR id = ${roomId || "__none__"}`,
    ]);
    if (!(customerRows as any[]).length) throw new SchedulingError("Die ausgewählte Patientin oder der ausgewählte Patient wurde nicht gefunden.", 404, "customer_not_found");
    const type = (typeRows as any[])[0];
    if (!type) throw new SchedulingError("Die ausgewählte Terminart ist nicht mehr aktiv.");
    const old = (oldRows as any[])[0] || {};
    if (input?.id && !(oldRows as any[]).length) throw new SchedulingError("Der Termin wurde nicht gefunden.", 404, "not_found");
    const resourceById = new Map((resourceRows as any[]).map((item) => [item.id, item]));
    const provider = resourceById.get(providerId);
    const retainedProvider = Boolean(input?.id && providerId && old.providerId === providerId && provider?.kind === "practitioner");
    if (providerId && (provider?.kind !== "practitioner" || (!provider.active && !retainedProvider))) {
      throw new SchedulingError("Der ausgewählte Behandler ist nicht mehr verfügbar.", 400, "invalid_provider");
    }
    const room = resourceById.get(roomId);
    const retainedRoom = Boolean(input?.id && roomId && old.roomId === roomId && ["room", "chair"].includes(room?.kind));
    if (roomId && (!room || !["room", "chair"].includes(room.kind) || (!room.active && !retainedRoom))) {
      throw new SchedulingError("Der ausgewählte Raum oder Behandlungsplatz ist nicht mehr verfügbar.", 400, "invalid_room");
    }
    const durationMinutes = boundedInt(input?.durationMinutes, Number(type.durationMinutes) || 30, 5, 240);
    const statuses = ["scheduled", "confirmed", "arrived", "completed", "cancelled", "no_show"];
    const status = statuses.includes(input?.status) ? input.status : "scheduled";
    const source = ["admin", "import", "online", "ivoris"].includes(old.source) ? old.source : "admin";
    const syncStatus = source === "ivoris" ? (old.syncStatus || "synced") : "local";
    const repeatCount = input?.id ? 1 : boundedInt(input?.repeatCount, 1, 1, 30);
    const repeatIntervalWeeks = boundedInt(input?.repeatIntervalWeeks, 6, 1, 26);
    const seriesId = old.seriesId || (repeatCount > 1 ? randomUUID() : "");
    const note = cleanText(input?.note ?? input?.notes, 2000);
    const items = Array.from({ length: repeatCount }, (_, index) => ({
      id: index === 0 ? id : randomUUID(),
      date: addDays(date, index * repeatIntervalWeeks * 7),
      seriesIndex: input?.id ? Number(old.seriesIndex) || 0 : index,
    }));
    const startMinutes = toMinutes(time);
    const bufferedStart = startMinutes - Number(type.bufferBeforeMinutes || 0);
    const bufferedEnd = startMinutes + durationMinutes + Number(type.bufferAfterMinutes || 0);
    const identityLockQueries = input?.id
      ? [sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-appointment:${id}`}, 0))`]
      : [];
    const dateLockQueries = [...new Set([...items.map((item) => item.date), ...(old.date ? [old.date] : [])])].sort()
      .map((itemDate) => sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-appointments:${itemDate}`}, 0))`);
    const lockQueries = [...identityLockQueries, ...dateLockQueries];
    const conflictQueries = items.map((item) => sql`SELECT 1 / CASE WHEN ${["scheduled", "confirmed", "arrived"].includes(status)}
      AND (${!input?.id} OR EXISTS (
        SELECT 1 FROM kfo_appointments current
        WHERE current.id = ${item.id}
          AND date_trunc('milliseconds', current.updated_at) = ${expectedUpdatedAt || null}::timestamptz
      )) AND EXISTS (
      SELECT 1 FROM kfo_appointments a
      LEFT JOIN kfo_appointment_types existing_type ON existing_type.id = a.appointment_type_id
      WHERE a.appointment_date = ${item.date} AND a.id <> ${item.id}
        AND a.status IN ('scheduled', 'confirmed', 'arrived')
        AND a.appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND (a.customer_id = ${customerId}
          OR (${providerId} <> '' AND COALESCE(a.provider_id, '') = ${providerId})
          OR (${roomId} <> '' AND COALESCE(a.room_id, '') = ${roomId}))
        AND ${bufferedStart} < (
          (split_part(a.appointment_time, ':', 1)::int * 60 + split_part(a.appointment_time, ':', 2)::int)
          + a.duration_minutes + COALESCE(existing_type.buffer_after_minutes, 0)
        )
        AND ${bufferedEnd} > (
          (split_part(a.appointment_time, ':', 1)::int * 60 + split_part(a.appointment_time, ':', 2)::int)
          - COALESCE(existing_type.buffer_before_minutes, 0)
        )
      ) THEN 0 ELSE 1 END AS conflict_guard`);
    const writeQueries = items.map((item, index) => input?.id
      ? sql`UPDATE kfo_appointments SET customer_id = ${customerId}, appointment_date = ${item.date},
          appointment_time = ${time}, appointment_type = ${type.name}, notes = ${note}, status = ${status},
          appointment_type_id = ${appointmentTypeId}, provider_id = ${providerId || null}, room_id = ${roomId || null},
          duration_minutes = ${durationMinutes}, series_id = ${seriesId}, series_index = ${item.seriesIndex},
          sync_status = CASE WHEN source = 'ivoris' THEN 'pending' ELSE 'local' END,
          updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
        WHERE id = ${item.id} AND date_trunc('milliseconds', updated_at) = ${expectedUpdatedAt}::timestamptz
        RETURNING id`
      : sql`INSERT INTO kfo_appointments
        (id, customer_id, appointment_date, appointment_time, appointment_type, notes, status,
          appointment_type_id, provider_id, room_id, duration_minutes, source, external_id, sync_status,
          last_synced_at, series_id, series_index, created_at, updated_at)
        VALUES (${item.id}, ${customerId}, ${item.date}, ${time}, ${type.name}, ${note}, ${status},
          ${appointmentTypeId}, ${providerId || null}, ${roomId || null}, ${durationMinutes}, ${index === 0 ? source : "admin"},
          ${index === 0 ? old.externalId || "" : ""}, ${index === 0 ? syncStatus : "local"},
          ${index === 0 ? old.lastSyncedAt || null : null}, ${seriesId}, ${item.seriesIndex}, NOW(), date_trunc('milliseconds', clock_timestamp()))
        RETURNING id`);
    let transactionResults: any[][];
    try {
      transactionResults = await sql.transaction([...lockQueries, ...conflictQueries, ...writeQueries]) as any[][];
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && String((error as { code?: unknown }).code) === "22012") {
        throw new SchedulingError("Dieser Zeitraum ist für die Patientin bzw. den Patienten, Behandler oder Raum bereits belegt.", 409, "appointment_conflict");
      }
      throw error;
    }
    const writeResults = transactionResults.slice(lockQueries.length + conflictQueries.length);
    if (input?.id && !writeResults[0]?.length) {
      throw new SchedulingError("Der Termin wurde zwischenzeitlich geändert. Bitte laden Sie den Terminplan neu.", 409, "stale_version");
    }
  } else if (entity === "appointmentType") {
    const name = cleanText(input?.name, 160);
    if (!name) throw new SchedulingError("Bitte geben Sie einen Namen für die Terminart ein.");
    const categories = ["consultation", "diagnostics", "treatment", "control", "retention", "emergency", "other"];
    const category = categories.includes(input?.category) ? input.category : "other";
    await sql`INSERT INTO kfo_appointment_types
      (id, name, short_name, category, duration_minutes, buffer_before_minutes, buffer_after_minutes, color,
        public_bookable, new_patient_only, active, description, preparation, sort_order, created_at, updated_at)
      VALUES (${id}, ${name}, ${cleanText(input?.shortName, 60)}, ${category}, ${boundedInt(input?.durationMinutes, 30, 5, 240)},
        ${boundedInt(input?.bufferBeforeMinutes, 0, 0, 120)}, ${boundedInt(input?.bufferAfterMinutes, 0, 0, 120)},
        ${colorValue(input?.color, "#2f7d76")}, ${input?.publicBookable === true}, ${input?.newPatientOnly === true},
        ${input?.active !== false}, ${cleanText(input?.description, 1500)}, ${cleanText(input?.preparation, 1500)},
        ${boundedInt(input?.sortOrder, 100, 0, 999)}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name,
        category = EXCLUDED.category, duration_minutes = EXCLUDED.duration_minutes,
        buffer_before_minutes = EXCLUDED.buffer_before_minutes, buffer_after_minutes = EXCLUDED.buffer_after_minutes,
        color = EXCLUDED.color, public_bookable = EXCLUDED.public_bookable,
        new_patient_only = EXCLUDED.new_patient_only, active = EXCLUDED.active,
        description = EXCLUDED.description, preparation = EXCLUDED.preparation,
        sort_order = EXCLUDED.sort_order, updated_at = NOW()`;
  } else if (entity === "resource") {
    const name = cleanText(input?.name, 160);
    if (!name) throw new SchedulingError("Bitte geben Sie einen Namen für Behandler oder Raum ein.");
    const kind = ["practitioner", "room", "chair"].includes(input?.kind) ? input.kind : "practitioner";
    await sql`INSERT INTO kfo_schedule_resources (id, name, resource_kind, color, active, sort_order, created_at, updated_at)
      VALUES (${id}, ${name}, ${kind}, ${colorValue(input?.color, "#32698c")}, ${input?.active !== false},
        ${boundedInt(input?.sortOrder, 100, 0, 999)}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, resource_kind = EXCLUDED.resource_kind,
        color = EXCLUDED.color, active = EXCLUDED.active, sort_order = EXCLUDED.sort_order, updated_at = NOW()`;
  } else if (entity === "availabilityRule") {
    const typeId = cleanText(input?.appointmentTypeId, 100);
    const providerId = cleanText(input?.providerId, 100);
    const startTime = timeValue(input?.startTime);
    const endTime = timeValue(input?.endTime);
    if (!typeId || !providerId || !startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) {
      throw new SchedulingError("Terminart, Behandler und ein gültiges Zeitfenster sind erforderlich.");
    }
    const [eligibleTypes, eligibleProviders] = await Promise.all([
      sql`SELECT id FROM kfo_appointment_types WHERE id = ${typeId} AND active = TRUE AND public_bookable = TRUE`,
      sql`SELECT id FROM kfo_schedule_resources WHERE id = ${providerId} AND active = TRUE AND resource_kind = 'practitioner'`,
    ]);
    if (!(eligibleTypes as any[]).length) throw new SchedulingError("Die Terminart muss aktiv und für die Online-Buchung vorgesehen sein.");
    if (!(eligibleProviders as any[]).length) throw new SchedulingError("Das gewählte Team ist nicht mehr aktiv.");
    const weekdayValue = boundedInt(input?.weekday, 1, 1, 7);
    const validFrom = isoDate(input?.validFrom);
    const validUntil = isoDate(input?.validUntil);
    if ((input?.validFrom && !validFrom) || (input?.validUntil && !validUntil)) throw new SchedulingError("Bitte prüfen Sie den Gültigkeitszeitraum.");
    if (validFrom && validUntil && validFrom > validUntil) throw new SchedulingError("Das Enddatum muss nach dem Startdatum liegen.");
    await sql`INSERT INTO kfo_availability_rules
      (id, appointment_type_id, provider_id, weekday, start_time, end_time, valid_from, valid_until, step_minutes, active, created_at, updated_at)
      VALUES (${id}, ${typeId}, ${providerId}, ${weekdayValue}, ${startTime}, ${endTime},
        ${validFrom || null}, ${validUntil || null},
        ${boundedInt(input?.stepMinutes, 15, 5, 120)}, ${input?.active !== false}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET appointment_type_id = EXCLUDED.appointment_type_id,
        provider_id = EXCLUDED.provider_id, weekday = EXCLUDED.weekday, start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time, valid_from = EXCLUDED.valid_from, valid_until = EXCLUDED.valid_until,
        step_minutes = EXCLUDED.step_minutes, active = EXCLUDED.active, updated_at = NOW()`;
  } else if (entity === "exception") {
    const kind = input?.kind === "additional" ? "additional" : "closed";
    const date = isoDate(input?.date);
    const startTime = timeValue(input?.startTime);
    const endTime = timeValue(input?.endTime);
    const appointmentTypeId = cleanText(input?.appointmentTypeId, 100);
    const providerId = cleanText(input?.providerId, 100);
    if (!date || !startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) throw new SchedulingError("Datum und ein gültiges Zeitfenster sind erforderlich.");
    if (kind === "additional" && (!appointmentTypeId || !providerId)) throw new SchedulingError("Zusätzliche Öffnungen brauchen eine Terminart und einen Behandler.");
    if (kind === "additional") {
      const [eligibleTypes, eligibleProviders] = await Promise.all([
        sql`SELECT id FROM kfo_appointment_types WHERE id = ${appointmentTypeId} AND active = TRUE AND public_bookable = TRUE`,
        sql`SELECT id FROM kfo_schedule_resources WHERE id = ${providerId} AND active = TRUE AND resource_kind = 'practitioner'`,
      ]);
      if (!(eligibleTypes as any[]).length) throw new SchedulingError("Die Terminart muss aktiv und für die Online-Buchung vorgesehen sein.");
      if (!(eligibleProviders as any[]).length) throw new SchedulingError("Das gewählte Team ist nicht mehr aktiv.");
    }
    await sql`INSERT INTO kfo_availability_exceptions
      (id, exception_kind, exception_date, start_time, end_time, appointment_type_id, provider_id, reason, created_at, updated_at)
      VALUES (${id}, ${kind}, ${date}, ${startTime}, ${endTime}, ${appointmentTypeId || null}, ${providerId || null},
        ${cleanText(input?.reason, 500)}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET exception_kind = EXCLUDED.exception_kind,
        exception_date = EXCLUDED.exception_date, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
        appointment_type_id = EXCLUDED.appointment_type_id, provider_id = EXCLUDED.provider_id,
        reason = EXCLUDED.reason, updated_at = NOW()`;
  } else if (entity === "settings") {
    await sql`UPDATE kfo_booking_settings SET public_enabled = FALSE,
      timezone = 'Europe/Berlin', booking_horizon_days = ${boundedInt(input?.bookingHorizonDays, 120, 7, 365)},
      min_notice_hours = ${boundedInt(input?.minNoticeHours, 48, 0, 720)},
      cancellation_notice_hours = ${boundedInt(input?.cancellationNoticeHours, 24, 0, 336)},
      slot_interval_minutes = ${boundedInt(input?.slotIntervalMinutes, 15, 5, 60)},
      intro_text = ${cleanText(input?.introText, 1500)}, integration_system = 'ivoris', updated_at = NOW()
      WHERE id = 'booking'`;
  }

  return loadSchedulingBundle();
}

export async function deleteScheduleEntity(entity: ScheduleEntity, idValue: unknown, updatedAtValue?: unknown) {
  await ensureSchedulingSchema();
  const sql = database();
  const id = cleanText(idValue, 100);
  if (!id) throw new SchedulingError("Der Datensatz konnte nicht identifiziert werden.");
  let rows: any[] = [];
  if (entity === "appointment") {
    const expectedUpdatedAt = concurrencyTimestamp(updatedAtValue);
    if (!expectedUpdatedAt) {
      throw new SchedulingError("Der Bearbeitungsstand des Termins fehlt. Bitte laden Sie den Terminplan neu.", 409, "stale_version");
    }
    const currentRows = await sql`SELECT appointment_date::text AS date FROM kfo_appointments WHERE id = ${id}` as any[];
    if (!currentRows.length) throw new SchedulingError("Der Datensatz wurde nicht gefunden.", 404, "not_found");
    const results = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-appointment:${id}`}, 0))`,
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-appointments:${currentRows[0].date}`}, 0))`,
      sql`UPDATE kfo_appointments SET status = 'cancelled',
        sync_status = CASE WHEN source = 'ivoris' THEN 'pending' ELSE sync_status END,
        updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
        WHERE id = ${id} AND date_trunc('milliseconds', updated_at) = ${expectedUpdatedAt}::timestamptz
        RETURNING id`,
    ]);
    rows = results[2] as any[];
    if (!rows.length) {
      throw new SchedulingError("Der Termin wurde zwischenzeitlich geändert. Bitte laden Sie den Terminplan neu.", 409, "stale_version");
    }
  }
  else if (entity === "availabilityRule") rows = await sql`DELETE FROM kfo_availability_rules WHERE id = ${id} RETURNING id` as any[];
  else if (entity === "exception") rows = await sql`DELETE FROM kfo_availability_exceptions WHERE id = ${id} RETURNING id` as any[];
  else if (entity === "appointmentType") {
    const results = await sql.transaction([
      sql`UPDATE kfo_appointment_types SET active = FALSE, public_bookable = FALSE, updated_at = NOW() WHERE id = ${id} RETURNING id`,
      sql`UPDATE kfo_availability_rules SET active = FALSE, updated_at = NOW() WHERE appointment_type_id = ${id}`,
    ]);
    rows = results[0] as any[];
  } else if (entity === "resource") {
    const results = await sql.transaction([
      sql`UPDATE kfo_schedule_resources SET active = FALSE, updated_at = NOW() WHERE id = ${id} RETURNING id`,
      sql`UPDATE kfo_availability_rules SET active = FALSE, updated_at = NOW() WHERE provider_id = ${id}`,
    ]);
    rows = results[0] as any[];
  } else throw new SchedulingError("Diese Einstellung kann nicht gelöscht werden.");
  if (!rows.length) throw new SchedulingError("Der Datensatz wurde nicht gefunden.", 404, "not_found");
  return loadSchedulingBundle();
}

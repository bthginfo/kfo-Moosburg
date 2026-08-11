import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "./vercelTypes.js";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";
import { practiceMail } from "./kfoMail.js";

const SESSION_COOKIE = "kfo_admin_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

export type CustomerStatus = "active" | "paused" | "completed" | "archived";

export interface Appointment {
  id: string;
  customerId: string;
  date: string;
  time: string;
  type: string;
  notes: string;
  status: "scheduled" | "confirmed" | "arrived" | "completed" | "cancelled" | "no_show";
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  mobile: string;
  street: string;
  postalCode: string;
  city: string;
  insuranceType: string;
  insurer: string;
  patientNumber: string;
  status: CustomerStatus;
  notes: string;
  emailConsent: boolean;
  invoiceEmailConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRule {
  id: string;
  name: string;
  subject: string;
  body: string;
  offsetDays: number;
  audience: "all" | "selected";
  customerIds: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmtpSettings {
  id: "smtp";
  host: string;
  port: number;
  security: "ssl" | "starttls";
  username: string;
  encryptedPassword: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  timezone: string;
  updatedAt: string;
}

export interface DeliveryLog {
  id: string;
  reminderId: string;
  appointmentId: string;
  customerId: string;
  recipient: string;
  scheduledDate: string;
  status: "processing" | "sent" | "failed" | "uncertain";
  sentAt: string;
  error: string;
  updatedAt: string;
}

type Collection = "customers" | "appointments" | "reminders" | "settings" | "deliveries";
type RecordValue = Customer | Appointment | ReminderRule | SmtpSettings | DeliveryLog;

interface StoreSnapshot {
  customers: Customer[];
  appointments: Appointment[];
  reminders: ReminderRule[];
  settings: SmtpSettings[];
  deliveries: DeliveryLog[];
}

interface StoreEvent {
  collection: Collection;
  id: string;
  operation: "upsert" | "delete";
  data: RecordValue | null;
  updatedAt: string;
}

class StaleVersionError extends Error {
  code = "stale_version";

  constructor(message: string) {
    super(message);
    this.name = "StaleVersionError";
  }
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function sessionSecret(): string {
  return env("ADMIN_SESSION_SECRET");
}

function safeEqual(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  const raw = Array.isArray(cookieHeader) ? cookieHeader[0] || "" : cookieHeader || "";
  return raw.split(";").reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        // Ignore malformed cookie values instead of turning them into a 500 response.
      }
    }
    return cookies;
  }, {});
}

function signSession(expiresAt: number): string {
  if (!sessionSecret()) throw new Error("ADMIN_SESSION_SECRET fehlt.");
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp: expiresAt })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token || !sessionSecret()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.role === "admin" && Number(decoded.exp) > Date.now();
  } catch {
    return false;
  }
}

export function isAdmin(req: VercelRequest): boolean {
  return verifySessionToken(parseCookies(req)[SESSION_COOKIE]);
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: "unauthorized", message: "Bitte melden Sie sich erneut an." });
  return false;
}

export function createAdminSession(res: VercelResponse): void {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(signSession(expiresAt))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}; Priority=High${secure}`,
  );
}

export function clearAdminSession(res: VercelResponse): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export function verifyAdminPassword(password: unknown): boolean {
  const configured = env("ADMIN_PASSWORD");
  return Boolean(configured && typeof password === "string" && safeEqual(configured, password));
}

export function setPrivateResponse(res: VercelResponse): void {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
}

export function ensureWriteOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method || "")) return true;
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const forwardedHost = Array.isArray(req.headers["x-forwarded-host"])
    ? req.headers["x-forwarded-host"][0]
    : req.headers["x-forwarded-host"];
  const host = String(forwardedHost || req.headers.host || "").split(",")[0].trim();
  const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  const reject = () => {
    res.status(403).json({ error: "invalid_origin", message: "Die Anfrage wurde aus Sicherheitsgründen abgelehnt." });
    return false;
  };
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return reject();
  if (!origin || !host) return process.env.NODE_ENV === "production" ? reject() : true;
  try {
    const parsed = new URL(origin);
    if (parsed.host === host && (process.env.NODE_ENV !== "production" || parsed.protocol === "https:")) return true;
  } catch {
    // handled below
  }
  return reject();
}

function databaseUrl(): string {
  return env("DATABASE_URL") || env("moosburg_DATABASE_URL");
}

export function database() {
  const connectionString = databaseUrl();
  if (!connectionString) throw new Error("DATABASE_URL oder moosburg_DATABASE_URL fehlt.");
  return neon(connectionString);
}

export function hasStoreConfiguration(): boolean {
  return Boolean(databaseUrl());
}

export function missingAdminConfiguration(): string[] {
  const missing: string[] = [];
  if (env("ADMIN_PASSWORD").length < 20) missing.push("ADMIN_PASSWORD (mindestens 20 Zeichen)");
  if (sessionSecret().length < 32) missing.push("ADMIN_SESSION_SECRET (mindestens 32 Zeichen)");
  if (env("ADMIN_ENCRYPTION_KEY").length < 32) missing.push("ADMIN_ENCRYPTION_KEY (mindestens 32 Zeichen)");
  if (!databaseUrl()) missing.push("DATABASE_URL oder moosburg_DATABASE_URL");
  return missing;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = database();
    await sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS kfo_customers (
        id TEXT PRIMARY KEY,
        salutation TEXT NOT NULL DEFAULT '',
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date DATE,
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        mobile TEXT NOT NULL DEFAULT '',
        street TEXT NOT NULL DEFAULT '',
        postal_code TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        insurance_type TEXT NOT NULL DEFAULT '',
        insurer TEXT NOT NULL DEFAULT '',
        patient_number TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
        notes TEXT NOT NULL DEFAULT '',
        email_consent BOOLEAN NOT NULL DEFAULT FALSE,
        invoice_email_consent BOOLEAN NOT NULL DEFAULT FALSE,
        invoice_email_consent_at TIMESTAMPTZ,
        invoice_email_consent_source TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_appointments (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES kfo_customers(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL DEFAULT '',
        appointment_type TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_reminder_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        offset_days INTEGER NOT NULL DEFAULT 0 CHECK (offset_days BETWEEN -365 AND 365),
        audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'selected')),
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_reminder_targets (
        reminder_id TEXT NOT NULL REFERENCES kfo_reminder_rules(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES kfo_customers(id) ON DELETE CASCADE,
        PRIMARY KEY (reminder_id, customer_id)
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_smtp_settings (
        id TEXT PRIMARY KEY CHECK (id = 'smtp'),
        host TEXT NOT NULL DEFAULT '',
        port INTEGER NOT NULL DEFAULT 587 CHECK (port BETWEEN 1 AND 65535),
        security TEXT NOT NULL DEFAULT 'starttls' CHECK (security IN ('ssl', 'starttls')),
        username TEXT NOT NULL DEFAULT '',
        encrypted_password TEXT NOT NULL DEFAULT '',
        from_name TEXT NOT NULL DEFAULT '',
        from_email TEXT NOT NULL DEFAULT '',
        reply_to TEXT NOT NULL DEFAULT '',
        timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_reminder_deliveries (
        id TEXT PRIMARY KEY,
        reminder_id TEXT REFERENCES kfo_reminder_rules(id) ON DELETE SET NULL,
        appointment_id TEXT REFERENCES kfo_appointments(id) ON DELETE SET NULL,
        customer_id TEXT REFERENCES kfo_customers(id) ON DELETE SET NULL,
        recipient TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('processing', 'sent', 'failed', 'uncertain')),
        sent_at TIMESTAMPTZ,
        error TEXT NOT NULL DEFAULT '',
        claim_token TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS kfo_admin_login_attempts (
        key_hash TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        reset_at TIMESTAMPTZ NOT NULL
      )`,
      sql`ALTER TABLE kfo_reminder_deliveries ADD COLUMN IF NOT EXISTS claim_token TEXT NOT NULL DEFAULT ''`,
      sql`ALTER TABLE kfo_customers ADD COLUMN IF NOT EXISTS invoice_email_consent BOOLEAN NOT NULL DEFAULT FALSE`,
      sql`ALTER TABLE kfo_customers ADD COLUMN IF NOT EXISTS invoice_email_consent_at TIMESTAMPTZ`,
      sql`ALTER TABLE kfo_customers ADD COLUMN IF NOT EXISTS invoice_email_consent_source TEXT NOT NULL DEFAULT ''`,
      sql`DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'kfo_reminder_deliveries'::regclass
            AND conname = 'kfo_reminder_deliveries_status_check'
            AND POSITION('uncertain' IN pg_get_constraintdef(oid)) = 0
        ) THEN
          ALTER TABLE kfo_reminder_deliveries DROP CONSTRAINT kfo_reminder_deliveries_status_check;
          ALTER TABLE kfo_reminder_deliveries ADD CONSTRAINT kfo_reminder_deliveries_status_check
            CHECK (status IN ('processing', 'sent', 'failed', 'uncertain'));
        ELSIF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'kfo_reminder_deliveries'::regclass
            AND conname = 'kfo_reminder_deliveries_status_check'
        ) THEN
          ALTER TABLE kfo_reminder_deliveries ADD CONSTRAINT kfo_reminder_deliveries_status_check
            CHECK (status IN ('processing', 'sent', 'failed', 'uncertain'));
        END IF;
      END $$`,
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
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'kfo_smtp_settings_security_check'
            AND pg_get_constraintdef(oid) LIKE '%none%'
        ) THEN
          UPDATE kfo_smtp_settings SET security = 'starttls' WHERE security = 'none';
          ALTER TABLE kfo_smtp_settings DROP CONSTRAINT kfo_smtp_settings_security_check;
          ALTER TABLE kfo_smtp_settings ADD CONSTRAINT kfo_smtp_settings_security_check
            CHECK (security IN ('ssl', 'starttls'));
        END IF;
      END $$`,
      sql`CREATE INDEX IF NOT EXISTS kfo_customers_name_idx ON kfo_customers (last_name, first_name)`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS kfo_customers_patient_number_idx ON kfo_customers (patient_number) WHERE patient_number <> ''`,
      sql`CREATE INDEX IF NOT EXISTS kfo_appointments_date_idx ON kfo_appointments (appointment_date, status)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_reminder_deliveries_date_idx ON kfo_reminder_deliveries (scheduled_date, status)`,
      sql`CREATE INDEX IF NOT EXISTS kfo_admin_login_attempts_reset_idx ON kfo_admin_login_attempts (reset_at)`,
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function emptySnapshot(): StoreSnapshot {
  return { customers: [], appointments: [], reminders: [], settings: [], deliveries: [] };
}

export async function loadStore(): Promise<StoreSnapshot> {
  await ensureSchema();
  const sql = database();
  const [customerRows, appointmentRows, reminderRows, settingsRows, deliveryRows] = await sql.transaction([
    sql`SELECT id, salutation, first_name AS "firstName", last_name AS "lastName",
      birth_date::text AS "birthDate", email, phone, mobile, street, postal_code AS "postalCode", city,
      insurance_type AS "insuranceType", insurer, patient_number AS "patientNumber", status, notes,
      email_consent AS "emailConsent", invoice_email_consent AS "invoiceEmailConsent",
      created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_customers`,
    sql`SELECT id, customer_id AS "customerId", appointment_date::text AS date,
      appointment_time AS time, appointment_type AS type, notes, status,
      created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_appointments`,
    sql`SELECT r.id, r.name, r.subject, r.body, r.offset_days AS "offsetDays", r.audience, r.enabled,
      r.created_at AS "createdAt", r.updated_at AS "updatedAt",
      COALESCE(array_agg(t.customer_id) FILTER (WHERE t.customer_id IS NOT NULL), ARRAY[]::text[]) AS "customerIds"
      FROM kfo_reminder_rules r
      LEFT JOIN kfo_reminder_targets t ON t.reminder_id = r.id
      GROUP BY r.id`,
    sql`SELECT id, host, port, security, username, encrypted_password AS "encryptedPassword",
      from_name AS "fromName", from_email AS "fromEmail", reply_to AS "replyTo", timezone,
      updated_at AS "updatedAt"
      FROM kfo_smtp_settings`,
    sql`SELECT id, COALESCE(reminder_id, '') AS "reminderId", COALESCE(appointment_id, '') AS "appointmentId",
      COALESCE(customer_id, '') AS "customerId", recipient, scheduled_date::text AS "scheduledDate",
      status, sent_at AS "sentAt", error, updated_at AS "updatedAt"
      FROM kfo_reminder_deliveries`,
  ], { readOnly: true, isolationLevel: "RepeatableRead" });
  const snapshot = emptySnapshot();
  snapshot.customers = (customerRows as any[]).map((row) => ({ ...row, birthDate: row.birthDate || "", createdAt: timestamp(row.createdAt), updatedAt: timestamp(row.updatedAt) } as Customer));
  snapshot.appointments = (appointmentRows as any[]).map((row) => ({ ...row, createdAt: timestamp(row.createdAt), updatedAt: timestamp(row.updatedAt) } as Appointment));
  snapshot.reminders = (reminderRows as any[]).map((row) => ({ ...row, offsetDays: Number(row.offsetDays), customerIds: row.customerIds || [], createdAt: timestamp(row.createdAt), updatedAt: timestamp(row.updatedAt) } as ReminderRule));
  snapshot.settings = (settingsRows as any[]).map((row) => ({ ...row, port: Number(row.port), updatedAt: timestamp(row.updatedAt) } as SmtpSettings));
  snapshot.deliveries = (deliveryRows as any[]).map((row) => ({ ...row, sentAt: row.sentAt ? timestamp(row.sentAt) : "", updatedAt: timestamp(row.updatedAt) } as DeliveryLog));
  return snapshot;
}

function loginAttemptKey(req: VercelRequest): string {
  const forwarded = Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : req.headers["x-forwarded-for"];
  const ip = String(forwarded || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  return createHash("sha256").update(`kfo-admin-login:${ip}`).digest("hex");
}

export async function consumeLoginAttempt(req: VercelRequest): Promise<{ limited: boolean; retryAfter: number }> {
  await ensureSchema();
  const sql = database();
  const key = loginAttemptKey(req);
  await sql`DELETE FROM kfo_admin_login_attempts WHERE reset_at <= NOW()`;
  const rows = await sql`INSERT INTO kfo_admin_login_attempts (key_hash, attempts, reset_at)
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE WHEN kfo_admin_login_attempts.reset_at <= NOW() THEN 1 ELSE kfo_admin_login_attempts.attempts + 1 END,
      reset_at = CASE WHEN kfo_admin_login_attempts.reset_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE kfo_admin_login_attempts.reset_at END
    RETURNING attempts, reset_at AS "resetAt"`;
  const row = (rows as any[])[0];
  if (!row || Number(row.attempts) <= 10) return { limited: false, retryAfter: 0 };
  const retryAfter = Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000));
  return { limited: true, retryAfter };
}

export async function clearLoginFailures(req: VercelRequest): Promise<void> {
  await ensureSchema();
  const sql = database();
  const key = loginAttemptKey(req);
  await sql`DELETE FROM kfo_admin_login_attempts WHERE key_hash = ${key}`;
}

export async function claimReminderDelivery(item: DeliveryLog): Promise<string | null> {
  await ensureSchema();
  const sql = database();
  const claimToken = randomUUID();
  const rows = await sql`INSERT INTO kfo_reminder_deliveries (
      id, reminder_id, appointment_id, customer_id, recipient, scheduled_date, status, sent_at, error, claim_token, updated_at
    ) SELECT ${item.id}, r.id, a.id, c.id, ${item.recipient}, ${item.scheduledDate}, 'processing', NULL, '', ${claimToken}, NOW()
      FROM kfo_reminder_rules r
      JOIN kfo_appointments a ON a.id = ${item.appointmentId}
      JOIN kfo_customers c ON c.id = ${item.customerId} AND c.id = a.customer_id
      WHERE r.id = ${item.reminderId}
    ON CONFLICT (id) DO UPDATE SET
      reminder_id = EXCLUDED.reminder_id, appointment_id = EXCLUDED.appointment_id,
      customer_id = EXCLUDED.customer_id, recipient = EXCLUDED.recipient,
      scheduled_date = EXCLUDED.scheduled_date, status = 'processing', sent_at = NULL,
      error = '', claim_token = EXCLUDED.claim_token, updated_at = NOW()
    WHERE kfo_reminder_deliveries.status = 'failed'
    RETURNING id`;
  return (rows as any[]).length ? claimToken : null;
}

export async function quarantineStaleReminderDeliveries(staleAfterMinutes = 30): Promise<number> {
  await ensureSchema();
  const sql = database();
  const minutes = Math.max(5, Math.min(24 * 60, Math.trunc(staleAfterMinutes) || 30));
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
  const rows = await sql`UPDATE kfo_reminder_deliveries SET
      status = 'uncertain', claim_token = '',
      error = 'Versandstatus unklar: Ein früherer Lauf wurde nicht sicher abgeschlossen. Kein automatischer Wiederholungsversand; bitte manuell prüfen.',
      updated_at = NOW()
    WHERE status = 'processing' AND updated_at < ${cutoff}
    RETURNING id`;
  return (rows as any[]).length;
}

export interface RevalidatedReminderDelivery {
  deliveryId: string;
  claimToken: string;
  rule: ReminderRule;
  appointment: Appointment;
  customer: Customer;
}

export async function revalidateClaimedReminderDelivery(
  id: string,
  claimToken: string,
  today: string,
  graceDays: number,
): Promise<RevalidatedReminderDelivery | null> {
  await ensureSchema();
  const sql = database();
  const grace = Math.max(0, Math.min(30, Math.trunc(graceDays) || 0));
  const rows = await sql`WITH eligible AS (
      SELECT
        d.id AS "deliveryId", d.claim_token AS "claimToken",
        r.id AS "ruleId", r.name AS "ruleName", r.subject AS "ruleSubject", r.body AS "ruleBody",
        r.offset_days AS "ruleOffsetDays", r.audience AS "ruleAudience", r.enabled AS "ruleEnabled",
        r.created_at AS "ruleCreatedAt", r.updated_at AS "ruleUpdatedAt",
        ARRAY(SELECT t.customer_id FROM kfo_reminder_targets t WHERE t.reminder_id = r.id ORDER BY t.customer_id) AS "ruleCustomerIds",
        a.id AS "appointmentId", a.customer_id AS "appointmentCustomerId",
        a.appointment_date::text AS "appointmentDate", a.appointment_time AS "appointmentTime",
        a.appointment_type AS "appointmentType", a.notes AS "appointmentNotes", a.status AS "appointmentStatus",
        a.created_at AS "appointmentCreatedAt", a.updated_at AS "appointmentUpdatedAt",
        c.id AS "customerId", c.salutation AS "customerSalutation", c.first_name AS "customerFirstName",
        c.last_name AS "customerLastName", c.birth_date::text AS "customerBirthDate",
        LOWER(BTRIM(c.email)) AS "customerEmail", c.phone AS "customerPhone", c.mobile AS "customerMobile",
        c.street AS "customerStreet", c.postal_code AS "customerPostalCode", c.city AS "customerCity",
        c.insurance_type AS "customerInsuranceType", c.insurer AS "customerInsurer",
        c.patient_number AS "customerPatientNumber", c.status AS "customerStatus", c.notes AS "customerNotes",
        c.email_consent AS "customerEmailConsent", c.invoice_email_consent AS "customerInvoiceEmailConsent",
        c.created_at AS "customerCreatedAt", c.updated_at AS "customerUpdatedAt"
      FROM kfo_reminder_deliveries d
      JOIN kfo_reminder_rules r ON r.id = d.reminder_id
      JOIN kfo_appointments a ON a.id = d.appointment_id
      JOIN kfo_customers c ON c.id = d.customer_id AND c.id = a.customer_id
      WHERE d.id = ${id} AND d.status = 'processing' AND d.claim_token = ${claimToken}
        AND r.enabled = TRUE
        AND a.status IN ('scheduled', 'confirmed')
        AND c.status = 'active' AND c.email_consent = TRUE AND BTRIM(c.email) <> ''
        AND (r.audience = 'all' OR EXISTS (
          SELECT 1 FROM kfo_reminder_targets target
          WHERE target.reminder_id = r.id AND target.customer_id = c.id
        ))
        AND (a.appointment_date + r.offset_days) = d.scheduled_date
        AND d.scheduled_date <= ${today}::date
        AND d.scheduled_date + ${grace} >= ${today}::date
    ), refreshed AS (
      UPDATE kfo_reminder_deliveries d SET recipient = eligible."customerEmail", updated_at = NOW()
      FROM eligible
      WHERE d.id = eligible."deliveryId" AND d.status = 'processing' AND d.claim_token = eligible."claimToken"
      RETURNING d.id
    )
    SELECT eligible.* FROM eligible JOIN refreshed ON refreshed.id = eligible."deliveryId"`;
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    deliveryId: String(row.deliveryId),
    claimToken: String(row.claimToken),
    rule: {
      id: String(row.ruleId),
      name: String(row.ruleName || ""),
      subject: String(row.ruleSubject || ""),
      body: String(row.ruleBody || ""),
      offsetDays: Number(row.ruleOffsetDays),
      audience: row.ruleAudience === "selected" ? "selected" : "all",
      customerIds: Array.isArray(row.ruleCustomerIds) ? row.ruleCustomerIds.map(String) : [],
      enabled: row.ruleEnabled === true,
      createdAt: timestamp(row.ruleCreatedAt),
      updatedAt: timestamp(row.ruleUpdatedAt),
    },
    appointment: {
      id: String(row.appointmentId),
      customerId: String(row.appointmentCustomerId),
      date: String(row.appointmentDate || ""),
      time: String(row.appointmentTime || ""),
      type: String(row.appointmentType || ""),
      notes: String(row.appointmentNotes || ""),
      status: row.appointmentStatus,
      createdAt: timestamp(row.appointmentCreatedAt),
      updatedAt: timestamp(row.appointmentUpdatedAt),
    },
    customer: {
      id: String(row.customerId),
      salutation: String(row.customerSalutation || ""),
      firstName: String(row.customerFirstName || ""),
      lastName: String(row.customerLastName || ""),
      birthDate: String(row.customerBirthDate || ""),
      email: String(row.customerEmail || ""),
      phone: String(row.customerPhone || ""),
      mobile: String(row.customerMobile || ""),
      street: String(row.customerStreet || ""),
      postalCode: String(row.customerPostalCode || ""),
      city: String(row.customerCity || ""),
      insuranceType: String(row.customerInsuranceType || ""),
      insurer: String(row.customerInsurer || ""),
      patientNumber: String(row.customerPatientNumber || ""),
      status: row.customerStatus,
      notes: String(row.customerNotes || ""),
      emailConsent: row.customerEmailConsent === true,
      invoiceEmailConsent: row.customerInvoiceEmailConsent === true,
      createdAt: timestamp(row.customerCreatedAt),
      updatedAt: timestamp(row.customerUpdatedAt),
    },
  };
}

export async function finishReminderDelivery(
  id: string,
  claimToken: string,
  result: { status: "sent" | "failed"; error?: string },
): Promise<boolean> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`UPDATE kfo_reminder_deliveries SET
      status = ${result.status}, sent_at = ${result.status === "sent" ? new Date().toISOString() : null},
      error = ${cleanText(result.error, 500)}, claim_token = '', updated_at = NOW()
    WHERE id = ${id} AND status = 'processing' AND claim_token = ${claimToken}
    RETURNING id`;
  return Boolean((rows as any[]).length);
}

export async function appendEvents(events: StoreEvent[]): Promise<void> {
  if (!events.length) return;
  await ensureSchema();
  const sql = database();
  const queries: any[] = [];
  for (const event of events) {
    if (event.operation === "delete") {
      if (event.collection === "customers") queries.push(sql`DELETE FROM kfo_customers WHERE id = ${event.id}`);
      if (event.collection === "appointments") queries.push(sql`DELETE FROM kfo_appointments WHERE id = ${event.id}`);
      if (event.collection === "reminders") queries.push(sql`DELETE FROM kfo_reminder_rules WHERE id = ${event.id}`);
      if (event.collection === "settings") queries.push(sql`DELETE FROM kfo_smtp_settings WHERE id = ${event.id}`);
      if (event.collection === "deliveries") queries.push(sql`DELETE FROM kfo_reminder_deliveries WHERE id = ${event.id}`);
      continue;
    }
    if (event.collection === "customers") {
      const item = event.data as Customer;
      queries.push(sql`INSERT INTO kfo_customers (
        id, salutation, first_name, last_name, birth_date, email, phone, mobile, street, postal_code, city,
        insurance_type, insurer, patient_number, status, notes, email_consent, invoice_email_consent,
        invoice_email_consent_at, invoice_email_consent_source, created_at, updated_at
      ) VALUES (${item.id}, ${item.salutation}, ${item.firstName}, ${item.lastName}, ${item.birthDate || null},
        ${item.email}, ${item.phone}, ${item.mobile}, ${item.street}, ${item.postalCode}, ${item.city},
        ${item.insuranceType}, ${item.insurer}, ${item.patientNumber}, ${item.status}, ${item.notes},
        ${item.emailConsent}, ${item.invoiceEmailConsent}, ${item.invoiceEmailConsent ? item.updatedAt : null},
        ${item.invoiceEmailConsent ? "admin" : ""}, ${item.createdAt}, ${item.updatedAt})
      ON CONFLICT (id) DO UPDATE SET salutation = EXCLUDED.salutation, first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name, birth_date = EXCLUDED.birth_date, email = EXCLUDED.email,
        phone = EXCLUDED.phone, mobile = EXCLUDED.mobile, street = EXCLUDED.street,
        postal_code = EXCLUDED.postal_code, city = EXCLUDED.city, insurance_type = EXCLUDED.insurance_type,
        insurer = EXCLUDED.insurer, patient_number = EXCLUDED.patient_number, status = EXCLUDED.status,
        notes = EXCLUDED.notes, email_consent = EXCLUDED.email_consent,
        invoice_email_consent_at = CASE
          WHEN kfo_customers.invoice_email_consent = FALSE AND EXCLUDED.invoice_email_consent = TRUE THEN EXCLUDED.updated_at
          WHEN EXCLUDED.invoice_email_consent = FALSE THEN NULL ELSE kfo_customers.invoice_email_consent_at END,
        invoice_email_consent_source = CASE WHEN EXCLUDED.invoice_email_consent = TRUE THEN 'admin' ELSE '' END,
        invoice_email_consent = EXCLUDED.invoice_email_consent, updated_at = EXCLUDED.updated_at`);
    }
    if (event.collection === "appointments") {
      const item = event.data as Appointment;
      queries.push(sql`INSERT INTO kfo_appointments (
        id, customer_id, appointment_date, appointment_time, appointment_type, notes, status, created_at, updated_at
      ) VALUES (${item.id}, ${item.customerId}, ${item.date}, ${item.time}, ${item.type}, ${item.notes},
        ${item.status}, ${item.createdAt}, ${item.updatedAt})
      ON CONFLICT (id) DO UPDATE SET customer_id = EXCLUDED.customer_id,
        appointment_date = EXCLUDED.appointment_date, appointment_time = EXCLUDED.appointment_time,
        appointment_type = EXCLUDED.appointment_type, notes = EXCLUDED.notes, status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at`);
    }
    if (event.collection === "reminders") {
      const item = event.data as ReminderRule;
      queries.push(sql`INSERT INTO kfo_reminder_rules (
        id, name, subject, body, offset_days, audience, enabled, created_at, updated_at
      ) VALUES (${item.id}, ${item.name}, ${item.subject}, ${item.body}, ${item.offsetDays}, ${item.audience},
        ${item.enabled}, ${item.createdAt}, ${item.updatedAt})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, subject = EXCLUDED.subject, body = EXCLUDED.body,
        offset_days = EXCLUDED.offset_days, audience = EXCLUDED.audience, enabled = EXCLUDED.enabled,
        updated_at = EXCLUDED.updated_at`);
      queries.push(sql`DELETE FROM kfo_reminder_targets WHERE reminder_id = ${item.id}`);
      for (const customerId of item.customerIds) {
        queries.push(sql`INSERT INTO kfo_reminder_targets (reminder_id, customer_id)
          VALUES (${item.id}, ${customerId}) ON CONFLICT DO NOTHING`);
      }
    }
    if (event.collection === "settings") {
      const item = event.data as SmtpSettings;
      queries.push(sql`INSERT INTO kfo_smtp_settings (
        id, host, port, security, username, encrypted_password, from_name, from_email, reply_to, timezone, updated_at
      ) VALUES (${item.id}, ${item.host}, ${item.port}, ${item.security}, ${item.username},
        ${item.encryptedPassword}, ${item.fromName}, ${item.fromEmail}, ${item.replyTo}, ${item.timezone}, ${item.updatedAt})
      ON CONFLICT (id) DO UPDATE SET host = EXCLUDED.host, port = EXCLUDED.port, security = EXCLUDED.security,
        username = EXCLUDED.username, encrypted_password = EXCLUDED.encrypted_password,
        from_name = EXCLUDED.from_name, from_email = EXCLUDED.from_email, reply_to = EXCLUDED.reply_to,
        timezone = EXCLUDED.timezone, updated_at = EXCLUDED.updated_at`);
    }
    if (event.collection === "deliveries") {
      const item = event.data as DeliveryLog;
      queries.push(sql`INSERT INTO kfo_reminder_deliveries (
        id, reminder_id, appointment_id, customer_id, recipient, scheduled_date, status, sent_at, error, updated_at
      ) VALUES (${item.id}, ${item.reminderId || null}, ${item.appointmentId || null}, ${item.customerId || null},
        ${item.recipient}, ${item.scheduledDate}, ${item.status}, ${item.sentAt || null}, ${item.error}, ${item.updatedAt})
      ON CONFLICT (id) DO UPDATE SET reminder_id = EXCLUDED.reminder_id, appointment_id = EXCLUDED.appointment_id,
        customer_id = EXCLUDED.customer_id, recipient = EXCLUDED.recipient,
        scheduled_date = EXCLUDED.scheduled_date, status = EXCLUDED.status,
        sent_at = EXCLUDED.sent_at, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at`);
    }
  }
  if (queries.length) await sql.transaction(queries);
}

function timestamp(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function requiredVersion(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new StaleVersionError(`Der Bearbeitungsstand ${label} fehlt. Bitte laden Sie die Seite neu.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new StaleVersionError(`Der Bearbeitungsstand ${label} ist ungültig. Bitte laden Sie die Seite neu.`);
  }
  return date.toISOString();
}

function rethrowVersionGuard(error: unknown, message: string): never {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code || "")
    : "";
  if (code === "22012") throw new StaleVersionError(message);
  throw error;
}

export async function saveCustomerRecord(
  item: Customer,
  options: { create: boolean; expectedUpdatedAt?: unknown },
): Promise<Customer> {
  await ensureSchema();
  const sql = database();
  if (options.create) {
    const rows = await sql`INSERT INTO kfo_customers (
        id, salutation, first_name, last_name, birth_date, email, phone, mobile, street, postal_code, city,
        insurance_type, insurer, patient_number, status, notes, email_consent, invoice_email_consent,
        invoice_email_consent_at, invoice_email_consent_source, created_at, updated_at
      ) VALUES (${item.id}, ${item.salutation}, ${item.firstName}, ${item.lastName}, ${item.birthDate || null},
        ${item.email}, ${item.phone}, ${item.mobile}, ${item.street}, ${item.postalCode}, ${item.city},
        ${item.insuranceType}, ${item.insurer}, ${item.patientNumber}, ${item.status}, ${item.notes},
        ${item.emailConsent}, ${item.invoiceEmailConsent}, CASE WHEN ${item.invoiceEmailConsent} THEN NOW() ELSE NULL END,
        CASE WHEN ${item.invoiceEmailConsent} THEN 'admin' ELSE '' END, ${item.createdAt}, date_trunc('milliseconds', clock_timestamp()))
      RETURNING updated_at AS "updatedAt"`;
    return { ...item, updatedAt: timestamp((rows as any[])[0]?.updatedAt) };
  }

  const expected = requiredVersion(options.expectedUpdatedAt, "der Patientendaten");
  const queries: any[] = [
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-customer:${item.id}`}, 0))`,
    sql`SELECT id FROM kfo_customers WHERE id = ${item.id} FOR UPDATE`,
    sql`SELECT 1 / CASE WHEN EXISTS (
      SELECT 1 FROM kfo_customers WHERE id = ${item.id}
        AND date_trunc('milliseconds', updated_at) = ${expected}::timestamptz
    ) THEN 1 ELSE 0 END AS version_guard`,
    sql`UPDATE kfo_customers SET salutation = ${item.salutation}, first_name = ${item.firstName},
      last_name = ${item.lastName}, birth_date = ${item.birthDate || null}, email = ${item.email},
      phone = ${item.phone}, mobile = ${item.mobile}, street = ${item.street}, postal_code = ${item.postalCode},
      city = ${item.city}, insurance_type = ${item.insuranceType}, insurer = ${item.insurer},
      patient_number = ${item.patientNumber}, status = ${item.status}, notes = ${item.notes},
      email_consent = ${item.emailConsent},
      invoice_email_consent_at = CASE
        WHEN invoice_email_consent = FALSE AND ${item.invoiceEmailConsent} = TRUE THEN NOW()
        WHEN ${item.invoiceEmailConsent} = FALSE THEN NULL ELSE invoice_email_consent_at END,
      invoice_email_consent_source = CASE WHEN ${item.invoiceEmailConsent} THEN 'admin' ELSE '' END,
      invoice_email_consent = ${item.invoiceEmailConsent},
      updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
      WHERE id = ${item.id} RETURNING updated_at AS "updatedAt"`,
  ];
  if (item.status === "archived") {
    queries.push(
      sql`UPDATE kfo_appointments SET status = 'cancelled',
        updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
        WHERE customer_id = ${item.id} AND status IN ('scheduled', 'confirmed')`,
      sql`UPDATE kfo_reminder_rules rule SET
        updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), rule.updated_at + INTERVAL '1 millisecond')
        WHERE EXISTS (
          SELECT 1 FROM kfo_reminder_targets target
          WHERE target.reminder_id = rule.id AND target.customer_id = ${item.id}
        )`,
      sql`DELETE FROM kfo_reminder_targets WHERE customer_id = ${item.id}`,
    );
  }
  try {
    const results = await sql.transaction(queries) as any[][];
    const row = results[3]?.[0];
    if (!row) throw new StaleVersionError("Die Patientendaten wurden zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
    return { ...item, updatedAt: timestamp(row.updatedAt) };
  } catch (error) {
    if (error instanceof StaleVersionError) throw error;
    rethrowVersionGuard(error, "Die Patientendaten wurden zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
  }
}

export async function saveReminderRecord(
  item: ReminderRule,
  options: { create: boolean; expectedUpdatedAt?: unknown },
): Promise<ReminderRule> {
  await ensureSchema();
  const sql = database();
  const queries: any[] = [sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-reminder:${item.id}`}, 0))`];
  let writeIndex: number;
  if (options.create) {
    writeIndex = queries.length;
    queries.push(sql`INSERT INTO kfo_reminder_rules (
        id, name, subject, body, offset_days, audience, enabled, created_at, updated_at
      ) VALUES (${item.id}, ${item.name}, ${item.subject}, ${item.body}, ${item.offsetDays}, ${item.audience},
        ${item.enabled}, ${item.createdAt}, date_trunc('milliseconds', clock_timestamp()))
      RETURNING updated_at AS "updatedAt"`);
  } else {
    const expected = requiredVersion(options.expectedUpdatedAt, "der Erinnerung");
    queries.push(
      sql`SELECT id FROM kfo_reminder_rules WHERE id = ${item.id} FOR UPDATE`,
      sql`SELECT 1 / CASE WHEN EXISTS (
        SELECT 1 FROM kfo_reminder_rules WHERE id = ${item.id}
          AND date_trunc('milliseconds', updated_at) = ${expected}::timestamptz
      ) THEN 1 ELSE 0 END AS version_guard`,
    );
    writeIndex = queries.length;
    queries.push(sql`UPDATE kfo_reminder_rules SET name = ${item.name}, subject = ${item.subject},
      body = ${item.body}, offset_days = ${item.offsetDays}, audience = ${item.audience}, enabled = ${item.enabled},
      updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
      WHERE id = ${item.id} RETURNING updated_at AS "updatedAt"`);
  }
  queries.push(sql`DELETE FROM kfo_reminder_targets WHERE reminder_id = ${item.id}`);
  for (const customerId of item.customerIds) {
    queries.push(sql`INSERT INTO kfo_reminder_targets (reminder_id, customer_id)
      VALUES (${item.id}, ${customerId}) ON CONFLICT DO NOTHING`);
  }
  try {
    const results = await sql.transaction(queries) as any[][];
    const row = results[writeIndex]?.[0];
    if (!row) throw new StaleVersionError("Die Erinnerung wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
    return { ...item, updatedAt: timestamp(row.updatedAt) };
  } catch (error) {
    if (error instanceof StaleVersionError) throw error;
    rethrowVersionGuard(error, "Die Erinnerung wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
  }
}

export async function deleteReminderRecord(idValue: unknown, expectedUpdatedAt: unknown): Promise<void> {
  await ensureSchema();
  const sql = database();
  const id = typeof idValue === "string" ? idValue.trim().slice(0, 100) : "";
  if (!id) throw new StaleVersionError("Die Erinnerung konnte nicht identifiziert werden. Bitte laden Sie die Seite neu.");
  const expected = requiredVersion(expectedUpdatedAt, "der Erinnerung");
  try {
    const results = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-reminder:${id}`}, 0))`,
      sql`SELECT id FROM kfo_reminder_rules WHERE id = ${id} FOR UPDATE`,
      sql`SELECT 1 / CASE WHEN EXISTS (
        SELECT 1 FROM kfo_reminder_rules WHERE id = ${id}
          AND date_trunc('milliseconds', updated_at) = ${expected}::timestamptz
      ) THEN 1 ELSE 0 END AS version_guard`,
      sql`DELETE FROM kfo_reminder_rules WHERE id = ${id} RETURNING id`,
    ]) as any[][];
    if (!results[3]?.length) throw new StaleVersionError("Die Erinnerung wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
  } catch (error) {
    if (error instanceof StaleVersionError) throw error;
    rethrowVersionGuard(error, "Die Erinnerung wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
  }
}

export async function saveSmtpSettingsRecord(
  item: SmtpSettings,
  options: { create: boolean; expectedUpdatedAt?: unknown },
): Promise<SmtpSettings> {
  await ensureSchema();
  const sql = database();
  const write = options.create
    ? sql`INSERT INTO kfo_smtp_settings (
        id, host, port, security, username, encrypted_password, from_name, from_email, reply_to, timezone, updated_at
      ) VALUES (${item.id}, ${item.host}, ${item.port}, ${item.security}, ${item.username},
        ${item.encryptedPassword}, ${item.fromName}, ${item.fromEmail}, ${item.replyTo}, ${item.timezone},
        date_trunc('milliseconds', clock_timestamp()))
      ON CONFLICT (id) DO NOTHING RETURNING updated_at AS "updatedAt"`
    : sql`UPDATE kfo_smtp_settings SET host = ${item.host}, port = ${item.port}, security = ${item.security},
        username = ${item.username}, encrypted_password = ${item.encryptedPassword}, from_name = ${item.fromName},
        from_email = ${item.fromEmail}, reply_to = ${item.replyTo}, timezone = ${item.timezone},
        updated_at = GREATEST(date_trunc('milliseconds', clock_timestamp()), updated_at + INTERVAL '1 millisecond')
      WHERE id = ${item.id}
        AND date_trunc('milliseconds', updated_at) = ${requiredVersion(options.expectedUpdatedAt, "der SMTP-Einstellungen")}::timestamptz
      RETURNING updated_at AS "updatedAt"`;
  const results = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended('kfo-smtp-settings:smtp', 0))`,
    write,
  ]) as any[][];
  const row = results[1]?.[0];
  if (!row) throw new StaleVersionError("Die SMTP-Einstellungen wurden zwischenzeitlich geändert. Bitte laden Sie die Seite neu.");
  return { ...item, updatedAt: timestamp(row.updatedAt) };
}

export function upsertEvent(collection: Collection, record: RecordValue): StoreEvent {
  return {
    collection,
    id: record.id,
    operation: "upsert",
    data: record,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteEvent(collection: Collection, id: string): StoreEvent {
  return { collection, id, operation: "delete", data: null, updatedAt: new Date().toISOString() };
}

export function cleanText(value: unknown, max = 500): string {
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

export function isValidEmail(value: unknown): boolean {
  const email = cleanText(value, 254).toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && !/[\r\n]/.test(email);
}

function timezoneValue(value: unknown, fallback = "Europe/Berlin"): string {
  const timezone = cleanText(value, 80) || fallback;
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return fallback;
  }
}

export function normalizeCustomer(input: any, existing?: Customer): Customer {
  const now = new Date().toISOString();
  const status = ["active", "paused", "completed", "archived"].includes(input?.status) ? input.status : "active";
  return {
    id: existing?.id || randomUUID(),
    salutation: cleanText(input?.salutation, 40),
    firstName: cleanText(input?.firstName, 120),
    lastName: cleanText(input?.lastName, 120),
    birthDate: isoDate(input?.birthDate),
    email: cleanText(input?.email, 254).toLowerCase(),
    phone: cleanText(input?.phone, 80),
    mobile: cleanText(input?.mobile, 80),
    street: cleanText(input?.street, 200),
    postalCode: cleanText(input?.postalCode ?? input?.zip, 20),
    city: cleanText(input?.city, 120),
    insuranceType: cleanText(input?.insuranceType, 80),
    insurer: cleanText(input?.insurer, 160),
    patientNumber: cleanText(input?.patientNumber, 80),
    status,
    notes: cleanText(input?.notes, 4000),
    emailConsent: input?.emailConsent === true || input?.reminderConsent === true,
    invoiceEmailConsent: input?.invoiceEmailConsent === true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export function normalizeAppointments(input: any, customerId: string, existing: Appointment[] = []): Appointment[] {
  const now = new Date().toISOString();
  const byId = new Map(existing.map((item) => [item.id, item]));
  const values = Array.isArray(input) ? input : input ? [input] : [];
  return values
    .map((item) => {
      const old = item?.id ? byId.get(String(item.id)) : undefined;
      const status = ["scheduled", "confirmed", "arrived", "completed", "cancelled", "no_show"].includes(item?.status) ? item.status : "scheduled";
      return {
        id: old?.id || randomUUID(),
        customerId,
        date: isoDate(item?.date ?? item?.appointmentDate),
        time: timeValue(item?.time ?? item?.appointmentTime),
        type: cleanText(item?.type ?? item?.appointmentType, 160),
        notes: cleanText(item?.note ?? item?.notes, 1000),
        status,
        createdAt: old?.createdAt || now,
        updatedAt: now,
      } as Appointment;
    })
    .filter((item) => item.date);
}

export function normalizeReminder(input: any, existing?: ReminderRule): ReminderRule {
  const now = new Date().toISOString();
  const requestedOffset = input?.offsetDays !== undefined
    ? Number(input.offsetDays)
    : (input?.relation === "after" ? 1 : -1) * Math.abs(Number(input?.days) || 0);
  const offset = Math.max(-365, Math.min(365, Math.trunc(requestedOffset || 0)));
  const audience = input?.audience === "selected" ? "selected" : "all";
  const customerIds: string[] = audience === "selected" && Array.isArray(input?.customerIds)
    ? [...new Set<string>(input.customerIds.map((id: unknown) => cleanText(id, 100)).filter(Boolean))]
    : [];
  return {
    id: existing?.id || randomUUID(),
    name: cleanText(input?.name, 160),
    subject: cleanText(input?.subject, 300),
    body: cleanText(input?.body, 15000),
    offsetDays: offset,
    audience,
    customerIds,
    enabled: input?.enabled !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function encryptionKey(): Buffer {
  const source = env("ADMIN_ENCRYPTION_KEY");
  if (!source) throw new Error("ADMIN_ENCRYPTION_KEY fehlt.");
  return createHash("sha256").update(source).digest();
}

function encryptSecret(value: string): string {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptSecret(value: string): string {
  if (!value) return "";
  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Das gespeicherte SMTP-Passwort ist ungültig.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

export function normalizeSettings(input: any, existing?: SmtpSettings): SmtpSettings {
  const requestedSecurity = input?.security === "tls" ? "ssl" : input?.security;
  const security: SmtpSettings["security"] = requestedSecurity === "ssl" ? "ssl" : "starttls";
  const password = typeof input?.password === "string" && input.password ? encryptSecret(input.password) : existing?.encryptedPassword || "";
  return {
    id: "smtp",
    host: cleanText(input?.host ?? existing?.host, 255),
    port: Math.max(1, Math.min(65535, Math.trunc(Number(input?.port ?? existing?.port) || 587))),
    security,
    username: cleanText(input?.username ?? existing?.username, 255),
    encryptedPassword: password,
    fromName: cleanText(input?.senderName ?? input?.fromName ?? existing?.fromName, 160) || "Kieferorthopädie Moosburg",
    fromEmail: cleanText(input?.senderEmail ?? input?.fromEmail ?? existing?.fromEmail, 254).toLowerCase(),
    replyTo: cleanText(input?.replyToEmail ?? input?.replyTo ?? existing?.replyTo, 254).toLowerCase(),
    timezone: timezoneValue(input?.timezone ?? existing?.timezone),
    updatedAt: new Date().toISOString(),
  };
}

export function publicSettings(settings?: SmtpSettings | null) {
  return {
    host: settings?.host || "",
    port: settings?.port || 587,
    security: settings?.security === "ssl" ? "tls" : settings?.security || "starttls",
    username: settings?.username || "",
    senderName: settings?.fromName || "Kieferorthopädie Moosburg",
    senderEmail: settings?.fromEmail || "",
    replyToEmail: settings?.replyTo || "",
    timezone: settings?.timezone || "Europe/Berlin",
    hasPassword: Boolean(settings?.encryptedPassword),
    configured: Boolean(settings?.host && settings?.username && settings?.encryptedPassword && isValidEmail(settings?.fromEmail)),
    updatedAt: settings?.updatedAt || "",
  };
}

export function buildTransport(settings: SmtpSettings) {
  if (!settings.host || !settings.username || !settings.encryptedPassword || !settings.fromEmail) {
    throw new Error("Die SMTP-Einstellungen sind noch nicht vollständig.");
  }
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.security === "ssl",
    requireTLS: settings.security === "starttls",
    auth: { user: settings.username, pass: decryptSecret(settings.encryptedPassword) },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export function customerWithAppointments(customer: Customer, appointments: Appointment[]) {
  return {
    ...customer,
    reminderConsent: customer.emailConsent,
    invoiceEmailConsent: customer.invoiceEmailConsent,
    appointments: appointments
      .filter((item) => item.customerId === customer.id)
      .sort((a, b) => `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`))
      .map((item) => ({ ...item, note: item.notes })),
  };
}

export function isStorageSetupError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("DATABASE_URL");
}

export function apiError(res: VercelResponse, error: unknown): void {
  const databaseCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : "";
  console.error("KFO admin API error", { name: error instanceof Error ? error.name : "UnknownError", code: databaseCode || "unknown" });
  if (databaseCode === "stale_version") {
    res.status(409).json({
      error: "stale_version",
      code: "stale_version",
      message: error instanceof Error ? error.message : "Der Datensatz wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu.",
    });
    return;
  }
  if (databaseCode === "23505") {
    res.status(409).json({ error: "duplicate_record", message: "Ein Datensatz mit dieser Patienten- oder Referenznummer existiert bereits." });
    return;
  }
  if (databaseCode === "23503") {
    res.status(409).json({ error: "related_record_missing", message: "Ein verknüpfter Datensatz wurde zwischenzeitlich geändert. Bitte laden Sie die Seite neu." });
    return;
  }
  if (databaseCode === "EAUTH") {
    res.status(502).json({ error: "smtp_auth_failed", message: "Der SMTP-Server hat die Zugangsdaten abgelehnt." });
    return;
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED"].includes(databaseCode)) {
    res.status(502).json({ error: "smtp_connection_failed", message: "Der SMTP-Server konnte nicht sicher erreicht werden." });
    return;
  }
  if (isStorageSetupError(error)) {
    res.status(503).json({
      error: "setup_required",
      message: "Der Verwaltungsbereich ist noch nicht mit der PostgreSQL-Datenbank verbunden.",
      missing: ["DATABASE_URL oder moosburg_DATABASE_URL"],
    });
    return;
  }
  res.status(500).json({ error: "server_error", message: "Die Anfrage konnte serverseitig nicht verarbeitet werden." });
}

export function newId(): string {
  return randomUUID();
}

export function deliveryId(reminderId: string, appointmentId: string, scheduledDate: string): string {
  return createHash("sha256").update(`${reminderId}:${appointmentId}:${scheduledDate}`).digest("hex").slice(0, 40);
}

export function dateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return value.toISOString().slice(0, 10);
}

function germanDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day, 12)),
  );
}

function placeholderValues(customer: Customer, appointment: Appointment) {
  return {
    vorname: customer.firstName,
    nachname: customer.lastName,
    termin_datum: germanDate(appointment.date),
    termin_uhrzeit: appointment.time || "nach Vereinbarung",
    termin_art: appointment.type || "Termin",
    praxis_name: "Kieferorthopädie Moosburg",
  };
}

export function renderTemplate(template: string, customer: Customer, appointment: Appointment): string {
  const values = placeholderValues(customer, appointment);
  return template.replace(/{{\s*(vorname|nachname|termin_datum|termin_uhrzeit|termin_art|praxis_name)\s*}}/g, (_, key) => values[key as keyof typeof values]);
}

export function reminderHtml(body: string): string {
  return practiceMail({ subject: "Erinnerung", body, eyebrow: "Terminerinnerung" }).html;
}

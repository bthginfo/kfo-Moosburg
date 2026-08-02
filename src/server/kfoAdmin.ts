import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import nodemailer from "nodemailer";

const STORE_SHEET = "KFO_Daten";
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
  status: "scheduled" | "completed" | "cancelled";
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
  security: "ssl" | "starttls" | "none";
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
  status: "processing" | "sent" | "failed";
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

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function sessionSecret(): string {
  return env("ADMIN_SESSION_SECRET") || env("ADMIN_PASSWORD");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function signSession(expiresAt: number): string {
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
    `${SESSION_COOKIE}=${encodeURIComponent(signSession(expiresAt))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
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
}

export function ensureWriteOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method || "")) return true;
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return true;
  try {
    if (new URL(origin).host === host) return true;
  } catch {
    // handled below
  }
  res.status(403).json({ error: "invalid_origin", message: "Die Anfrage wurde aus Sicherheitsgründen abgelehnt." });
  return false;
}

async function googleSheets() {
  const email = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  let key = env("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!email || !key) throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL oder GOOGLE_SERVICE_ACCOUNT_KEY fehlt.");
  key = key.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

function sheetId(): string {
  const value = env("KFO_ADMIN_SHEET_ID");
  if (!value) throw new Error("KFO_ADMIN_SHEET_ID fehlt.");
  return value;
}

export function hasStoreConfiguration(): boolean {
  return Boolean(env("KFO_ADMIN_SHEET_ID") && env("GOOGLE_SERVICE_ACCOUNT_EMAIL") && env("GOOGLE_SERVICE_ACCOUNT_KEY"));
}

async function ensureStoreSheet(): Promise<ReturnType<typeof googleSheets> extends Promise<infer T> ? T : never> {
  const sheets = await googleSheets();
  const spreadsheetId = sheetId();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === STORE_SHEET);
  if (!exists) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: STORE_SHEET, gridProperties: { frozenRowCount: 1 } } } }] },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("already exists")) throw error;
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${STORE_SHEET}'!A1:E1`,
      valueInputOption: "RAW",
      requestBody: { values: [["Bereich", "ID", "Vorgang", "Daten_JSON", "Aktualisiert"]] },
    });
  }
  return sheets;
}

function emptySnapshot(): StoreSnapshot {
  return { customers: [], appointments: [], reminders: [], settings: [], deliveries: [] };
}

export async function loadStore(): Promise<StoreSnapshot> {
  const sheets = await ensureStoreSheet();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `'${STORE_SHEET}'!A2:E`,
  });
  const latest = new Map<string, StoreEvent>();
  for (const row of result.data.values || []) {
    const collection = String(row[0] || "") as Collection;
    const id = String(row[1] || "");
    const operation = String(row[2] || "") as StoreEvent["operation"];
    if (!id || !["customers", "appointments", "reminders", "settings", "deliveries"].includes(collection)) continue;
    let data: RecordValue | null = null;
    if (operation !== "delete") {
      try {
        data = JSON.parse(String(row[3] || "{}"));
      } catch {
        continue;
      }
    }
    latest.set(`${collection}:${id}`, {
      collection,
      id,
      operation: operation === "delete" ? "delete" : "upsert",
      data,
      updatedAt: String(row[4] || ""),
    });
  }
  const snapshot = emptySnapshot();
  for (const event of latest.values()) {
    if (event.operation === "delete" || !event.data) continue;
    (snapshot[event.collection] as RecordValue[]).push(event.data);
  }
  return snapshot;
}

export async function appendEvents(events: StoreEvent[]): Promise<void> {
  if (!events.length) return;
  const sheets = await ensureStoreSheet();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: `'${STORE_SHEET}'!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: events.map((event) => [
        event.collection,
        event.id,
        event.operation,
        event.data ? JSON.stringify(event.data) : "",
        event.updatedAt,
      ]),
    },
  });
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

function cleanText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoDate(value: unknown): string {
  const text = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function timeValue(value: unknown): string {
  const text = cleanText(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
}

export function normalizeCustomer(input: any, existing?: Customer): Customer {
  const now = new Date().toISOString();
  const status = ["active", "paused", "completed", "archived"].includes(input?.status) ? input.status : "active";
  return {
    id: existing?.id || cleanText(input?.id, 100) || randomUUID(),
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
      const status = ["scheduled", "completed", "cancelled"].includes(item?.status) ? item.status : "scheduled";
      return {
        id: old?.id || cleanText(item?.id, 100) || randomUUID(),
        customerId,
        date: isoDate(item?.date ?? item?.appointmentDate),
        time: timeValue(item?.time ?? item?.appointmentTime),
        type: cleanText(item?.type ?? item?.appointmentType, 160),
        notes: cleanText(item?.notes ?? item?.note, 1000),
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
    id: existing?.id || cleanText(input?.id, 100) || randomUUID(),
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
  const source = env("ADMIN_ENCRYPTION_KEY") || sessionSecret();
  if (!source) throw new Error("ADMIN_ENCRYPTION_KEY oder ADMIN_SESSION_SECRET fehlt.");
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
  const security = ["ssl", "starttls", "none"].includes(requestedSecurity) ? requestedSecurity : existing?.security || "starttls";
  const password = typeof input?.password === "string" && input.password ? encryptSecret(input.password) : existing?.encryptedPassword || "";
  return {
    id: "smtp",
    host: cleanText(input?.host ?? existing?.host, 255),
    port: Math.max(1, Math.min(65535, Math.trunc(Number(input?.port ?? existing?.port) || 587))),
    security,
    username: cleanText(input?.username ?? existing?.username, 255),
    encryptedPassword: password,
    fromName: cleanText(input?.fromName ?? input?.senderName ?? existing?.fromName, 160) || "Kieferorthopädie Moosburg",
    fromEmail: cleanText(input?.fromEmail ?? input?.senderEmail ?? existing?.fromEmail, 254).toLowerCase(),
    replyTo: cleanText(input?.replyTo ?? input?.replyToEmail ?? existing?.replyTo, 254).toLowerCase(),
    timezone: cleanText(input?.timezone ?? existing?.timezone, 80) || "Europe/Berlin",
    updatedAt: new Date().toISOString(),
  };
}

export function publicSettings(settings?: SmtpSettings | null) {
  return {
    host: settings?.host || "",
    port: settings?.port || 587,
    security: settings?.security === "ssl" ? "tls" : settings?.security || "starttls",
    username: settings?.username || "",
    fromName: settings?.fromName || "Kieferorthopädie Moosburg",
    fromEmail: settings?.fromEmail || "",
    replyTo: settings?.replyTo || "",
    senderName: settings?.fromName || "Kieferorthopädie Moosburg",
    senderEmail: settings?.fromEmail || "",
    replyToEmail: settings?.replyTo || "",
    timezone: settings?.timezone || "Europe/Berlin",
    hasPassword: Boolean(settings?.encryptedPassword),
    configured: Boolean(settings?.host && settings?.username && settings?.encryptedPassword && settings?.fromEmail),
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
  });
}

export function customerWithAppointments(customer: Customer, appointments: Appointment[]) {
  return {
    ...customer,
    reminderConsent: customer.emailConsent,
    appointments: appointments
      .filter((item) => item.customerId === customer.id)
      .sort((a, b) => `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`))
      .map((item) => ({ ...item, note: item.notes })),
  };
}

export function isStorageSetupError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("KFO_ADMIN_SHEET_ID") || message.includes("GOOGLE_SERVICE_ACCOUNT");
}

export function apiError(res: VercelResponse, error: unknown): void {
  console.error("KFO admin API error", error);
  const message = error instanceof Error ? error.message : "Unbekannter Serverfehler";
  if (isStorageSetupError(error)) {
    res.status(503).json({
      error: "setup_required",
      message: "Der Verwaltungsbereich ist noch nicht vollständig mit dem Datenspeicher verbunden.",
      missing: ["KFO_ADMIN_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_KEY"],
    });
    return;
  }
  res.status(500).json({ error: "server_error", message });
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export function reminderHtml(body: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#edf7ff;padding:24px"><div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;font-family:Arial,sans-serif;color:#0d1317"><div style="background:#063255;padding:22px 28px;color:#fff;font-size:18px;font-weight:700">KFO <span style="color:#f58a07">Moosburg</span></div><div style="padding:30px 28px;line-height:1.7;font-size:16px">${escapeHtml(body).replace(/\n/g, "<br>")}</div><div style="padding:18px 28px;border-top:1px solid #dceaf5;color:#4a5d69;font-size:12px">Kieferorthopädie Moosburg · Dr. Amann &amp; Dr. Burg · Münchener Straße 4a · 85368 Moosburg</div></div></body></html>`;
}

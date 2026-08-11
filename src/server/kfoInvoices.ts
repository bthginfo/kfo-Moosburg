import { createHash, randomUUID } from "node:crypto";
import { buildTransport, database, isValidEmail, loadStore } from "./kfoAdmin.js";
import { practiceMail } from "./kfoMail.js";

export type InvoiceStatus = "not_sent" | "sent" | "reminder_sent" | "paid";
export type InvoiceDeliveryStatus = "processing" | "sent" | "failed" | "uncertain";

export interface InvoiceRecord {
  id: string;
  customerId: string;
  invoiceNumber: string;
  externalId: string;
  documentHash: string;
  issuedAt: string;
  source: "upload" | "ivoris";
  status: InvoiceStatus;
  sentAt: string;
  reminderSentAt: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDelivery {
  id: string;
  invoiceId: string;
  customerId: string;
  kind: "invoice" | "reminder";
  status: InvoiceDeliveryStatus;
  sentAt: string;
  error: string;
  updatedAt: string;
}

let schemaReady: Promise<void> | null = null;

function timestamp(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function ensureInvoiceSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = database();
    await sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS kfo_invoices (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES kfo_customers(id) ON DELETE RESTRICT,
        invoice_number TEXT NOT NULL DEFAULT '',
        external_id TEXT NOT NULL DEFAULT '',
        document_hash TEXT NOT NULL,
        issued_at DATE,
        source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'ivoris')),
        status TEXT NOT NULL DEFAULT 'not_sent' CHECK (status IN ('not_sent', 'sent', 'reminder_sent', 'paid')),
        sent_at TIMESTAMPTZ,
        reminder_sent_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (customer_id, document_hash)
      )`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS kfo_invoices_external_id_unique
          ON kfo_invoices(external_id) WHERE external_id <> ''`,
      sql`CREATE TABLE IF NOT EXISTS kfo_invoice_deliveries (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES kfo_invoices(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES kfo_customers(id) ON DELETE RESTRICT,
        kind TEXT NOT NULL CHECK (kind IN ('invoice', 'reminder')),
        status TEXT NOT NULL CHECK (status IN ('processing', 'sent', 'failed', 'uncertain')),
        claim_token TEXT NOT NULL DEFAULT '',
        sent_at TIMESTAMPTZ,
        error TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE INDEX IF NOT EXISTS kfo_invoice_customer_index ON kfo_invoices(customer_id, updated_at DESC)`,
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function mapInvoice(row: any): InvoiceRecord {
  return {
    id: String(row.id), customerId: String(row.customerId), invoiceNumber: String(row.invoiceNumber || ""),
    externalId: String(row.externalId || ""), documentHash: String(row.documentHash || ""),
    issuedAt: row.issuedAt ? String(row.issuedAt).slice(0, 10) : "", source: row.source,
    status: row.status, sentAt: timestamp(row.sentAt), reminderSentAt: timestamp(row.reminderSentAt),
    paidAt: timestamp(row.paidAt), createdAt: timestamp(row.createdAt), updatedAt: timestamp(row.updatedAt),
  };
}

function mapDelivery(row: any): InvoiceDelivery {
  return {
    id: String(row.id), invoiceId: String(row.invoiceId), customerId: String(row.customerId), kind: row.kind,
    status: row.status, sentAt: timestamp(row.sentAt), error: String(row.error || ""), updatedAt: timestamp(row.updatedAt),
  };
}

export async function loadInvoices(): Promise<{ invoices: InvoiceRecord[]; deliveries: InvoiceDelivery[] }> {
  await loadStore();
  await ensureInvoiceSchema();
  const sql = database();
  await sql`UPDATE kfo_invoice_deliveries SET status = 'uncertain', claim_token = '',
      error = 'Versandstatus unklar. Bitte im E-Mail-Postfach prüfen, bevor erneut versendet wird.', updated_at = NOW()
      WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '30 minutes'`;
  const [invoices, deliveries] = await sql.transaction([
    sql`SELECT id, customer_id AS "customerId", invoice_number AS "invoiceNumber", external_id AS "externalId",
      document_hash AS "documentHash", issued_at::text AS "issuedAt", source, status,
      sent_at AS "sentAt", reminder_sent_at AS "reminderSentAt", paid_at AS "paidAt",
      created_at AS "createdAt", updated_at AS "updatedAt" FROM kfo_invoices ORDER BY updated_at DESC`,
    sql`SELECT id, invoice_id AS "invoiceId", customer_id AS "customerId", kind, status,
      sent_at AS "sentAt", error, updated_at AS "updatedAt" FROM kfo_invoice_deliveries ORDER BY updated_at DESC LIMIT 500`,
  ]);
  return { invoices: (invoices as any[]).map(mapInvoice), deliveries: (deliveries as any[]).map(mapDelivery) };
}

export function invoiceId(customerId: string, documentHash: string): string {
  return createHash("sha256").update(`${customerId}:${documentHash}`).digest("hex").slice(0, 40);
}

export async function sendInvoiceDocument(input: {
  customerId: string; patientNumber: string; invoiceNumber?: string; issuedAt?: string;
  documentHash?: string; pdf?: Buffer; fileName?: string; kind: "invoice" | "reminder";
  invoiceId?: string;
}): Promise<{ invoice: InvoiceRecord; delivery: InvoiceDelivery }> {
  const store = await loadStore();
  await ensureInvoiceSchema();
  const customer = store.customers.find((item) => item.id === input.customerId);
  if (!customer || customer.status !== "active") throw Object.assign(new Error("Patient:in ist nicht aktiv oder wurde nicht gefunden."), { code: "invoice_validation" });
  if (!customer.patientNumber || customer.patientNumber !== input.patientNumber) throw Object.assign(new Error("Die Patientennummer stimmt nicht mehr mit dem Datensatz überein."), { code: "invoice_validation" });
  if (!customer.invoiceEmailConsent) throw Object.assign(new Error("Die Einwilligung für den Rechnungsversand per E-Mail fehlt."), { code: "invoice_consent_missing" });
  if (!isValidEmail(customer.email)) throw Object.assign(new Error("Es ist keine gültige E-Mail-Adresse hinterlegt."), { code: "invoice_validation" });
  const settings = store.settings.find((item) => item.id === "smtp");
  if (!settings) throw Object.assign(new Error("Der E-Mail-Versand ist noch nicht eingerichtet."), { code: "smtp_not_configured" });

  const sql = database();
  let currentInvoiceId = input.invoiceId || "";
  if (input.kind === "invoice") {
    if (!input.pdf || !input.documentHash) throw Object.assign(new Error("Die Rechnungsdatei fehlt."), { code: "invoice_validation" });
    currentInvoiceId = invoiceId(customer.id, input.documentHash);
    await sql`INSERT INTO kfo_invoices (id, customer_id, invoice_number, document_hash, issued_at, source)
      VALUES (${currentInvoiceId}, ${customer.id}, ${(input.invoiceNumber || "").slice(0, 100)}, ${input.documentHash}, ${input.issuedAt || null}, 'upload')
      ON CONFLICT (id) DO UPDATE SET invoice_number = CASE WHEN kfo_invoices.invoice_number = '' THEN EXCLUDED.invoice_number ELSE kfo_invoices.invoice_number END,
        updated_at = NOW()`;
  } else {
    if (!currentInvoiceId) {
      const rows = await sql`SELECT id FROM kfo_invoices WHERE customer_id = ${customer.id} AND status <> 'paid' ORDER BY updated_at DESC LIMIT 1`;
      currentInvoiceId = String((rows as any[])[0]?.id || "");
    }
    if (!currentInvoiceId) throw Object.assign(new Error("Für diese Person wurde keine offene Rechnung gefunden."), { code: "invoice_validation" });
  }

  const deliveryId = createHash("sha256").update(`${currentInvoiceId}:${input.kind}`).digest("hex").slice(0, 40);
  const claimToken = randomUUID();
  const claimResults = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`kfo-invoice-delivery:${deliveryId}`}, 0))`,
    sql`INSERT INTO kfo_invoice_deliveries (id, invoice_id, customer_id, kind, status, claim_token)
      VALUES (${deliveryId}, ${currentInvoiceId}, ${customer.id}, ${input.kind}, 'processing', ${claimToken})
      ON CONFLICT (id) DO UPDATE SET status = 'processing', claim_token = ${claimToken}, error = '', updated_at = NOW()
      WHERE kfo_invoice_deliveries.status = 'failed'
      RETURNING id`,
  ]) as any[][];
  if (!(claimResults[1] || []).length) throw Object.assign(new Error("Dieser Versand wurde bereits verarbeitet oder muss zunächst im Postfach geprüft werden."), { code: "invoice_already_processed" });

  const latest = await loadStore();
  const liveCustomer = latest.customers.find((item) => item.id === customer.id);
  if (!liveCustomer || liveCustomer.patientNumber !== input.patientNumber || !liveCustomer.invoiceEmailConsent || !isValidEmail(liveCustomer.email)) {
    await finishInvoiceDelivery(deliveryId, claimToken, "failed", "Stammdaten oder Einwilligung wurden vor dem Versand geändert.");
    throw Object.assign(new Error("Stammdaten oder Einwilligung wurden vor dem Versand geändert."), { code: "invoice_validation" });
  }

  const greeting = `${liveCustomer.salutation ? `${liveCustomer.salutation} ` : ""}${liveCustomer.lastName}`.trim();
  const mail = practiceMail(input.kind === "invoice" ? {
    subject: "Ihre Rechnung der KFO Moosburg",
    greeting: `Guten Tag ${greeting},`,
    body: "anbei erhalten Sie Ihre Rechnung der Kieferorthopädie Moosburg. Bitte öffnen Sie die passwortgeschützte PDF-Datei mit dem Ihnen separat bekannten Kennwort.",
    notice: "Aus Datenschutzgründen wird das Kennwort niemals zusammen mit der Rechnung per E-Mail versendet.",
    eyebrow: "Rechnung",
  } : {
    subject: "Freundliche Erinnerung zu Ihrer Rechnung",
    greeting: `Guten Tag ${greeting},`,
    body: "wir möchten Sie freundlich an Ihre noch offene Rechnung der Kieferorthopädie Moosburg erinnern. Falls sich Zahlung und diese Nachricht überschnitten haben, betrachten Sie die Erinnerung bitte als gegenstandslos.",
    notice: input.pdf ? "Die erneut beigefügte Rechnung ist passwortgeschützt. Das Kennwort wird nicht per E-Mail versendet." : undefined,
    eyebrow: "Rechnungserinnerung",
  });

  const transport = buildTransport(settings);
  try {
    await transport.verify();
  } catch (error) {
    await finishInvoiceDelivery(deliveryId, claimToken, "failed", "Die sichere Verbindung zum E-Mail-Server konnte nicht hergestellt werden.");
    throw error;
  }
  try {
    await transport.sendMail({
      from: { name: settings.fromName, address: settings.fromEmail }, to: liveCustomer.email,
      replyTo: settings.replyTo || undefined, subject: input.kind === "invoice" ? "Ihre Rechnung der KFO Moosburg" : "Freundliche Erinnerung zu Ihrer Rechnung",
      text: mail.text, html: mail.html,
      attachments: input.pdf ? [{ filename: safePdfName(input.fileName || "Rechnung.pdf"), content: input.pdf, contentType: "application/pdf" }] : undefined,
    });
  } catch (error) {
    await finishInvoiceDelivery(deliveryId, claimToken, "uncertain", "Der E-Mail-Server hat den endgültigen Versandstatus nicht eindeutig bestätigt. Bitte das Gesendet-Postfach prüfen.");
    throw Object.assign(new Error("Der Versandstatus ist unklar. Bitte prüfen Sie das Gesendet-Postfach und senden Sie nicht erneut."), { code: "invoice_uncertain", cause: error });
  }
  const delivery = await finishInvoiceDelivery(deliveryId, claimToken, "sent", "");
  if (!delivery) throw Object.assign(new Error("Der E-Mail-Server hat angenommen; der interne Status ist unklar. Bitte nicht erneut senden, sondern das Postfach prüfen."), { code: "invoice_uncertain" });
  const invoiceRows = await sql`SELECT id, customer_id AS "customerId", invoice_number AS "invoiceNumber", external_id AS "externalId",
      document_hash AS "documentHash", issued_at::text AS "issuedAt", source, status, sent_at AS "sentAt",
      reminder_sent_at AS "reminderSentAt", paid_at AS "paidAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM kfo_invoices WHERE id = ${currentInvoiceId}`;
  return { invoice: mapInvoice((invoiceRows as any[])[0]), delivery };
}

async function finishInvoiceDelivery(id: string, token: string, status: "sent" | "failed" | "uncertain", error: string): Promise<InvoiceDelivery | null> {
  const sql = database();
  const rows = await sql.transaction([
    sql`UPDATE kfo_invoice_deliveries SET status = ${status}, claim_token = '', sent_at = CASE WHEN ${status} = 'sent' THEN NOW() ELSE sent_at END,
      error = ${error.slice(0, 300)}, updated_at = NOW() WHERE id = ${id} AND claim_token = ${token} AND status = 'processing'
      RETURNING id, invoice_id AS "invoiceId", customer_id AS "customerId", kind, status, sent_at AS "sentAt", error, updated_at AS "updatedAt"`,
    sql`UPDATE kfo_invoices i SET
      status = CASE WHEN i.status = 'paid' THEN 'paid' WHEN ${status} <> 'sent' THEN i.status WHEN d.kind = 'reminder' THEN 'reminder_sent' ELSE 'sent' END,
      sent_at = CASE WHEN ${status} = 'sent' AND d.kind = 'invoice' THEN COALESCE(i.sent_at, NOW()) ELSE i.sent_at END,
      reminder_sent_at = CASE WHEN ${status} = 'sent' AND d.kind = 'reminder' THEN NOW() ELSE i.reminder_sent_at END,
      updated_at = CASE WHEN ${status} = 'sent' THEN NOW() ELSE i.updated_at END
      FROM kfo_invoice_deliveries d WHERE d.id = ${id} AND d.invoice_id = i.id AND d.status = 'sent' AND d.claim_token = ''`,
  ]) as any[][];
  return (rows[0] || [])[0] ? mapDelivery(rows[0][0]) : null;
}

export function validatePdf(base64: unknown, claimedHash: unknown): { pdf: Buffer; hash: string } {
  if (typeof base64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw Object.assign(new Error("Die PDF-Datei konnte nicht gelesen werden."), { code: "invalid_pdf" });
  const pdf = Buffer.from(base64, "base64");
  if (!pdf.length || pdf.length > 2_800_000) throw Object.assign(new Error("PDF-Dateien dürfen höchstens 2,8 MB groß sein."), { code: "invalid_pdf" });
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") throw Object.assign(new Error("Die Datei ist keine gültige PDF-Rechnung."), { code: "invalid_pdf" });
  if (!pdf.includes(Buffer.from("/Encrypt", "ascii"))) throw Object.assign(new Error("Diese PDF ist nicht passwortgeschützt. Unverschlüsselte Rechnungen werden nicht per E-Mail versendet."), { code: "pdf_not_encrypted" });
  const hash = createHash("sha256").update(pdf).digest("hex");
  if (typeof claimedHash !== "string" || claimedHash !== hash) throw Object.assign(new Error("Die Datei wurde während der Übertragung verändert."), { code: "invalid_pdf" });
  return { pdf, hash };
}

function safePdfName(value: string): string {
  const base = value.replace(/[^a-zA-Z0-9ÄÖÜäöüß._ -]/g, "_").slice(-120).trim();
  return (base.toLowerCase().endsWith(".pdf") ? base : `${base || "Rechnung"}.pdf`);
}

import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import { apiError, ensureWriteOrigin, requireAdmin, setPrivateResponse } from "../src/server/kfoAdmin.js";
import { loadInvoices, sendInvoiceDocument, validatePdf } from "../src/server/kfoInvoices.js";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;
  try {
    if (req.method === "GET") return res.status(200).json(await loadInvoices());
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const body = req.body || {};
    if (!['invoice', 'reminder'].includes(body.kind)) return res.status(400).json({ error: "validation_error", message: "Versandart ist ungültig." });
    const attachment = body.pdfBase64 ? validatePdf(body.pdfBase64, body.documentHash) : null;
    if (body.kind === "invoice" && !attachment) return res.status(400).json({ error: "validation_error", message: "Bitte wählen Sie eine Rechnung aus." });
    const result = await sendInvoiceDocument({
      customerId: String(body.customerId || ""), patientNumber: String(body.patientNumber || ""),
      invoiceNumber: String(body.invoiceNumber || "").slice(0, 100), issuedAt: /^\d{4}-\d{2}-\d{2}$/.test(body.issuedAt || "") ? body.issuedAt : undefined,
      documentHash: attachment?.hash, pdf: attachment?.pdf, fileName: String(body.fileName || "Rechnung.pdf"),
      kind: body.kind, invoiceId: String(body.invoiceId || ""),
    });
    return res.status(200).json(result);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as any).code) : "";
    if (code.startsWith("invoice_") || code === "invalid_pdf" || code === "pdf_not_encrypted" || code === "smtp_not_configured") {
      const status = code === "invoice_already_processed" ? 409 : 400;
      return res.status(status).json({ error: code, code, message: error instanceof Error ? error.message : "Die Rechnung konnte nicht verarbeitet werden." });
    }
    apiError(res, error);
  }
}

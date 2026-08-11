import type { VercelRequest, VercelResponse } from "../../src/server/vercelTypes.js";
import {
  apiError,
  buildTransport,
  ensureWriteOrigin,
  isValidEmail,
  loadStore,
  requireAdmin,
  setPrivateResponse,
} from "../../src/server/kfoAdmin.js";
import { practiceMail } from "../../src/server/kfoMail.js";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;
  try {
    const store = await loadStore();
    const settings = store.settings.find((item) => item.id === "smtp");
    if (!settings) return res.status(400).json({ error: "smtp_not_configured", message: "Bitte speichern Sie zuerst die SMTP-Einstellungen." });
    const recipient = String(req.body?.email || req.body?.recipient || "").trim().toLowerCase();
    if (!isValidEmail(recipient)) return res.status(400).json({ error: "validation_error", message: "Bitte geben Sie eine gültige Test-E-Mail-Adresse ein." });
    const transport = buildTransport(settings);
    await transport.verify();
    const mail = practiceMail({ subject: "SMTP-Test", body: "Gute Nachrichten!\n\nDie SMTP-Verbindung der KFO Moosburg Verwaltung funktioniert.", eyebrow: "Verbindungstest" });
    await transport.sendMail({
      from: { name: settings.fromName, address: settings.fromEmail },
      to: recipient,
      replyTo: settings.replyTo || undefined,
      subject: "SMTP-Test · KFO Moosburg Verwaltung",
      text: mail.text,
      html: mail.html,
    });
    return res.status(200).json({ success: true, message: `Test-E-Mail wurde an ${recipient} gesendet.` });
  } catch (error) {
    apiError(res, error);
  }
}

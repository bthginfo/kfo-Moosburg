import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import {
  apiError,
  ensureWriteOrigin,
  isValidEmail,
  loadStore,
  normalizeSettings,
  publicSettings,
  requireAdmin,
  saveSmtpSettingsRecord,
  setPrivateResponse,
} from "../src/server/kfoAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;
  try {
    const store = await loadStore();
    const existing = store.settings.find((item) => item.id === "smtp");
    if (req.method === "GET") return res.status(200).json(publicSettings(existing));
    if (req.method === "PATCH") {
      const input = req.body?.settings || req.body || {};
      const settings = normalizeSettings(input, existing);
      if (!settings.host || !settings.username || !settings.fromEmail) {
        return res.status(400).json({ error: "validation_error", message: "SMTP-Host, Benutzername und Absender-E-Mail sind erforderlich." });
      }
      if (!isValidEmail(settings.fromEmail) || (settings.replyTo && !isValidEmail(settings.replyTo))) {
        return res.status(400).json({ error: "validation_error", message: "Bitte prüfen Sie Absender- und Antwortadresse." });
      }
      const saved = await saveSmtpSettingsRecord(settings, {
        create: !existing,
        expectedUpdatedAt: input.updatedAt,
      });
      return res.status(200).json(publicSettings(saved));
    }
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

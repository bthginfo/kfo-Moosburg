import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  apiError,
  appendEvents,
  ensureWriteOrigin,
  loadStore,
  normalizeSettings,
  publicSettings,
  requireAdmin,
  setPrivateResponse,
  upsertEvent,
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
      const settings = normalizeSettings(req.body?.settings || req.body || {}, existing);
      if (!settings.host || !settings.username || !settings.fromEmail) {
        return res.status(400).json({ error: "validation_error", message: "SMTP-Host, Benutzername und Absender-E-Mail sind erforderlich." });
      }
      await appendEvents([upsertEvent("settings", settings)]);
      return res.status(200).json(publicSettings(settings));
    }
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

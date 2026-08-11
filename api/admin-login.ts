import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import {
  apiError,
  clearLoginFailures,
  consumeLoginAttempt,
  createAdminSession,
  ensureWriteOrigin,
  missingAdminConfiguration,
  setPrivateResponse,
  verifyAdminPassword,
} from "../src/server/kfoAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;
  const missing = missingAdminConfiguration();
  if (missing.length) {
    return res.status(503).json({ error: "setup_required", message: "Der Verwaltungsbereich ist noch nicht vollständig konfiguriert.", missing });
  }

  try {
    const throttle = await consumeLoginAttempt(req);
    if (throttle.limited) {
      res.setHeader("Retry-After", String(throttle.retryAfter));
      return res.status(429).json({ error: "too_many_attempts", message: "Zu viele Versuche. Bitte probieren Sie es später erneut." });
    }

    if (!verifyAdminPassword(req.body?.password)) {
      return res.status(401).json({ error: "invalid_credentials", message: "Das Passwort ist nicht korrekt." });
    }

    await clearLoginFailures(req);
    createAdminSession(res);
    return res.status(200).json({ authenticated: true, user: { name: "Praxis-Team" }, setupRequired: false });
  } catch (error) {
    apiError(res, error);
  }
}

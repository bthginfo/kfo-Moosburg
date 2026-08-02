import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createAdminSession,
  ensureWriteOrigin,
  setPrivateResponse,
  verifyAdminPassword,
} from "../src/server/kfoAdmin";

/**
 * Backwards-compatible login endpoint. New clients use /api/admin-login.
 * A successful check now creates the same protected HttpOnly session.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: "setup_required", message: "ADMIN_PASSWORD ist noch nicht konfiguriert." });
  }
  if (!verifyAdminPassword(req.body?.password)) {
    return res.status(401).json({ error: "invalid_credentials", message: "Das Passwort ist nicht korrekt." });
  }
  createAdminSession(res);
  return res.status(200).json({ success: true });
}

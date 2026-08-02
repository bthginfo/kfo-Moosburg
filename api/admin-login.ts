import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAdminSession, ensureWriteOrigin, setPrivateResponse, verifyAdminPassword } from "../src/server/kfoAdmin.js";

const attempts = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: "setup_required", message: "ADMIN_PASSWORD ist noch nicht konfiguriert." });
  }

  const key = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const current = attempts.get(key);
  const attempt = !current || current.resetAt < now ? { count: 0, resetAt: now + 15 * 60_000 } : current;
  if (attempt.count >= 10) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000)));
    return res.status(429).json({ error: "too_many_attempts", message: "Zu viele Versuche. Bitte probieren Sie es später erneut." });
  }

  if (!verifyAdminPassword(req.body?.password)) {
    attempt.count += 1;
    attempts.set(key, attempt);
    return res.status(401).json({ error: "invalid_credentials", message: "Das Passwort ist nicht korrekt." });
  }

  attempts.delete(key);
  createAdminSession(res);
  return res.status(200).json({ authenticated: true, user: { name: "Praxis-Team" }, setupRequired: false });
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearAdminSession, ensureWriteOrigin, setPrivateResponse } from "../src/server/kfoAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;
  clearAdminSession(res);
  return res.status(200).json({ success: true });
}

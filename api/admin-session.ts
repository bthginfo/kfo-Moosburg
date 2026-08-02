import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasStoreConfiguration, isAdmin, setPrivateResponse } from "../src/server/kfoAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  return res.status(200).json({
    authenticated: isAdmin(req),
    storageConfigured: hasStoreConfiguration(),
    passwordConfigured: Boolean(process.env.ADMIN_PASSWORD),
    setupRequired: !process.env.ADMIN_PASSWORD,
    user: isAdmin(req) ? { name: "Praxis-Team" } : undefined,
  });
}

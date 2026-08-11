import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import { hasStoreConfiguration, isAdmin, missingAdminConfiguration, setPrivateResponse } from "../src/server/kfoAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const authenticated = isAdmin(req);
  const missing = missingAdminConfiguration();
  return res.status(200).json({
    authenticated,
    storageConfigured: hasStoreConfiguration(),
    passwordConfigured: Boolean(process.env.ADMIN_PASSWORD),
    setupRequired: missing.length > 0,
    missing,
    user: authenticated ? { name: "Praxis-Team" } : undefined,
  });
}

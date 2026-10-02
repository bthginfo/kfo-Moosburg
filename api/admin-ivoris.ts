import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import { apiError, requireAdmin, setPrivateResponse } from "../src/server/kfoAdmin.js";
import { getIvorisIntegrationStatus } from "../src/server/ivorisIntegration.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  try {
    return res.status(200).json(await getIvorisIntegrationStatus());
  } catch (error) {
    apiError(res, error);
  }
}

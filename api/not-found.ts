import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(404).json({ error: "not_found", message: "Diese API-Route existiert nicht." });
}

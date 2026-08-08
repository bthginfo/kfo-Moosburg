import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, ensureWriteOrigin, requireAdmin, setPrivateResponse } from "../src/server/kfoAdmin.js";
import {
  deleteScheduleEntity,
  loadSchedulingBundle,
  saveScheduleEntity,
  SchedulingError,
  type ScheduleEntity,
} from "../src/server/kfoScheduling.js";

const entities = new Set<ScheduleEntity>(["appointment", "appointmentType", "resource", "availabilityRule", "exception", "settings"]);

function entityFrom(req: VercelRequest): ScheduleEntity | null {
  const value = String(req.body?.entity || req.query.entity || "") as ScheduleEntity;
  return entities.has(value) ? value : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;

  try {
    if (req.method === "GET") return res.status(200).json(await loadSchedulingBundle());
    const entity = entityFrom(req);
    if (!entity) return res.status(400).json({ error: "invalid_entity", message: "Unbekannter Termin-Datensatz." });
    if (req.method === "POST" || req.method === "PATCH") {
      const bundle = await saveScheduleEntity(entity, req.body?.data || {});
      return res.status(req.method === "POST" ? 201 : 200).json(bundle);
    }
    if (req.method === "DELETE") {
      const bundle = await deleteScheduleEntity(entity, req.body?.id || req.query.id);
      return res.status(200).json(bundle);
    }
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    if (error instanceof SchedulingError) {
      return res.status(error.status).json({ error: error.code, code: error.code, message: error.message });
    }
    apiError(res, error);
  }
}

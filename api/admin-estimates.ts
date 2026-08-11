import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import { apiError, ensureWriteOrigin, requireAdmin, setPrivateResponse } from "../src/server/kfoAdmin.js";
import {
  archiveEstimateEntity,
  duplicateEstimate,
  EstimateError,
  importEstimateCatalog,
  importEstimatePointValues,
  importOfficialBemaCatalog,
  loadEstimateBundle,
  printEstimateHtml,
  saveCatalogItem,
  saveEstimate,
  sendEstimate,
  syncKzvbPointValues,
  updateEstimateStatus,
  type EstimateEntity,
} from "../src/server/kfoEstimates.js";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;

  try {
    if (req.method === "GET" && req.query.action === "print") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
      res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
      return res.status(200).send(await printEstimateHtml(req.query.id));
    }
    if (req.method === "GET") return res.status(200).json(await loadEstimateBundle());
    if (req.method === "POST" && req.body?.action === "status") return res.status(200).json(await updateEstimateStatus(req.body.id, req.body.status));
    if (req.method === "POST" && req.body?.action === "duplicate") return res.status(201).json(await duplicateEstimate(req.body.id));
    if (req.method === "POST" && req.body?.action === "send") return res.status(200).json(await sendEstimate(req.body.id));
    if (req.method === "POST" && req.body?.action === "importOfficialBema") return res.status(200).json(await importOfficialBemaCatalog());
    if (req.method === "POST" && req.body?.action === "importCatalog") return res.status(200).json(await importEstimateCatalog(req.body.rows));
    if (req.method === "POST" && req.body?.action === "syncPointValues") return res.status(200).json(await syncKzvbPointValues(req.body.quarter));
    if (req.method === "POST" && req.body?.action === "importPointValues") return res.status(200).json(await importEstimatePointValues(req.body.rows));
    if (req.method === "POST" || req.method === "PATCH") {
      const entity = String(req.body?.entity || "") as EstimateEntity;
      const input = req.body?.data || {};
      if (req.method === "PATCH" && !String(input?.id || "").trim()) {
        return res.status(400).json({ error: "missing_id", message: "Der zu ändernde Kostenvoranschlags-Datensatz konnte nicht identifiziert werden." });
      }
      const data = req.method === "POST" ? { ...input, id: "" } : input;
      if (entity === "estimate") return res.status(req.method === "POST" ? 201 : 200).json(await saveEstimate(data));
      if (entity === "catalogItem") return res.status(req.method === "POST" ? 201 : 200).json(await saveCatalogItem(data));
      return res.status(400).json({ error: "invalid_entity", message: "Unbekannter Kostenvoranschlags-Datensatz." });
    }
    if (req.method === "DELETE") {
      const entity = String(req.body?.entity || "") as EstimateEntity;
      if (!(["estimate", "catalogItem"] as string[]).includes(entity)) return res.status(400).json({ error: "invalid_entity" });
      return res.status(200).json(await archiveEstimateEntity(entity, req.body?.id));
    }
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    if (error instanceof EstimateError) return res.status(error.status).json({ error: error.code, code: error.code, message: error.message });
    apiError(res, error);
  }
}

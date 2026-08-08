import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, ensureWriteOrigin, requireAdmin, setPrivateResponse } from "../src/server/kfoAdmin.js";
import {
  archiveEstimateEntity,
  duplicateEstimate,
  EstimateError,
  loadEstimateBundle,
  printEstimateHtml,
  saveCatalogItem,
  saveEstimate,
  sendEstimate,
  updateEstimateStatus,
  type EstimateEntity,
} from "../src/server/kfoEstimates.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;

  try {
    if (req.method === "GET" && req.query.action === "print") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'");
      return res.status(200).send(await printEstimateHtml(req.query.id));
    }
    if (req.method === "GET") return res.status(200).json(await loadEstimateBundle());
    if (req.method === "POST" && req.body?.action === "status") return res.status(200).json(await updateEstimateStatus(req.body.id, req.body.status));
    if (req.method === "POST" && req.body?.action === "duplicate") return res.status(201).json(await duplicateEstimate(req.body.id));
    if (req.method === "POST" && req.body?.action === "send") return res.status(200).json(await sendEstimate(req.body.id));
    if (req.method === "POST" || req.method === "PATCH") {
      const entity = String(req.body?.entity || "") as EstimateEntity;
      if (entity === "estimate") return res.status(req.method === "POST" ? 201 : 200).json(await saveEstimate(req.body?.data || {}));
      if (entity === "catalogItem") return res.status(req.method === "POST" ? 201 : 200).json(await saveCatalogItem(req.body?.data || {}));
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

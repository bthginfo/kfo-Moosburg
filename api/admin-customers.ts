import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import {
  apiError,
  customerWithAppointments,
  ensureWriteOrigin,
  isValidEmail,
  loadStore,
  normalizeCustomer,
  requireAdmin,
  saveCustomerRecord,
  setPrivateResponse,
} from "../src/server/kfoAdmin.js";

function payload(req: VercelRequest) {
  return req.body?.customer || req.body || {};
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;

  try {
    const store = await loadStore();
    if (req.method === "GET") {
      const customers = store.customers
        .map((customer) => customerWithAppointments(customer, store.appointments))
        .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "de"));
      return res.status(200).json({ customers });
    }

    if (req.method === "POST" || req.method === "PATCH") {
      const input = payload(req);
      const existing = req.method === "PATCH"
        ? store.customers.find((item) => item.id === String(input.id || req.body?.id || ""))
        : undefined;
      if (req.method === "PATCH" && !existing) return res.status(404).json({ error: "not_found", message: "Kund:in wurde nicht gefunden." });
      if (input.status && !["active", "paused", "completed", "archived"].includes(input.status)) {
        return res.status(400).json({ error: "validation_error", message: "Der ausgewählte Status ist ungültig." });
      }
      const customer = normalizeCustomer(input, existing);
      if (!customer.firstName || !customer.lastName) {
        return res.status(400).json({ error: "validation_error", message: "Vorname und Nachname sind erforderlich." });
      }
      if (customer.email && !isValidEmail(customer.email)) {
        return res.status(400).json({ error: "validation_error", message: "Bitte prüfen Sie die E-Mail-Adresse." });
      }
      if (input.birthDate && !customer.birthDate) {
        return res.status(400).json({ error: "validation_error", message: "Bitte prüfen Sie das Geburtsdatum." });
      }
      const saved = await saveCustomerRecord(customer, {
        create: req.method === "POST",
        expectedUpdatedAt: input.updatedAt,
      });
      const responseStore = saved.status === "archived" ? await loadStore() : store;
      return res.status(req.method === "POST" ? 201 : 200).json({
        customer: customerWithAppointments(saved, responseStore.appointments),
      });
    }

    if (req.method === "DELETE") {
      const id = String(req.body?.id || req.query.id || "");
      const customer = store.customers.find((item) => item.id === id);
      if (!customer) return res.status(404).json({ error: "not_found", message: "Kund:in wurde nicht gefunden." });
      await saveCustomerRecord({ ...customer, status: "archived" }, {
        create: false,
        expectedUpdatedAt: req.body?.updatedAt || req.query.updatedAt,
      });
      return res.status(200).json({ success: true, archived: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

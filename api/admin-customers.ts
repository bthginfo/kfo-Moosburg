import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  apiError,
  appendEvents,
  customerWithAppointments,
  deleteEvent,
  ensureWriteOrigin,
  loadStore,
  normalizeAppointments,
  normalizeCustomer,
  requireAdmin,
  setPrivateResponse,
  upsertEvent,
} from "../src/server/kfoAdmin";

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
      const customer = normalizeCustomer(input, existing);
      if (!customer.firstName || !customer.lastName) {
        return res.status(400).json({ error: "validation_error", message: "Vorname und Nachname sind erforderlich." });
      }
      const existingAppointments = store.appointments.filter((item) => item.customerId === customer.id);
      const appointmentsProvided = Array.isArray(input.appointments);
      const appointments = appointmentsProvided
        ? normalizeAppointments(input.appointments, customer.id, existingAppointments)
        : existingAppointments;
      const events = [upsertEvent("customers", customer)];
      if (appointmentsProvided) {
        const nextIds = new Set(appointments.map((item) => item.id));
        for (const old of existingAppointments) if (!nextIds.has(old.id)) events.push(deleteEvent("appointments", old.id));
        for (const appointment of appointments) events.push(upsertEvent("appointments", appointment));
      }
      await appendEvents(events);
      return res.status(req.method === "POST" ? 201 : 200).json({ customer: { ...customer, appointments } });
    }

    if (req.method === "DELETE") {
      const id = String(req.body?.id || req.query.id || "");
      const customer = store.customers.find((item) => item.id === id);
      if (!customer) return res.status(404).json({ error: "not_found", message: "Kund:in wurde nicht gefunden." });
      const events = [deleteEvent("customers", id)];
      for (const appointment of store.appointments.filter((item) => item.customerId === id)) {
        events.push(deleteEvent("appointments", appointment.id));
      }
      for (const reminder of store.reminders.filter((item) => item.customerIds.includes(id))) {
        events.push(upsertEvent("reminders", { ...reminder, customerIds: reminder.customerIds.filter((customerId) => customerId !== id), updatedAt: new Date().toISOString() }));
      }
      await appendEvents(events);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

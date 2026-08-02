import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  apiError,
  appendEvents,
  ensureWriteOrigin,
  loadStore,
  normalizeAppointments,
  normalizeCustomer,
  requireAdmin,
  setPrivateResponse,
  upsertEvent,
} from "../src/server/kfoAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ensureWriteOrigin(req, res)) return;

  const rows = Array.isArray(req.body?.customers) ? req.body.customers : Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({ error: "validation_error", message: "Die Importdatei enthält keine Kundendaten." });
  if (rows.length > 1000) return res.status(413).json({ error: "too_many_rows", message: "Bitte importieren Sie höchstens 1.000 Zeilen auf einmal." });

  try {
    const store = await loadStore();
    const strategy = ["skip", "update", "create"].includes(req.body?.duplicateStrategy) ? req.body.duplicateStrategy : "skip";
    const events: ReturnType<typeof upsertEvent>[] = [];
    const result = { imported: 0, updated: 0, skipped: 0, errors: [] as { row: number; message: string }[] };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const candidate = normalizeCustomer(row);
      if (!candidate.firstName || !candidate.lastName) {
        result.errors.push({ row: index + 2, message: "Vorname oder Nachname fehlt." });
        continue;
      }
      const duplicate = store.customers.find((item) =>
        (candidate.patientNumber && item.patientNumber === candidate.patientNumber) ||
        (candidate.email && item.email === candidate.email && (!candidate.birthDate || item.birthDate === candidate.birthDate)),
      );
      if (duplicate && strategy === "skip") {
        result.skipped += 1;
        continue;
      }
      const customer = normalizeCustomer(row, duplicate && strategy === "update" ? duplicate : undefined);
      events.push(upsertEvent("customers", customer));
      const appointments = normalizeAppointments(row.appointments || (row.appointmentDate ? [{
        date: row.appointmentDate,
        time: row.appointmentTime,
        type: row.appointmentType,
      }] : []), customer.id, store.appointments.filter((item) => item.customerId === customer.id));
      for (const appointment of appointments) events.push(upsertEvent("appointments", appointment));
      if (duplicate && strategy === "update") {
        Object.assign(duplicate, customer);
        result.updated += 1;
      } else {
        store.customers.push(customer);
        result.imported += 1;
      }
    }

    await appendEvents(events);
    return res.status(200).json(result);
  } catch (error) {
    apiError(res, error);
  }
}

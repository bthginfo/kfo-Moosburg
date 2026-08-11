import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import {
  apiError,
  ensureWriteOrigin,
  isValidEmail,
  loadStore,
  normalizeAppointments,
  normalizeCustomer,
  requireAdmin,
  setPrivateResponse,
} from "../src/server/kfoAdmin.js";
import {
  importCustomersWithScheduleAppointments,
  SchedulingError,
} from "../src/server/kfoScheduling.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function validDate(value: unknown): boolean {
  const date = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function validTime(value: unknown): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text(value));
}

function appointmentInputs(row: any): any[] {
  if (Array.isArray(row?.appointments)) return row.appointments;
  return row?.appointmentDate || row?.appointmentTime
    ? [{ date: row.appointmentDate, time: row.appointmentTime, type: row.appointmentType }]
    : [];
}

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
    const customersToSave = [] as ReturnType<typeof normalizeCustomer>[];
    const appointmentsToSave = [] as ReturnType<typeof normalizeAppointments>;
    const appointmentRows = new Map<string, number>();
    const result = { imported: 0, updated: 0, skipped: 0, errors: [] as { row: number; message: string }[] };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const candidate = normalizeCustomer(row);
      if (!candidate.firstName || !candidate.lastName) {
        result.errors.push({ row: index + 2, message: "Vorname oder Nachname fehlt." });
        continue;
      }
      if (candidate.email && !isValidEmail(candidate.email)) {
        result.errors.push({ row: index + 2, message: "Die E-Mail-Adresse ist ungültig." });
        continue;
      }
      if (row?.birthDate && !candidate.birthDate) {
        result.errors.push({ row: index + 2, message: "Das Geburtsdatum ist ungültig." });
        continue;
      }
      if (row?.status && !["active", "paused", "completed", "archived"].includes(row.status)) {
        result.errors.push({ row: index + 2, message: "Der Kundenstatus ist ungültig." });
        continue;
      }
      const rawAppointments = appointmentInputs(row);
      if (rawAppointments.length > 20) {
        result.errors.push({ row: index + 2, message: "Pro Person können höchstens 20 Termine importiert werden." });
        continue;
      }
      const invalidAppointment = rawAppointments.find((appointment) =>
        !validDate(appointment?.date ?? appointment?.appointmentDate)
        || !validTime(appointment?.time ?? appointment?.appointmentTime),
      );
      if (invalidAppointment) {
        result.errors.push({ row: index + 2, message: "Termindatum oder Uhrzeit fehlt oder ist ungültig." });
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
      if (duplicate && strategy === "create" && candidate.patientNumber && duplicate.patientNumber === candidate.patientNumber) {
        result.errors.push({ row: index + 2, message: "Die Patientennummer ist bereits vergeben; der Datensatz wurde nicht doppelt angelegt." });
        continue;
      }
      const customer = normalizeCustomer(row, duplicate && strategy === "update" ? duplicate : undefined);
      customersToSave.push(customer);
      const appointments = normalizeAppointments(rawAppointments, customer.id);
      for (const appointment of appointments) {
        appointmentsToSave.push(appointment);
        appointmentRows.set(appointment.id, index + 2);
      }
      if (duplicate && strategy === "update") {
        Object.assign(duplicate, customer);
        result.updated += 1;
      } else {
        store.customers.push(customer);
        result.imported += 1;
      }
    }

    const importResult = await importCustomersWithScheduleAppointments(customersToSave, appointmentsToSave);
    for (const appointmentId of importResult.skippedAppointmentIds) {
      result.errors.push({
        row: appointmentRows.get(appointmentId) || 0,
        message: "Der Termin überschneidet sich mit einem bereits vorhandenen aktiven Termin und wurde nicht doppelt angelegt.",
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof SchedulingError) {
      return res.status(error.status).json({ error: error.code, code: error.code, message: error.message });
    }
    apiError(res, error);
  }
}

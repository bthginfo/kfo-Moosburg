import type { VercelRequest, VercelResponse } from "../src/server/vercelTypes.js";
import {
  apiError,
  deleteReminderRecord,
  ensureWriteOrigin,
  loadStore,
  normalizeReminder,
  requireAdmin,
  saveReminderRecord,
  setPrivateResponse,
} from "../src/server/kfoAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!requireAdmin(req, res)) return;
  if (!ensureWriteOrigin(req, res)) return;

  try {
    const store = await loadStore();
    if (req.method === "GET") {
      const sentByRule = new Map<string, number>();
      for (const delivery of store.deliveries) if (delivery.status === "sent") sentByRule.set(delivery.reminderId, (sentByRule.get(delivery.reminderId) || 0) + 1);
      return res.status(200).json({
        reminders: store.reminders.map((item) => ({
          ...item,
          days: Math.abs(item.offsetDays),
          relation: item.offsetDays > 0 ? "after" : "before",
          sentCount: sentByRule.get(item.id) || 0,
        })),
        recentDeliveries: store.deliveries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 500),
      });
    }

    if (req.method === "POST" || req.method === "PATCH") {
      const input = req.body?.reminder || req.body || {};
      const existing = req.method === "PATCH" ? store.reminders.find((item) => item.id === String(input.id || "")) : undefined;
      if (req.method === "PATCH" && !existing) return res.status(404).json({ error: "not_found", message: "Erinnerung wurde nicht gefunden." });
      const reminder = normalizeReminder(input, existing);
      if (!reminder.name || !reminder.subject || !reminder.body) {
        return res.status(400).json({ error: "validation_error", message: "Name, Betreff und Nachricht sind erforderlich." });
      }
      if (reminder.audience === "selected" && reminder.customerIds.length === 0) {
        return res.status(400).json({ error: "validation_error", message: "Bitte wählen Sie mindestens eine Kundin oder einen Kunden aus." });
      }
      if (reminder.audience === "selected") {
        const existingCustomerIds = new Set(store.customers.map((item) => item.id));
        if (reminder.customerIds.some((id) => !existingCustomerIds.has(id))) {
          return res.status(400).json({ error: "validation_error", message: "Mindestens eine ausgewählte Person existiert nicht mehr. Bitte laden Sie die Seite neu." });
        }
      }
      const saved = await saveReminderRecord(reminder, {
        create: req.method === "POST",
        expectedUpdatedAt: input.updatedAt,
      });
      return res.status(req.method === "POST" ? 201 : 200).json({
        reminder: { ...saved, days: Math.abs(saved.offsetDays), relation: saved.offsetDays > 0 ? "after" : "before" },
      });
    }

    if (req.method === "DELETE") {
      const id = String(req.body?.id || req.query.id || "");
      if (!store.reminders.some((item) => item.id === id)) return res.status(404).json({ error: "not_found" });
      await deleteReminderRecord(id, req.body?.updatedAt || req.query.updatedAt);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

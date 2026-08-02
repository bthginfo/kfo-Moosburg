import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  apiError,
  appendEvents,
  deleteEvent,
  ensureWriteOrigin,
  loadStore,
  normalizeReminder,
  requireAdmin,
  setPrivateResponse,
  upsertEvent,
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
        recentDeliveries: store.deliveries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 100),
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
      await appendEvents([upsertEvent("reminders", reminder)]);
      return res.status(req.method === "POST" ? 201 : 200).json({
        reminder: { ...reminder, days: Math.abs(reminder.offsetDays), relation: reminder.offsetDays > 0 ? "after" : "before" },
      });
    }

    if (req.method === "DELETE") {
      const id = String(req.body?.id || req.query.id || "");
      if (!store.reminders.some((item) => item.id === id)) return res.status(404).json({ error: "not_found" });
      await appendEvents([deleteEvent("reminders", id)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    apiError(res, error);
  }
}

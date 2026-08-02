import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  addDays,
  apiError,
  appendEvents,
  buildTransport,
  dateInTimezone,
  deliveryId,
  isAdmin,
  loadStore,
  reminderHtml,
  renderTemplate,
  setPrivateResponse,
  upsertEvent,
  type DeliveryLog,
} from "../../src/server/kfoAdmin.js";

function cronAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && req.headers.authorization === `Bearer ${cronSecret}`);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "method_not_allowed" });
  if (!cronAuthorized(req) && !isAdmin(req)) return res.status(401).json({ error: "unauthorized" });

  try {
    const store = await loadStore();
    const settings = store.settings.find((item) => item.id === "smtp");
    if (!settings) return res.status(409).json({ error: "smtp_not_configured", message: "SMTP ist noch nicht eingerichtet." });

    const today = dateInTimezone(settings.timezone || "Europe/Berlin");
    const maxPerRun = Math.max(1, Math.min(500, Number(process.env.MAX_REMINDERS_PER_RUN) || 100));
    const customers = new Map(store.customers.map((item) => [item.id, item]));
    const deliveries = new Map(store.deliveries.map((item) => [item.id, item]));
    const queue: { rule: (typeof store.reminders)[number]; appointment: (typeof store.appointments)[number]; customer: (typeof store.customers)[number]; id: string }[] = [];

    for (const rule of store.reminders.filter((item) => item.enabled)) {
      for (const appointment of store.appointments) {
        if (appointment.status === "cancelled" || addDays(appointment.date, rule.offsetDays) !== today) continue;
        const customer = customers.get(appointment.customerId);
        if (!customer || customer.status !== "active" || !customer.emailConsent || !customer.email) continue;
        if (rule.audience === "selected" && !rule.customerIds.includes(customer.id)) continue;
        const id = deliveryId(rule.id, appointment.id, today);
        const prior = deliveries.get(id);
        if (prior?.status === "sent") continue;
        if (prior?.status === "processing" && Date.now() - new Date(prior.updatedAt).getTime() < 30 * 60_000) continue;
        queue.push({ rule, appointment, customer, id });
      }
    }

    const transport = buildTransport(settings);
    await transport.verify();
    const summary = { date: today, queued: queue.length, sent: 0, failed: 0, deferred: Math.max(0, queue.length - maxPerRun), errors: [] as { customerId: string; message: string }[] };

    for (const item of queue.slice(0, maxPerRun)) {
      const processing: DeliveryLog = {
        id: item.id,
        reminderId: item.rule.id,
        appointmentId: item.appointment.id,
        customerId: item.customer.id,
        recipient: item.customer.email,
        scheduledDate: today,
        status: "processing",
        sentAt: "",
        error: "",
        updatedAt: new Date().toISOString(),
      };
      await appendEvents([upsertEvent("deliveries", processing)]);
      try {
        const subject = renderTemplate(item.rule.subject, item.customer, item.appointment);
        const body = renderTemplate(item.rule.body, item.customer, item.appointment);
        await transport.sendMail({
          from: { name: settings.fromName, address: settings.fromEmail },
          to: item.customer.email,
          replyTo: settings.replyTo || undefined,
          subject,
          text: body,
          html: reminderHtml(body),
        });
        await appendEvents([upsertEvent("deliveries", {
          ...processing,
          status: "sent",
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })]);
        summary.sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unbekannter Versandfehler";
        await appendEvents([upsertEvent("deliveries", {
          ...processing,
          status: "failed",
          error: message,
          updatedAt: new Date().toISOString(),
        })]);
        summary.failed += 1;
        summary.errors.push({ customerId: item.customer.id, message });
      }
    }

    return res.status(summary.failed ? 207 : 200).json(summary);
  } catch (error) {
    apiError(res, error);
  }
}

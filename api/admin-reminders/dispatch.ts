import type { VercelRequest, VercelResponse } from "../../src/server/vercelTypes.js";
import {
  addDays,
  apiError,
  buildTransport,
  claimReminderDelivery,
  dateInTimezone,
  deliveryId,
  ensureWriteOrigin,
  finishReminderDelivery,
  isValidEmail,
  loadStore,
  quarantineStaleReminderDeliveries,
  revalidateClaimedReminderDelivery,
  renderTemplate,
  requireAdmin,
  setPrivateResponse,
  type DeliveryLog,
} from "../../src/server/kfoAdmin.js";
import { practiceMail } from "../../src/server/kfoMail.js";

export const maxDuration = 60;

function cronAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && req.headers.authorization === `Bearer ${cronSecret}`);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponse(res);
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "method_not_allowed" });
  const cron = cronAuthorized(req);
  if (req.method === "GET" && !cron) return res.status(401).json({ error: "unauthorized" });
  if (req.method === "POST" && !cron) {
    if (!requireAdmin(req, res)) return;
    if (!ensureWriteOrigin(req, res)) return;
  }

  try {
    const quarantined = await quarantineStaleReminderDeliveries(30);
    const store = await loadStore();
    const settings = store.settings.find((item) => item.id === "smtp");
    if (!settings) return res.status(409).json({ error: "smtp_not_configured", message: "SMTP ist noch nicht eingerichtet." });

    const today = dateInTimezone(settings.timezone || "Europe/Berlin");
    const maxPerRun = Math.max(1, Math.min(100, Number(process.env.MAX_REMINDERS_PER_RUN) || 25));
    const graceDays = Math.max(0, Math.min(30, Number(process.env.REMINDER_GRACE_DAYS) || 7));
    const customers = new Map(store.customers.map((item) => [item.id, item]));
    const deliveries = new Map(store.deliveries.map((item) => [item.id, item]));
    const queue: { rule: (typeof store.reminders)[number]; appointment: (typeof store.appointments)[number]; customer: (typeof store.customers)[number]; id: string; dueDate: string }[] = [];

    for (const rule of store.reminders.filter((item) => item.enabled)) {
      for (const appointment of store.appointments) {
        if (!["scheduled", "confirmed"].includes(appointment.status)) continue;
        const dueDate = addDays(appointment.date, rule.offsetDays);
        if (dueDate > today || addDays(dueDate, graceDays) < today) continue;
        const customer = customers.get(appointment.customerId);
        if (!customer || customer.status !== "active" || !customer.emailConsent || !customer.email) continue;
        if (rule.audience === "selected" && !rule.customerIds.includes(customer.id)) continue;
        const id = deliveryId(rule.id, appointment.id, dueDate);
        const prior = deliveries.get(id);
        if (prior && prior.status !== "failed") continue;
        queue.push({ rule, appointment, customer, id, dueDate });
      }
    }

    const transport = buildTransport(settings);
    await transport.verify();
    const summary = {
      date: today,
      queued: queue.length,
      claimed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      quarantined,
      deferred: Math.max(0, queue.length - maxPerRun),
    };

    for (const item of queue.slice(0, maxPerRun)) {
      const processing: DeliveryLog = {
        id: item.id,
        reminderId: item.rule.id,
        appointmentId: item.appointment.id,
        customerId: item.customer.id,
        recipient: item.customer.email,
        scheduledDate: item.dueDate,
        status: "processing",
        sentAt: "",
        error: "",
        updatedAt: new Date().toISOString(),
      };
      const claimToken = await claimReminderDelivery(processing);
      if (!claimToken) continue;
      summary.claimed += 1;
      const current = await revalidateClaimedReminderDelivery(item.id, claimToken, today, graceDays);
      if (!current) {
        await finishReminderDelivery(item.id, claimToken, {
          status: "failed",
          error: "Nicht versendet: Einwilligung, Regel, Zielgruppe, Termin oder Empfängeradresse wurde vor dem Versand geändert.",
        });
        summary.skipped += 1;
        continue;
      }
      if (!isValidEmail(current.customer.email)) {
        await finishReminderDelivery(current.deliveryId, current.claimToken, {
          status: "failed",
          error: "Nicht versendet: Die aktuell hinterlegte Empfängeradresse ist ungültig.",
        });
        summary.skipped += 1;
        continue;
      }
      try {
        const subject = renderTemplate(current.rule.subject, current.customer, current.appointment);
        const body = renderTemplate(current.rule.body, current.customer, current.appointment);
        const mail = practiceMail({ subject, body, eyebrow: "Terminerinnerung" });
        await transport.sendMail({
          from: { name: settings.fromName, address: settings.fromEmail },
          to: current.customer.email,
          replyTo: settings.replyTo || undefined,
          subject,
          text: mail.text,
          html: mail.html,
        });
        const finalized = await finishReminderDelivery(current.deliveryId, current.claimToken, { status: "sent" });
        if (finalized) summary.sent += 1;
        else summary.failed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unbekannter Versandfehler";
        await finishReminderDelivery(current.deliveryId, current.claimToken, { status: "failed", error: message });
        summary.failed += 1;
      }
    }

    return res.status(summary.failed ? 207 : 200).json(summary);
  } catch (error) {
    apiError(res, error);
  }
}

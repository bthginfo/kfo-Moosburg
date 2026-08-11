import { ANAMNESIS_CTA, PRACTICE } from "../config/practice.js";

export interface PracticeMailCta {
  label: string;
  url: string;
}

export interface PracticeMailInput {
  subject: string;
  greeting?: string;
  body: string;
  cta?: PracticeMailCta;
  eyebrow?: string;
  notice?: string;
}

export function escapeMailHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function trustedCtaUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function practiceMail(input: PracticeMailInput): { html: string; text: string } {
  const greeting = input.greeting?.trim() || "Guten Tag,";
  const ctaUrl = input.cta ? trustedCtaUrl(input.cta.url) : "";
  const bodyHtml = escapeMailHtml(input.body.trim()).replace(/\r?\n/g, "<br>");
  const noticeHtml = input.notice?.trim()
    ? `<div style="margin-top:24px;padding:14px 16px;border-left:4px solid #f58a07;background:#fff8eb;color:#4b6170;font-size:13px;line-height:1.6">${escapeMailHtml(input.notice.trim()).replace(/\r?\n/g, "<br>")}</div>`
    : "";
  const ctaHtml = input.cta && ctaUrl
    ? `<div style="margin:26px 0 8px"><a href="${escapeMailHtml(ctaUrl)}" style="display:inline-block;border-radius:10px;background:#f58a07;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px">${escapeMailHtml(input.cta.label)}</a></div>`
    : "";
  const signatureText = `${PRACTICE.name}\n${PRACTICE.doctors}\n${PRACTICE.addressLine1}, ${PRACTICE.addressLine2}\nTelefon ${PRACTICE.phone}\n${PRACTICE.email}\n${PRACTICE.website}`;
  const text = [
    greeting,
    input.body.trim(),
    input.cta && ctaUrl ? `${input.cta.label}: ${ctaUrl}` : "",
    input.notice?.trim() || "",
    "Viele Grüße",
    "Ihr Praxisteam",
    signatureText,
  ].filter(Boolean).join("\n\n");

  return {
    text,
    html: `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#edf7ff;padding:24px 12px"><div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #d8e6ee;border-radius:18px;background:#fff;font-family:Arial,sans-serif;color:#173249"><div style="background:#063255;padding:22px 28px;color:#fff"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#b9d8ea">${escapeMailHtml(input.eyebrow?.trim() || PRACTICE.doctors)}</div><div style="margin-top:5px;font-size:20px;font-weight:800">KFO <span style="color:#f58a07">Moosburg</span></div></div><div style="padding:30px 28px;font-size:15px;line-height:1.75"><p style="margin:0 0 18px">${escapeMailHtml(greeting)}</p><div>${bodyHtml}</div>${ctaHtml}${noticeHtml}<p style="margin:28px 0 0">Viele Grüße<br><strong>Ihr Praxisteam</strong></p></div><div style="border-top:1px solid #dceaf2;background:#f8fbfd;padding:20px 28px;color:#536b7a;font-size:12px;line-height:1.65"><strong style="color:#173249">${PRACTICE.name}</strong> · ${PRACTICE.doctors}<br>${PRACTICE.addressLine1} · ${PRACTICE.addressLine2}<br>Telefon <a href="tel:+4987617222750" style="color:#315f7b">${PRACTICE.phone}</a> · <a href="mailto:${PRACTICE.email}" style="color:#315f7b">${PRACTICE.email}</a><br><a href="${PRACTICE.website}" style="color:#315f7b">www.kfo-moosburg.de</a><div style="margin-top:10px;color:#718692">Diese E-Mail wurde von der Praxisverwaltung der KFO Moosburg versendet. Bitte antworten Sie bei Rückfragen direkt auf diese Nachricht.</div></div></div></body></html>`,
  };
}

export function bookingConfirmationMail(input: {
  greeting: string;
  dateLabel: string;
  timeLabel: string;
  appointmentType?: string;
  includeAnamnesisCta?: boolean;
}): { html: string; text: string } {
  const details = [input.dateLabel, input.timeLabel, input.appointmentType].filter(Boolean).join(" · ");
  return practiceMail({
    subject: "Ihre Terminbestätigung der KFO Moosburg",
    greeting: input.greeting,
    eyebrow: "Terminbestätigung",
    body: `vielen Dank für Ihre Terminbuchung. Wir haben folgenden Termin für Sie reserviert:\n\n${details}`,
    cta: input.includeAnamnesisCta ? { label: ANAMNESIS_CTA.label, url: ANAMNESIS_CTA.url } : undefined,
    notice: input.includeAnamnesisCta ? ANAMNESIS_CTA.supportingText : undefined,
  });
}

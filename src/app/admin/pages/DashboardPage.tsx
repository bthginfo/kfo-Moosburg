import { Link } from "react-router";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  MailCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AdminShell, InlineLink } from "../AdminShell";
import type { Customer, ReminderRule } from "../types";

type Props = {
  customers: Customer[];
  reminders: ReminderRule[];
  onLoggedOut: () => void;
  onAddCustomer: () => void;
};

function berlinToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
}

function formatDate(value: string, withYear = true) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(date);
}

export function DashboardPage({ customers, reminders, onLoggedOut, onAddCustomer }: Props) {
  const today = berlinToday();
  const appointments = customers.flatMap((customer) => customer.appointments.map((appointment) => ({ customer, appointment })))
    .filter(({ appointment }) => appointment.date >= today)
    .sort((a, b) => `${a.appointment.date}${a.appointment.time}`.localeCompare(`${b.appointment.date}${b.appointment.time}`));
  const todayAppointments = appointments.filter(({ appointment }) => appointment.date === today);
  const enabledRules = reminders.filter((rule) => rule.enabled);
  const eligibleCustomers = customers.filter((customer) => customer.status === "active" && customer.reminderConsent && customer.email);
  const dueToday = getScheduledSends(customers, enabledRules).filter((item) => item.date === today);
  const activeCustomers = customers.filter((customer) => customer.status === "active").length;
  const greeting = new Date().getHours() < 11 ? "Guten Morgen" : new Date().getHours() < 17 ? "Guten Tag" : "Guten Abend";
  const longDate = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date());

  return (
    <AdminShell
      title={`${greeting}, Praxisteam`}
      eyebrow={longDate}
      description="Hier sehen Sie, was heute ansteht und welche Erinnerungen als Nächstes versendet werden."
      onLoggedOut={onLoggedOut}
      action={<button onClick={onAddCustomer} className="admin-primary-button h-[43px] w-full sm:w-auto"><UserPlus className="h-[18px] w-[18px]" />Kund:in anlegen</button>}
    >
      {customers.length === 0 ? (
        <Onboarding />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Kennzahlen">
            <Metric icon={UsersRound} label="Aktive Kund:innen" value={activeCustomers} detail={`${customers.length} insgesamt`} tone="navy" />
            <Metric icon={CalendarDays} label="Kommende Termine" value={appointments.length} detail={`${todayAppointments.length} heute`} tone="blue" />
            <Metric icon={BellRing} label="Heute fällig" value={dueToday.length} detail={dueToday.length ? "Versand vorbereitet" : "Alles erledigt"} tone={dueToday.length ? "orange" : "green"} />
            <Metric icon={MailCheck} label="Versandbereit" value={eligibleCustomers.length} detail={`${enabledRules.length} aktive Regeln`} tone="green" />
          </section>

          <TodayBand appointments={todayAppointments.slice(0, 3)} dueToday={dueToday.length} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.78fr)]">
            <section className="admin-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#deebf3] px-5 py-4 sm:px-6">
                <div><h2 className="!text-[17px] !font-semibold !text-[#173249]">Nächste Erinnerungen</h2><p className="mt-1 !text-[12px] !font-normal !text-[#6c8291]">Automatisch nach Termin und Regel geplant</p></div>
                <InlineLink to="/verwaltung/erinnerungen">Alle Regeln</InlineLink>
              </div>
              {getScheduledSends(customers, enabledRules).length ? (
                <div className="divide-y divide-[#e4edf3]">
                  {getScheduledSends(customers, enabledRules).slice(0, 5).map((item) => (
                    <div key={item.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#f8fbfd] sm:grid-cols-[minmax(160px,1fr)_minmax(150px,.8fr)_auto] sm:items-center sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#e9f3f9] text-xs font-semibold text-[#063255]">{item.initials}</span>
                        <div className="min-w-0"><div className="truncate text-[13px] font-semibold text-[#173249]">{item.name}</div><div className="truncate text-[11px] text-[#708491]">{item.email}</div></div>
                      </div>
                      <div><div className="text-[12px] font-medium text-[#34546b]">{item.rule}</div><div className="mt-0.5 text-[11px] text-[#738896]">Termin: {formatDate(item.appointmentDate)}</div></div>
                      <div className="justify-self-start rounded-[9px] bg-[#fff2df] px-2.5 py-1.5 text-[11px] font-semibold text-[#9a5906] sm:justify-self-end">{item.date === today ? "Heute" : formatDate(item.date, false)}</div>
                    </div>
                  ))}
                </div>
              ) : <EmptyQueue />}
            </section>

            <section className="admin-surface p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><h2 className="!text-[17px] !font-semibold !text-[#173249]">Schnell erledigt</h2><span className="text-[11px] font-medium text-[#7790a0]">Praxis-Setup</span></div>
              <div className="space-y-2">
                <QuickAction to="/verwaltung/kunden" icon={UsersRound} label="Kund:innen verwalten" meta={`${customers.length} Einträge`} done={customers.length > 0} />
                <QuickAction to="/verwaltung/erinnerungen" icon={BellRing} label="Erinnerung einrichten" meta={`${enabledRules.length} aktiv`} done={enabledRules.length > 0} />
                <QuickAction to="/verwaltung/einstellungen" icon={MailCheck} label="E-Mail-Versand prüfen" meta="SMTP-Einstellungen" />
              </div>
              <div className="mt-5 rounded-[12px] bg-[#eef7fc] px-4 py-3.5">
                <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-[17px] w-[17px] shrink-0 text-[#32698c]" /><p className="!text-[12px] !font-normal !leading-5 !text-[#466477]">Automatische Versände laufen täglich nach deutscher Ortszeit. Nur Kund:innen mit Einwilligung erhalten Erinnerungen.</p></div>
              </div>
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof UsersRound; label: string; value: number; detail: string; tone: "navy" | "blue" | "orange" | "green" }) {
  const tones = { navy: "bg-[#e6f0f6] text-[#063255]", blue: "bg-[#e1f3fb] text-[#246581]", orange: "bg-[#fff0dc] text-[#a95e05]", green: "bg-[#e5f5ec] text-[#267153]" };
  return <div className="admin-surface min-w-0 p-4 sm:p-5"><div className="mb-5 flex items-start justify-between gap-2"><span className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${tones[tone]}`}><Icon className="h-[18px] w-[18px]" /></span><span className="hidden text-[10px] font-medium uppercase tracking-[.08em] text-[#89a0af] sm:block">Live</span></div><div className="text-[25px] font-semibold leading-none tracking-[-.03em] text-[#102d44] sm:text-[28px]">{value}</div><div className="mt-2 text-[12px] font-semibold text-[#365369] sm:text-[13px]">{label}</div><div className="mt-1 truncate text-[10px] text-[#788d9a] sm:text-[11px]">{detail}</div></div>;
}

function TodayBand({ appointments, dueToday }: { appointments: Array<{ customer: Customer; appointment: Customer["appointments"][number] }>; dueToday: number }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#174b70] bg-[#063255] text-white shadow-[0_10px_26px_rgba(6,50,85,.12)]">
      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="border-b border-white/10 px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
          <div className="admin-kicker !text-[#91b3c7]">Heute im Blick</div>
          <div className="mt-2 text-[18px] font-semibold">Der Tag auf einer Linie</div>
          <div className="mt-1 text-[11px] text-[#a9c3d2]">Termine &amp; automatische Aufgaben</div>
        </div>
        <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <TimelineItem time="Vormittag" title={appointments[0] ? `${appointments[0].appointment.time} · ${appointments[0].customer.firstName} ${appointments[0].customer.lastName}` : "Keine offenen Termine"} note={appointments[0]?.appointment.type ?? "Zeit für Organisatorisches"} active={Boolean(appointments[0])} />
          <TimelineItem time="Tagesversand" title={dueToday ? `${dueToday} Erinnerung${dueToday === 1 ? "" : "en"} fällig` : "Keine Erinnerung fällig"} note={dueToday ? "Automatisch eingeplant" : "Alles auf dem aktuellen Stand"} active={Boolean(dueToday)} orange={Boolean(dueToday)} />
          <TimelineItem time="Danach" title={appointments[1] ? `${appointments[1].appointment.time} · ${appointments[1].customer.firstName} ${appointments[1].customer.lastName}` : "Freier Zeitraum"} note={appointments[1]?.appointment.type ?? "Keine Aufgabe geplant"} active={Boolean(appointments[1])} />
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ time, title, note, active, orange }: { time: string; title: string; note: string; active?: boolean; orange?: boolean }) {
  return <div className="relative px-5 py-5"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8eafc2]"><span className={`h-2 w-2 rounded-full ${orange ? "bg-[#f58a07]" : active ? "bg-[#73c4a3]" : "bg-white/25"}`} />{time}</div><div className="mt-3 text-[13px] font-semibold text-white">{title}</div><div className="mt-1 text-[11px] text-[#a9c3d2]">{note}</div></div>;
}

function QuickAction({ to, icon: Icon, label, meta, done }: { to: string; icon: typeof UsersRound; label: string; meta: string; done?: boolean }) {
  return <Link to={to} className="group flex items-center gap-3 rounded-[12px] border border-[#e1eaf0] px-3 py-3 transition hover:border-[#b7cbd8] hover:bg-[#f8fbfd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eaf4fa] text-[#164e73]"><Icon className="h-[17px] w-[17px]" /></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#25445b]">{label}</span><span className="block text-[10px] text-[#778c99]">{meta}</span></span>{done ? <CheckCircle2 className="h-[17px] w-[17px] text-[#3a8a67]" /> : <ChevronRight className="h-4 w-4 text-[#8297a5] transition group-hover:translate-x-0.5 group-hover:text-[#063255]" />}</Link>;
}

function EmptyQueue() { return <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><Clock3 className="h-8 w-8 text-[#8cabbf]" /><h3 className="mt-3 !text-[14px] !font-semibold !text-[#29465c]">Noch kein Versand geplant</h3><p className="mt-1 max-w-sm !text-[12px] !font-normal !leading-5 !text-[#728895]">Legen Sie eine aktive Regel an und erfassen Sie Termine. Die nächsten Erinnerungen erscheinen dann automatisch hier.</p></div>; }

function Onboarding() {
  return <section className="admin-surface overflow-hidden"><div className="grid lg:grid-cols-[1.15fr_.85fr]"><div className="px-6 py-9 sm:px-10 sm:py-11"><span className="admin-kicker">In drei Schritten startklar</span><h2 className="mt-3 !text-[22px] !font-semibold !leading-tight !text-[#173249]">Willkommen in Ihrer neuen Praxisverwaltung</h2><p className="mt-3 max-w-xl !text-[13px] !font-normal !leading-6 !text-[#5e7585]">Beginnen Sie mit Ihrer Patientenliste. Danach richten Sie eine Erinnerungsregel und den sicheren E-Mail-Versand ein.</p><Link to="/verwaltung/kunden" className="admin-primary-button mt-6 h-11">Erste Kund:innen anlegen<ArrowRight className="h-4 w-4" /></Link></div><div className="border-t border-[#dce8ef] bg-[#f6fbfe] p-6 lg:border-l lg:border-t-0 lg:p-8"><ol className="space-y-4"><OnboardingStep number="1" title="Kund:innen hinzufügen" text="Manuell oder bequem als Liste importieren" /><OnboardingStep number="2" title="Erinnerung formulieren" text="Zeitpunkt und Empfänger:innen festlegen" /><OnboardingStep number="3" title="E-Mail verbinden" text="Praxis-SMTP sicher hinterlegen und testen" /></ol></div></div></section>;
}

function OnboardingStep({ number, title, text }: { number: string; title: string; text: string }) { return <li className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#063255] text-xs font-semibold text-white">{number}</span><div><div className="text-[13px] font-semibold text-[#234159]">{title}</div><div className="mt-0.5 text-[11px] leading-5 text-[#738895]">{text}</div></div></li>; }

function getScheduledSends(customers: Customer[], rules: ReminderRule[]) {
  const today = berlinToday();
  const results: Array<{ id: string; name: string; initials: string; email: string; rule: string; date: string; appointmentDate: string }> = [];
  for (const customer of customers) {
    if (!customer.reminderConsent || !customer.email || customer.status !== "active") continue;
    for (const appointment of customer.appointments) {
      for (const rule of rules) {
        if (rule.audience === "selected" && !rule.customerIds.includes(customer.id)) continue;
        const date = new Date(`${appointment.date}T12:00:00`);
        date.setDate(date.getDate() + (rule.relation === "before" ? -rule.days : rule.days));
        const sendDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(date);
        if (sendDate < today) continue;
        results.push({ id: `${customer.id}-${appointment.id ?? appointment.date}-${rule.id}`, name: `${customer.firstName} ${customer.lastName}`, initials: `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`, email: customer.email, rule: rule.name, date: sendDate, appointmentDate: appointment.date });
      }
    }
  }
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  CloudOff,
  Edit3,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "../AdminShell";
import { adminApi } from "../api";
import {
  AppointmentDialog,
  AppointmentTypeDialog,
  AvailabilityRuleDialog,
  DeleteConfirmDialog,
  ExceptionDialog,
  ResourceDialog,
} from "../components/ScheduleDialogs";
import { SchedulePlanner } from "../components/SchedulePlanner";
import type {
  AppointmentType,
  AvailabilityException,
  AvailabilityRule,
  BookingSettings,
  Customer,
  ScheduleAppointment,
  ScheduleAppointmentStatus,
  ScheduleBundle,
  ScheduleEntity,
  ScheduleResource,
} from "../types";

type Tab = "plan" | "online" | "settings";
type DeleteTarget = { entity: ScheduleEntity; id: string; updatedAt?: string; title: string; description: string };
type Props = { customers: Customer[]; onLoggedOut: () => void };

const weekdayLabels = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function SchedulePage({ customers, onLoggedOut }: Props) {
  const [bundle, setBundle] = useState<ScheduleBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("plan");
  const [selectedDate, setSelectedDate] = useState(todayBerlin());
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<ScheduleAppointment | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [editingException, setEditingException] = useState<AvailabilityException | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ScheduleResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setBundle(normalizeBundle(await adminApi.schedule())); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Die Terminplanung konnte nicht geladen werden."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveEntity(entity: ScheduleEntity, data: Record<string, unknown>, successMessage: string) {
    const response = await adminApi.saveScheduleEntity(entity, data);
    setBundle(normalizeBundle(response));
    toast.success(successMessage);
  }

  async function deleteEntity() {
    if (!deleteTarget) return;
    const response = await adminApi.deleteScheduleEntity(deleteTarget.entity, deleteTarget.id, deleteTarget.updatedAt);
    setBundle(normalizeBundle(response));
    toast.success("Eintrag wurde gelöscht.");
  }

  function openNewAppointment() { setEditingAppointment(null); setAppointmentOpen(true); }

  return (
    <AdminShell
      title="Termine"
      eyebrow="Praxisplanung"
      description="Patiententermine verwalten und künftige Online-Zeitfenster sicher vorbereiten."
      onLoggedOut={onLoggedOut}
      action={<button onClick={openNewAppointment} className="admin-primary-button h-[43px] w-full sm:w-auto"><Plus className="h-[18px] w-[18px]" />Termin anlegen</button>}
    >
      <div className="schedule-page">
      <ReadinessStrip settings={bundle?.settings} loading={loading} />

      <nav className="mt-5 flex overflow-x-auto rounded-[14px] border border-[#cddde7] bg-white p-1 shadow-[0_5px_16px_rgba(23,50,73,.04)]" aria-label="Bereiche der Terminplanung">
        <TabButton active={tab === "plan"} onClick={() => setTab("plan")} icon={CalendarDays} label="Terminplan" />
        <TabButton active={tab === "online"} onClick={() => setTab("online")} icon={Sparkles} label="Online-Slots" />
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={Settings2} label="Terminarten & Einstellungen" />
      </nav>

      {loading ? <ScheduleLoading /> : error ? <ScheduleError message={error} onRetry={load} /> : bundle ? (
        <div className="admin-enter mt-5">
          {tab === "plan" && <SchedulePlanner bundle={bundle} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onNew={openNewAppointment} onEdit={(item) => { setEditingAppointment(item); setAppointmentOpen(true); }} onDelete={(item) => setDeleteTarget({ entity: "appointment", id: item.id, updatedAt: item.updatedAt, title: "Termin löschen?", description: `${item.customerName} am ${formatDate(item.date)} um ${item.time} Uhr wird aus dem Terminplan entfernt.` })} />}
          {tab === "online" && <OnlineSlotsPanel bundle={bundle} onNewRule={() => { setEditingRule(null); setRuleOpen(true); }} onEditRule={(item) => { setEditingRule(item); setRuleOpen(true); }} onDeleteRule={(item) => setDeleteTarget({ entity: "availabilityRule", id: item.id, title: "Zeitfenster löschen?", description: "Dieses wöchentliche Zeitfenster wird aus der lokalen Online-Slot-Vorschau entfernt." })} onNewException={() => { setEditingException(null); setExceptionOpen(true); }} onEditException={(item) => { setEditingException(item); setExceptionOpen(true); }} onDeleteException={(item) => setDeleteTarget({ entity: "exception", id: item.id, title: "Ausnahme löschen?", description: "Die Sonderöffnung oder Schließzeit wird aus der Planung entfernt." })} />}
          {tab === "settings" && <ScheduleSettingsPanel bundle={bundle} onSaveSettings={(data) => saveEntity("settings", data, "Buchungsgrenzen wurden gespeichert.")} onNewType={() => { setEditingType(null); setTypeOpen(true); }} onEditType={(item) => { setEditingType(item); setTypeOpen(true); }} onDeleteType={(item) => setDeleteTarget({ entity: "appointmentType", id: item.id, title: "Terminart löschen?", description: `${item.name} wird entfernt. Bestehende Termine bleiben erhalten, können die Terminart aber nicht mehr neu verwenden.` })} onNewResource={() => { setEditingResource(null); setResourceOpen(true); }} onEditResource={(item) => { setEditingResource(item); setResourceOpen(true); }} onDeleteResource={(item) => setDeleteTarget({ entity: "resource", id: item.id, title: "Ressource löschen?", description: `${item.name} wird aus der künftigen Planung entfernt.` })} />}
        </div>
      ) : null}

      {bundle && (
        <>
          <AppointmentDialog open={appointmentOpen} onOpenChange={setAppointmentOpen} appointment={editingAppointment} initialDate={selectedDate} customers={customers} appointmentTypes={bundle.appointmentTypes} resources={bundle.resources} onSave={(data) => saveEntity("appointment", data, editingAppointment ? "Termin wurde aktualisiert." : "Termin wurde angelegt.")} />
          <AvailabilityRuleDialog open={ruleOpen} onOpenChange={setRuleOpen} rule={editingRule} appointmentTypes={bundle.appointmentTypes} providers={bundle.resources.filter((item) => item.kind === "practitioner")} onSave={(data) => saveEntity("availabilityRule", data, "Online-Zeitfenster wurde gespeichert.")} />
          <ExceptionDialog open={exceptionOpen} onOpenChange={setExceptionOpen} exception={editingException} appointmentTypes={bundle.appointmentTypes} providers={bundle.resources.filter((item) => item.kind === "practitioner")} onSave={(data) => saveEntity("exception", data, "Ausnahme wurde gespeichert.")} />
          <AppointmentTypeDialog open={typeOpen} onOpenChange={setTypeOpen} appointmentType={editingType} onSave={(data) => saveEntity("appointmentType", data, "Terminart wurde gespeichert.")} />
          <ResourceDialog open={resourceOpen} onOpenChange={setResourceOpen} resource={editingResource} onSave={(data) => saveEntity("resource", data, "Ressource wurde gespeichert.")} />
          <DeleteConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? "Eintrag löschen?"} description={deleteTarget?.description ?? ""} onConfirm={deleteEntity} />
        </>
      )}
      </div>
    </AdminShell>
  );
}

function ReadinessStrip({ settings, loading }: { settings?: BookingSettings; loading: boolean }) {
  const integrationReady = settings?.integrationStatus === "ready";
  return (
    <section className="overflow-hidden rounded-[15px] border border-[#b9d0dd] bg-white">
      <div className="grid divide-y divide-[#e1ebf1] md:grid-cols-3 md:divide-x md:divide-y-0">
        <StatusCell icon={CalendarCheck2} label="Interner Terminplan" value={loading ? "Wird geprüft …" : "Einsatzbereit"} tone="green" />
        <StatusCell icon={LockKeyhole} label="Online-Veröffentlichung" value="Noch nicht veröffentlicht" detail="Dr. Flex bleibt aktiv" tone="amber" />
        <StatusCell icon={Link2} label="ivoris-Anbindung" value={integrationReady ? "Vorbereitet" : "Zugang ausstehend"} detail={settings?.lastSyncAt ? `Letzter Status: ${formatDateTime(settings.lastSyncAt)}` : "Webservice-Aktivierung erforderlich"} tone="blue" />
      </div>
    </section>
  );
}

function StatusCell({ icon: Icon, label, value, detail, tone }: { icon: typeof CalendarDays; label: string; value: string; detail?: string; tone: "green" | "amber" | "blue" }) {
  const tones = { green: "bg-[#e5f5ec] text-[#287052]", amber: "bg-[#fff0dc] text-[#9a5906]", blue: "bg-[#e5f1f8] text-[#285f80]" };
  return <div className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${tones[tone]}`}><Icon className="h-[18px] w-[18px]" /></span><div className="min-w-0"><div className="text-[9px] font-semibold uppercase tracking-[.07em] text-[#7b8f9b]">{label}</div><div className="mt-0.5 truncate text-[12px] font-semibold text-[#29475d]">{value}</div>{detail && <div className="mt-0.5 truncate text-[9px] text-[#758995]">{detail}</div>}</div></div>;
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof CalendarDays; label: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 min-w-max flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-[12px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#f58a07] ${active ? "bg-[#063255] text-white shadow-[0_6px_14px_rgba(6,50,85,.14)]" : "text-[#5f7788] hover:bg-[#eef6fa] hover:text-[#063255]"}`}><Icon className={`h-4 w-4 ${active ? "text-[#ffc376]" : ""}`} />{label}</button>;
}

function OnlineSlotsPanel({ bundle, onNewRule, onEditRule, onDeleteRule, onNewException, onEditException, onDeleteException }: { bundle: ScheduleBundle; onNewRule: () => void; onEditRule: (item: AvailabilityRule) => void; onDeleteRule: (item: AvailabilityRule) => void; onNewException: () => void; onEditException: (item: AvailabilityException) => void; onDeleteException: (item: AvailabilityException) => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[16px] border border-[#d9b97e] bg-[#fff9ec] px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fff0d4] text-[#9b5c0c]"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="!text-[14px] !font-semibold !text-[#5d451d]">Noch nicht veröffentlicht – Dr. Flex bleibt aktiv</h2><p className="mt-1 max-w-3xl !text-[12px] !font-normal !leading-5 !text-[#765d31]">Sie konfigurieren hier ausschließlich eine sichere Vorschau. Es gibt keinen Veröffentlichungs-Schalter und die Live-Website bleibt unverändert.</p></div></div>
      </section>

      <section className="admin-surface overflow-hidden">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="border-b border-[#dfebf2] bg-[#063255] px-5 py-5 text-white md:border-b-0 md:border-r"><div className="admin-kicker !text-[#91b3c7]">So entstehen Slots</div><h2 className="mt-2 !text-[16px] !font-semibold !text-white">Einfach kombiniert</h2><p className="mt-2 !text-[12px] !font-normal !leading-5 !text-[#afc6d4]">Aus drei verständlichen Angaben berechnet das System verfügbare Erstberatungstermine.</p></div>
          <div className="grid divide-y divide-[#e2ebf1] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><ModelStep number="1" title="Terminart" text="Was wird angeboten?" /><ModelStep number="2" title="Team" text="Wer ist verantwortlich?" /><ModelStep number="3" title="Zeitfenster" text="Wann darf gebucht werden?" /></div>
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,.75fr)]">
        <div className="space-y-5">
          <section className="admin-surface overflow-hidden">
            <SectionHeader title="Wöchentliche Zeitfenster" subtitle={`${bundle.availabilityRules.filter((item) => item.active).length} aktive Regeln`} action={<button onClick={onNewRule} className="admin-secondary-button h-9"><Plus className="h-4 w-4" />Zeitfenster</button>} />
            {bundle.availabilityRules.length ? (
              <div className="divide-y divide-[#e5edf2]">
                {[...bundle.availabilityRules].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)).map((rule) => {
                  const type = bundle.appointmentTypes.find((item) => item.id === rule.appointmentTypeId);
                  const provider = bundle.resources.find((item) => item.id === rule.providerId);
                  const ruleName = `${weekdayLabels[rule.weekday]} ${rule.startTime} bis ${rule.endTime}`;
                  return <article key={rule.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[11px] font-semibold ${rule.active ? "bg-[#e5f3eb] text-[#2b7455]" : "bg-[#edf1f3] text-[#73838d]"}`}>{weekdayLabels[rule.weekday].slice(0, 2)}</span><div className="min-w-0 flex-1"><div className="text-[12px] font-semibold text-[#29475d]">{weekdayLabels[rule.weekday]} · {rule.startTime}–{rule.endTime}</div><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#718692]"><span>{type?.name || "Terminart fehlt"}</span><span>{provider?.name || "Team fehlt"}</span><span>alle {rule.stepMinutes} Min.</span></div></div><div className="flex gap-2"><button onClick={() => onEditRule(rule)} className="admin-icon-button" aria-label={`${ruleName} bearbeiten`} title="Zeitfenster bearbeiten"><Edit3 className="h-4 w-4" /></button><button onClick={() => onDeleteRule(rule)} className="admin-icon-button text-[#9a453f]" aria-label={`${ruleName} löschen`} title="Zeitfenster löschen"><Trash2 className="h-4 w-4" /></button></div></article>;
                })}
              </div>
            ) : <SmallEmpty icon={CalendarClock} title="Noch keine Online-Zeitfenster" text="Legen Sie fest, welche Erstberatungen an welchen Wochentagen angeboten werden sollen." action="Erstes Zeitfenster" onAction={onNewRule} />}
          </section>

          <section className="admin-surface overflow-hidden">
            <SectionHeader title="Ausnahmen & Sonderzeiten" subtitle="Schließzeiten und zusätzliche Öffnungen" action={<button onClick={onNewException} className="admin-secondary-button h-9"><Plus className="h-4 w-4" />Ausnahme</button>} />
            {bundle.exceptions.length ? (
              <div className="divide-y divide-[#e5edf2]">
                {[...bundle.exceptions].sort((a, b) => a.date.localeCompare(b.date)).map((item) => {
                  const exceptionName = `${formatDate(item.date)} ${item.startTime} bis ${item.endTime}`;
                  return <article key={item.id} className="flex items-center gap-3 px-5 py-3.5"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${item.kind === "closed" ? "bg-[#fff0ef] text-[#a3463f]" : "bg-[#e5f5ec] text-[#2c7657]"}`}>{item.kind === "closed" ? <CircleOff className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="text-[12px] font-semibold text-[#29475d]">{formatDate(item.date)} · {item.startTime}–{item.endTime}</div><div className="mt-0.5 truncate text-[11px] text-[#718692]">{item.kind === "closed" ? "Geschlossen" : "Zusätzliche Öffnung"}{item.reason ? ` · ${item.reason}` : ""}</div></div><button onClick={() => onEditException(item)} className="admin-icon-button" aria-label={`${exceptionName} bearbeiten`} title="Ausnahme bearbeiten"><Edit3 className="h-4 w-4" /></button><button onClick={() => onDeleteException(item)} className="admin-icon-button text-[#9a453f]" aria-label={`${exceptionName} löschen`} title="Ausnahme löschen"><Trash2 className="h-4 w-4" /></button></article>;
                })}
              </div>
            ) : <SmallEmpty icon={CalendarDays} title="Keine Ausnahmen hinterlegt" text="Urlaub, Fortbildung oder zusätzliche Öffnungszeiten können hier ergänzt werden." action="Ausnahme hinzufügen" onAction={onNewException} compact />}
          </section>
        </div>

        <section className="admin-surface self-start overflow-hidden 2xl:sticky 2xl:top-5">
          <div className="border-b border-[#dce8ef] bg-[#063255] px-5 py-4 text-white"><div className="flex items-center justify-between"><div><div className="admin-kicker !text-[#95b6c9]">Lokale Vorschau</div><h2 className="mt-1 !text-[15px] !font-semibold !text-white">Nächste freie Slots</h2></div><span className="rounded-[9px] bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#d7e6ee]">{bundle.previewSlots.length} frei</span></div></div>
          {bundle.previewSlots.length ? <div className="admin-scrollbar max-h-[690px] divide-y divide-[#e2ebf1] overflow-y-auto">{groupSlots(bundle.previewSlots).map(([date, slots]) => <div key={date} className="px-5 py-4"><div className="mb-3 flex items-center justify-between"><div className="text-[11px] font-semibold text-[#29475d]">{longDate(date)}</div><div className="text-[9px] text-[#7a8e9b]">{slots.length} frei</div></div><div className="grid grid-cols-2 gap-2">{slots.slice(0, 8).map((slot) => <div key={slot.id} className="rounded-[10px] border border-[#d7e5ed] bg-[#f8fbfd] px-3 py-2.5"><div className="text-[12px] font-semibold text-[#174766]">{slot.time}–{slot.endTime}</div><div className="mt-1 truncate text-[9px] text-[#6c8392]">{slot.appointmentTypeName}</div><div className="mt-0.5 truncate text-[9px] text-[#8496a1]">{slot.providerName}</div></div>)}</div></div>)}</div> : <SmallEmpty icon={CloudOff} title="Noch keine Slots berechnet" text="Aktive Zeitfenster und online vorgesehene Terminarten erzeugen hier eine echte Vorschau." />}
        </section>
      </div>
    </div>
  );
}

function ScheduleSettingsPanel({ bundle, onSaveSettings, onNewType, onEditType, onDeleteType, onNewResource, onEditResource, onDeleteResource }: { bundle: ScheduleBundle; onSaveSettings: (data: Record<string, unknown>) => Promise<void>; onNewType: () => void; onEditType: (item: AppointmentType) => void; onDeleteType: (item: AppointmentType) => void; onNewResource: () => void; onEditResource: (item: ScheduleResource) => void; onDeleteResource: (item: ScheduleResource) => void }) {
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,.6fr)]">
      <div className="space-y-5">
        <section className="admin-surface overflow-hidden">
          <SectionHeader title="Terminarten" subtitle={`${bundle.appointmentTypes.filter((item) => item.active).length} aktiv · ${bundle.appointmentTypes.filter((item) => item.publicBookable).length} online vorgesehen`} action={<button onClick={onNewType} className="admin-secondary-button h-9"><Plus className="h-4 w-4" />Terminart</button>} />
          {bundle.appointmentTypes.length ? (
            <div className="divide-y divide-[#e4edf2]">
              {[...bundle.appointmentTypes].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => <article key={item.id} className={`grid gap-3 px-5 py-4 sm:grid-cols-[minmax(180px,1fr)_150px_150px_auto] sm:items-center ${item.active ? "" : "opacity-55"}`}><div className="flex min-w-0 items-center gap-3"><span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-[12px] font-semibold text-[#29475d]">{item.name}</span>{item.publicBookable && <span className="rounded-[7px] bg-[#e7f1f7] px-2 py-1 text-[11px] font-semibold text-[#315f7b]">Online vorgesehen</span>}</div><div className="mt-0.5 text-[11px] text-[#778b98]">{item.shortName} · {categoryLabel(item.category)}</div></div></div><div className="text-[12px] text-[#5f7787]"><strong className="text-[12px] font-semibold text-[#35556b]">{item.durationMinutes} Min.</strong><br />{item.bufferBeforeMinutes + item.bufferAfterMinutes} Min. Puffer</div><div className="text-[12px] text-[#718692]">{item.newPatientOnly ? "Nur Neupatient:innen" : "Alle Patient:innen"}</div><div className="flex gap-2 sm:justify-end"><button onClick={() => onEditType(item)} className="admin-icon-button" aria-label={`Terminart ${item.name} bearbeiten`} title="Terminart bearbeiten"><Edit3 className="h-4 w-4" /></button><button onClick={() => onDeleteType(item)} className="admin-icon-button text-[#9a453f]" aria-label={`Terminart ${item.name} löschen`} title="Terminart löschen"><Trash2 className="h-4 w-4" /></button></div></article>)}
            </div>
          ) : <SmallEmpty icon={CalendarClock} title="Keine Terminarten vorhanden" text="Legen Sie Dauer, Puffer und Eignung für Online-Erstberatungen fest." action="Terminart anlegen" onAction={onNewType} />}
        </section>

        <section className="admin-surface overflow-hidden">
          <SectionHeader title="Behandler:innen & Räume" subtitle="Ressourcen für konfliktfreie Planung" action={<button onClick={onNewResource} className="admin-secondary-button h-9"><Plus className="h-4 w-4" />Ressource</button>} />
          {bundle.resources.length ? (
            <div className="grid gap-px bg-[#e3edf3] sm:grid-cols-2">
              {[...bundle.resources].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => <article key={item.id} className={`flex items-center gap-3 bg-white px-5 py-4 ${item.active ? "" : "opacity-55"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ backgroundColor: item.color }}>{item.kind === "practitioner" ? <UserRound className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold text-[#29475d]">{item.name}</div><div className="mt-0.5 text-[11px] text-[#778b98]">{resourceKindLabel(item.kind)} · {item.active ? "aktiv" : "inaktiv"}</div></div><button onClick={() => onEditResource(item)} className="admin-icon-button" aria-label={`${item.name} bearbeiten`} title="Ressource bearbeiten"><Edit3 className="h-4 w-4" /></button><button onClick={() => onDeleteResource(item)} className="admin-icon-button text-[#9a453f]" aria-label={`${item.name} löschen`} title="Ressource löschen"><Trash2 className="h-4 w-4" /></button></article>)}
            </div>
          ) : <SmallEmpty icon={UsersRound} title="Keine Ressourcen angelegt" text="Erfassen Sie Behandler:innen, Teams, Räume oder Behandlungsstühle." action="Ressource hinzufügen" onAction={onNewResource} />}
        </section>
      </div>

      <aside className="space-y-5">
        <PublicationLock />
        <BookingSettingsForm settings={bundle.settings} onSave={onSaveSettings} />
        <IntegrationPanel settings={bundle.settings} />
      </aside>
    </div>
  );
}

function BookingSettingsForm({ settings, onSave }: { settings: BookingSettings; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState(settings); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(""); setSaved(false); try { await onSave({ ...draft }); setSaved(true); } catch (caught) { setError(caught instanceof Error ? caught.message : "Einstellungen konnten nicht gespeichert werden."); } finally { setSaving(false); } }
  return <form onSubmit={submit} className="admin-surface overflow-hidden"><div className="border-b border-[#dfebf2] px-5 py-4"><h2 className="!text-[14px] !font-semibold !text-[#29475d]">Buchungsgrenzen</h2><p className="mt-1 !text-[12px] !font-normal !text-[#748995]">Vorgaben für die lokale Slot-Berechnung</p></div><div className="space-y-4 px-5 py-5"><SettingsNumber label="Buchungshorizont" value={draft.bookingHorizonDays} unit="Tage" onChange={(bookingHorizonDays) => setDraft((current) => ({ ...current, bookingHorizonDays }))} /><SettingsNumber label="Mindestvorlauf" value={draft.minNoticeHours} unit="Stunden" onChange={(minNoticeHours) => setDraft((current) => ({ ...current, minNoticeHours }))} /><SettingsNumber label="Absagefrist" value={draft.cancellationNoticeHours} unit="Stunden" onChange={(cancellationNoticeHours) => setDraft((current) => ({ ...current, cancellationNoticeHours }))} /><SettingsNumber label="Slot-Raster" value={draft.slotIntervalMinutes} unit="Minuten" onChange={(slotIntervalMinutes) => setDraft((current) => ({ ...current, slotIntervalMinutes }))} /><label><span className="admin-label">Hinweis für spätere Online-Buchung</span><textarea className="admin-field min-h-[90px] w-full" value={draft.introText} onChange={(event) => setDraft((current) => ({ ...current, introText: event.target.value }))} /></label>{error && <div className="rounded-[9px] bg-[#fff2f1] px-3 py-2 text-[10px] text-[#9a3933]">{error}</div>}{saved && <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#327457]"><CheckCircle2 className="h-4 w-4" />Gespeichert</div>}</div><div className="border-t border-[#e0eaf0] bg-[#fbfdfe] px-5 py-4"><button type="submit" disabled={saving} className="admin-primary-button h-10 w-full">{saving ? <span className="admin-spinner h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}{saving ? "Wird gespeichert …" : "Grenzen speichern"}</button></div></form>;
}

function PublicationLock() { return <section className="rounded-[16px] border border-[#dfbd80] bg-[#fff9ec] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fff0d4] text-[#9a5c0c]"><LockKeyhole className="h-5 w-5" /></span><h2 className="mt-4 !text-[14px] !font-semibold !text-[#5d451d]">Noch nicht veröffentlicht</h2><p className="mt-2 !text-[12px] !font-normal !leading-5 !text-[#765d31]">Dr. Flex bleibt unverändert aktiv. Die neue Slot-Konfiguration arbeitet nur als interne Vorschau; ein Publizieren ist bewusst nicht möglich.</p></section>; }

function IntegrationPanel({ settings }: { settings: BookingSettings }) {
  const ready = settings.integrationStatus === "ready";
  return <section className="overflow-hidden rounded-[16px] border border-[#174b70] bg-[#063255] p-5 text-white"><div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-[#ffc376]"><Link2 className="h-5 w-5" /></span><span className={`rounded-[8px] px-2.5 py-1.5 text-[9px] font-semibold ${ready ? "bg-[#dff3e7] text-[#226748]" : "bg-white/10 text-[#c8dbe6]"}`}>{ready ? "Vorbereitet" : "Zugang ausstehend"}</span></div><h2 className="mt-4 !text-[14px] !font-semibold !text-white">ivoris-Anbindung vorbereitet</h2><p className="mt-2 !text-[12px] !font-normal !leading-5 !text-[#b8ceda]">Die lokale Planung funktioniert bereits. Für Echtzeit-Synchronisierung werden noch die offizielle ivoris-Webservice-/Connect-Aktivierung und Hersteller-Zugangsdaten benötigt.</p><div className="mt-4 border-t border-white/10 pt-4 text-[9px] leading-5 text-[#91afc1]">{settings.lastSyncAt ? `Letzter Synchronisationsstatus: ${formatDateTime(settings.lastSyncAt)}` : "Noch keine Synchronisierung durchgeführt."}<br />Keine Zugangsdaten müssen hier eingegeben werden.</div></section>;
}

function ScheduleLoading() { return <div className="admin-surface mt-5 flex min-h-[440px] flex-col items-center justify-center text-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#f58a07]" /><h2 className="mt-4 !text-[14px] !font-semibold !text-[#29475d]">Terminplanung wird geladen</h2><p className="mt-1 !text-[12px] !font-normal !text-[#718692]">Termine, Regeln und freie Slots werden zusammengeführt.</p></div>; }
function ScheduleError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="admin-surface mt-5 flex min-h-[380px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff0ef] text-[#a3443d]"><AlertCircle className="h-6 w-6" /></span><h2 className="mt-4 !text-[15px] !font-semibold !text-[#29475d]">Terminplanung nicht erreichbar</h2><p className="mt-2 max-w-lg !text-[12px] !font-normal !leading-5 !text-[#718692]">{message}</p><button onClick={onRetry} className="admin-primary-button mt-5 h-10"><RefreshCw className="h-4 w-4" />Erneut laden</button></div>; }
function EmptyAgenda({ filtered, onNew }: { filtered: boolean; onNew: () => void }) { return <div className="flex min-h-[410px] flex-col items-center justify-center px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e6f2f9] text-[#174e72]"><CalendarCheck2 className="h-7 w-7" /></span><h3 className="mt-4 !text-[15px] !font-semibold !text-[#29475d]">{filtered ? "Keine passenden Termine" : "An diesem Tag ist noch nichts geplant"}</h3><p className="mt-2 max-w-sm !text-[12px] !font-normal !leading-5 !text-[#718692]">{filtered ? "Passen Sie die Filter links an." : "Legen Sie einen Patiententermin an. Konflikte werden automatisch geprüft."}</p>{!filtered && <button onClick={onNew} className="admin-primary-button mt-5 h-10"><Plus className="h-4 w-4" />Termin anlegen</button>}</div>; }
function SmallEmpty({ icon: Icon, title, text, action, onAction, compact }: { icon: typeof CalendarDays; title: string; text: string; action?: string; onAction?: () => void; compact?: boolean }) { return <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "min-h-[220px] py-8" : "min-h-[300px] py-10"}`}><Icon className="h-7 w-7 text-[#7fa0b5]" /><h3 className="mt-3 !text-[13px] !font-semibold !text-[#29475d]">{title}</h3><p className="mt-1.5 max-w-sm !text-[12px] !font-normal !leading-5 !text-[#718692]">{text}</p>{action && onAction && <button onClick={onAction} className="admin-secondary-button mt-4 h-9 text-[11px]"><Plus className="h-4 w-4" />{action}</button>}</div>; }
function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action: React.ReactNode }) { return <div className="flex items-center justify-between gap-4 border-b border-[#deebf2] px-5 py-4"><div><h2 className="!text-[15px] !font-semibold !text-[#29475d]">{title}</h2><p className="mt-1 !text-[12px] !font-normal !text-[#748995]">{subtitle}</p></div>{action}</div>; }
function ModelStep({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex items-center gap-3 px-5 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f2f8] text-[11px] font-semibold text-[#174c6f]">{number}</span><div><div className="text-[11px] font-semibold text-[#29475d]">{title}</div><div className="mt-0.5 text-[9px] text-[#778b98]">{text}</div></div>{number !== "3" && <ArrowRight className="ml-auto hidden h-4 w-4 text-[#9eb2bf] sm:block" />}</div>; }
function SettingsNumber({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (value: number) => void }) { return <label className="grid grid-cols-[minmax(0,1fr)_minmax(156px,auto)] items-center gap-4"><span className="text-[11px] font-medium text-[#3f5d71]">{label}</span><span className="grid min-h-11 grid-cols-[minmax(72px,1fr)_auto] overflow-hidden rounded-[11px] border border-[#c9dbe6] bg-white transition focus-within:border-[#5b8ca9] focus-within:ring-2 focus-within:ring-[#cfe3ef]"><input type="number" min="0" className="min-w-0 border-0 bg-transparent px-3 text-right text-[14px] font-semibold text-[#173249] outline-none" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} /><span className="flex items-center border-l border-[#dce8ef] bg-[#f6fafc] px-3 text-[10px] font-medium text-[#667f8f]">{unit}</span></span></label>; }
function normalizeBundle(value: ScheduleBundle): ScheduleBundle { return { ...value, appointments: value.appointments ?? [], appointmentTypes: value.appointmentTypes ?? [], resources: value.resources ?? [], availabilityRules: value.availabilityRules ?? [], exceptions: value.exceptions ?? [], previewSlots: value.previewSlots ?? [] }; }
function todayBerlin() { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date()); }
function dateFromIso(value: string) { return new Date(`${value}T12:00:00`); }
function formatDate(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dateFromIso(value)); }
function longDate(value: string) { return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(dateFromIso(value)); }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(date); }
function categoryLabel(value: AppointmentType["category"]) { return { consultation: "Beratung", diagnostics: "Diagnostik", treatment: "Behandlung", control: "Kontrolle", retention: "Retention", emergency: "Notfall", other: "Sonstiges" }[value]; }
function resourceKindLabel(value: ScheduleResource["kind"]) { return value === "practitioner" ? "Behandler:in / Team" : value === "room" ? "Raum" : "Behandlungsstuhl"; }
function groupSlots(slots: ScheduleBundle["previewSlots"]) { const map = new Map<string, ScheduleBundle["previewSlots"]>(); for (const slot of slots) map.set(slot.date, [...(map.get(slot.date) ?? []), slot]); return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)); }

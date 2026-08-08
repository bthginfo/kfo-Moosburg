import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Clock3, RefreshCw, Search, Trash2, UserRound, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type {
  AppointmentType,
  AvailabilityException,
  AvailabilityRule,
  Customer,
  ScheduleAppointment,
  ScheduleAppointmentStatus,
  ScheduleResource,
} from "../types";

type CommonProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  initialDate,
  customers,
  appointmentTypes,
  resources,
  onSave,
}: CommonProps & {
  appointment: ScheduleAppointment | null;
  initialDate: string;
  customers: Customer[];
  appointmentTypes: AppointmentType[];
  resources: ScheduleResource[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    id: "", customerId: "", date: initialDate, time: "09:00", appointmentTypeId: "",
    providerId: "", roomId: "", durationMinutes: 30, status: "scheduled" as ScheduleAppointmentStatus, note: "",
    repeatCount: 1, repeatIntervalWeeks: 6,
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const patientTriggerRef = useRef<HTMLButtonElement>(null);
  const pickerPanelRef = useRef<HTMLElement>(null);
  const pickerSearchRef = useRef<HTMLInputElement>(null);

  const practitioners = resources.filter((item) => item.kind === "practitioner" && item.active);
  const rooms = resources.filter((item) => item.kind !== "practitioner" && item.active);
  const activeTypes = appointmentTypes.filter((item) => item.active);
  const selectedCustomer = customers.find((item) => item.id === draft.customerId);
  const matchingCustomers = useMemo(() => customers
    .filter((item) => item.status === "active")
    .filter((item) => `${item.firstName} ${item.lastName} ${item.email} ${item.patientNumber ?? ""}`.toLowerCase().includes(patientSearch.toLowerCase()))
    .slice(0, 30), [customers, patientSearch]);

  useEffect(() => {
    if (!open) return;
    setError(""); setPatientSearch(""); setPickerOpen(false);
    if (appointment) {
      setDraft({
        id: appointment.id,
        customerId: appointment.customerId,
        date: appointment.date,
        time: appointment.time,
        appointmentTypeId: appointment.appointmentTypeId,
        providerId: appointment.providerId,
        roomId: appointment.roomId,
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        note: appointment.note ?? "",
        repeatCount: 1,
        repeatIntervalWeeks: 6,
      });
    } else {
      const firstType = activeTypes[0];
      setDraft({ id: "", customerId: "", date: initialDate, time: "09:00", appointmentTypeId: firstType?.id ?? "", providerId: practitioners[0]?.id ?? "", roomId: rooms[0]?.id ?? "", durationMinutes: firstType?.durationMinutes ?? 30, status: "scheduled", note: "", repeatCount: 1, repeatIntervalWeeks: 6 });
    }
  }, [open, appointment, initialDate]);

  useEffect(() => {
    if (!pickerOpen) return;
    const focusSearch = window.requestAnimationFrame(() => pickerSearchRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPickerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !pickerPanelRef.current) return;
      const focusable = Array.from(pickerPanelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusSearch);
      document.removeEventListener("keydown", handleKeyDown);
      patientTriggerRef.current?.focus();
    };
  }, [pickerOpen]);

  function selectType(id: string) {
    const type = appointmentTypes.find((item) => item.id === id);
    setDraft((current) => ({ ...current, appointmentTypeId: id, durationMinutes: type?.durationMinutes ?? current.durationMinutes }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.customerId || !draft.date || !draft.time || !draft.appointmentTypeId) {
      return setError("Bitte wählen Sie Patient:in, Datum, Uhrzeit und Terminart aus.");
    }
    setSaving(true); setError("");
    try {
      await onSave({ ...draft, ...(draft.id ? { id: draft.id } : {}) });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Der Termin konnte nicht gespeichert werden.");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-root admin-work-dialog admin-schedule-dialog schedule-ui flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]">
        <DialogHeader className="shrink-0 border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e7f3fa] text-[#063255]"><Clock3 className="h-5 w-5" /></span>
            <div><DialogTitle className="!text-[18px] !font-semibold !text-[#173249]">{appointment ? "Termin bearbeiten" : "Neuen Termin anlegen"}</DialogTitle><DialogDescription className="mt-0.5 !text-[12px] !text-[#667c8b]">Patient:in, Zeit und Praxisressourcen zuordnen</DialogDescription></div>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="admin-scrollbar admin-dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="relative lg:col-span-2">
                <span className="admin-label">Patient:in *</span>
                <button ref={patientTriggerRef} type="button" onClick={() => setPickerOpen((value) => !value)} className="admin-field flex w-full items-center justify-between text-left">
                  {selectedCustomer ? <span className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#e6f1f7] text-[10px] font-semibold text-[#174b6e]">{selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}</span><span className="truncate text-[13px] font-semibold text-[#29475d]">{selectedCustomer.firstName} {selectedCustomer.lastName}</span></span> : <span className="text-[#8295a1]">Patient:in suchen und auswählen</span>}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#6f8492]" />
                </button>
              </div>

              <Field label="Datum *"><input type="date" className="admin-field w-full" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
              <div className="grid grid-cols-[1fr_110px] gap-3"><Field label="Uhrzeit *"><input type="time" className="admin-field w-full" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} /></Field><Field label="Dauer"><div className="admin-field flex items-center justify-between bg-[#f7fafc] text-[12px] text-[#506b7d]"><span>{draft.durationMinutes}</span><span>Min.</span></div></Field></div>
              <Field label="Terminart *"><select className="admin-field w-full" value={draft.appointmentTypeId} onChange={(event) => selectType(event.target.value)}><option value="">Bitte auswählen</option>{activeTypes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} Min.</option>)}</select></Field>
              <Field label="Status"><select className="admin-field w-full" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ScheduleAppointmentStatus }))}><option value="scheduled">Geplant</option><option value="confirmed">Bestätigt</option><option value="arrived">Eingetroffen</option><option value="completed">Abgeschlossen</option><option value="cancelled">Abgesagt</option><option value="no_show">Nicht erschienen</option></select></Field>
              <Field label="Behandler:in / Team"><select className="admin-field w-full" value={draft.providerId} onChange={(event) => setDraft((current) => ({ ...current, providerId: event.target.value }))}><option value="">Noch nicht zugeordnet</option>{practitioners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Raum / Stuhl"><select className="admin-field w-full" value={draft.roomId} onChange={(event) => setDraft((current) => ({ ...current, roomId: event.target.value }))}><option value="">Noch nicht zugeordnet</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Interne Notiz" className="lg:col-span-2"><textarea className="admin-field min-h-[96px] w-full" value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Vorbereitung, Besonderheiten oder Rückrufhinweis" /></Field>
            </div>
            {!appointment && (
              <div className="mt-5 rounded-[13px] border border-[#d5e4ed] bg-[#f8fbfd] p-4">
                <div className="mb-3 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#e7f2f8] text-[#245b7c]"><RefreshCw className="h-4 w-4" /></span><div><div className="text-[12px] font-semibold text-[#29475d]">Termin wiederholen</div><div className="mt-0.5 text-[10px] leading-5 text-[#738895]">Optional eine Behandlungsserie im gleichen Rhythmus anlegen.</div></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Anzahl Termine"><input type="number" min="1" max="30" className="admin-field w-full" value={draft.repeatCount} onChange={(event) => setDraft((current) => ({ ...current, repeatCount: Math.min(30, Math.max(1, Number(event.target.value))) }))} /></Field>
                  <Field label="Abstand"><div className="relative"><input type="number" min="1" max="26" className="admin-field w-full pr-20" value={draft.repeatIntervalWeeks} disabled={draft.repeatCount === 1} onChange={(event) => setDraft((current) => ({ ...current, repeatIntervalWeeks: Math.min(26, Math.max(1, Number(event.target.value))) }))} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#788d9a]">Wochen</span></div></Field>
                </div>
                {draft.repeatCount > 1 && <div className="mt-3 rounded-[9px] bg-[#eaf4f9] px-3 py-2 text-[10px] text-[#45677c]">Es werden {draft.repeatCount} Termine im Abstand von {draft.repeatIntervalWeeks} Wochen angelegt. Jeder Termin wird auf Konflikte geprüft.</div>}
              </div>
            )}
            <div className="mt-5 rounded-[11px] bg-[#eef7fc] px-4 py-3 text-[11px] leading-5 text-[#4d6a7d]">Terminüberschneidungen bei Patient:in, Behandler:in oder Raum werden beim Speichern automatisch geprüft.</div>
          </div>
          <DialogActions error={error} saving={saving} saveLabel={appointment ? "Änderungen speichern" : "Termin anlegen"} onCancel={() => onOpenChange(false)} />
        </form>
      </DialogContent>
      {pickerOpen && typeof document !== "undefined" && createPortal(
        <div className="admin-root schedule-ui fixed inset-0 z-[80] flex items-end justify-center bg-[#031d31]/55 p-2 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="patient-picker-title" onMouseDown={() => setPickerOpen(false)}>
          <section ref={pickerPanelRef} className="admin-enter flex max-h-[min(82dvh,680px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[18px] border border-[#bcd1de] bg-white shadow-[0_28px_75px_rgba(4,35,58,.3)] sm:rounded-[18px]" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex shrink-0 items-center justify-between border-b border-[#deebf2] px-5 py-4">
              <div><h2 id="patient-picker-title" className="!text-[16px] !font-semibold !text-[#29475d]">Patient:in auswählen</h2><p className="mt-1 !text-[12px] !font-normal !text-[#718895]">Suche nach Name, E-Mail oder Patientennummer</p></div>
              <button type="button" onClick={() => setPickerOpen(false)} className="admin-icon-button" aria-label="Patientenauswahl schließen" title="Schließen"><X className="h-4 w-4" /></button>
            </header>
            <div className="shrink-0 border-b border-[#e1ebf1] p-4"><label htmlFor="schedule-patient-search" className="admin-label">Patient:in suchen</label><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748b99]" /><input ref={pickerSearchRef} id="schedule-patient-search" className="admin-field admin-field-leading h-11 w-full" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Name, E-Mail oder Patientennummer" /></div></div>
            <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
              {matchingCustomers.length ? matchingCustomers.map((customer) => (
                <button key={customer.id} type="button" onClick={() => { setDraft((current) => ({ ...current, customerId: customer.id })); setPickerOpen(false); }} className="flex min-h-12 w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left hover:bg-[#eff6fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#e7f2f8] text-[11px] font-semibold text-[#174b6e]">{customer.firstName[0]}{customer.lastName[0]}</span>
                  <span className="min-w-0"><span className="block text-[13px] font-semibold text-[#29475d]">{customer.firstName} {customer.lastName}</span><span className="block truncate text-[11px] text-[#728895]">{customer.patientNumber ? `Pat.-Nr. ${customer.patientNumber} · ` : ""}{customer.email || "Keine E-Mail"}</span></span>
                  {draft.customerId === customer.id && <Check className="ml-auto h-4 w-4 shrink-0 text-[#2f795a]" />}
                </button>
              )) : <div className="px-4 py-10 text-center text-[12px] text-[#718895]">Keine passende Patient:in gefunden.</div>}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </Dialog>
  );
}

export function AvailabilityRuleDialog({ open, onOpenChange, rule, appointmentTypes, providers, onSave }: CommonProps & { rule: AvailabilityRule | null; appointmentTypes: AppointmentType[]; providers: ScheduleResource[]; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ id: "", appointmentTypeId: "", providerId: "", weekday: 1, startTime: "08:00", endTime: "12:00", validFrom: "", validUntil: "", stepMinutes: 30, active: true });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setError(""); setDraft(rule ? { ...rule } : { id: "", appointmentTypeId: appointmentTypes.find((item) => item.active && item.publicBookable)?.id ?? "", providerId: providers.find((item) => item.active)?.id ?? "", weekday: 1, startTime: "08:00", endTime: "12:00", validFrom: "", validUntil: "", stepMinutes: 30, active: true }); }, [open, rule]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!draft.appointmentTypeId || !draft.providerId || !draft.startTime || !draft.endTime) return setError("Bitte füllen Sie alle erforderlichen Felder aus."); if (!appointmentTypes.find((item) => item.id === draft.appointmentTypeId)?.publicBookable) return setError("Markieren Sie die Terminart zuerst als „für Online-Buchung vorgesehen“."); setSaving(true); setError(""); try { await onSave(draft); onOpenChange(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "Das Zeitfenster konnte nicht gespeichert werden."); } finally { setSaving(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="admin-root admin-work-dialog admin-schedule-small-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><SimpleHeader title={rule ? "Zeitfenster bearbeiten" : "Online-Zeitfenster anlegen"} description="Terminart, Team und wöchentliche Verfügbarkeit verbinden" /><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"><Field label="Terminart *"><select className="admin-field w-full" value={draft.appointmentTypeId} onChange={(e) => setDraft((current) => ({ ...current, appointmentTypeId: e.target.value }))}>{appointmentTypes.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}{item.publicBookable ? " · online vorgesehen" : ""}</option>)}</select></Field><Field label="Verantwortlich *"><select className="admin-field w-full" value={draft.providerId} onChange={(e) => setDraft((current) => ({ ...current, providerId: e.target.value }))}>{providers.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Wochentag"><select className="admin-field w-full" value={draft.weekday} onChange={(e) => setDraft((current) => ({ ...current, weekday: Number(e.target.value) }))}>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></Field><Field label="Von"><input type="time" className="admin-field w-full" value={draft.startTime} onChange={(e) => setDraft((current) => ({ ...current, startTime: e.target.value }))} /></Field><Field label="Bis"><input type="time" className="admin-field w-full" value={draft.endTime} onChange={(e) => setDraft((current) => ({ ...current, endTime: e.target.value }))} /></Field></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Gültig ab"><input type="date" className="admin-field w-full" value={draft.validFrom} onChange={(e) => setDraft((current) => ({ ...current, validFrom: e.target.value }))} /></Field><Field label="Gültig bis"><input type="date" className="admin-field w-full" value={draft.validUntil} onChange={(e) => setDraft((current) => ({ ...current, validUntil: e.target.value }))} /></Field><Field label="Slot-Abstand"><select className="admin-field w-full" value={draft.stepMinutes} onChange={(e) => setDraft((current) => ({ ...current, stepMinutes: Number(e.target.value) }))}><option value={15}>15 Minuten</option><option value={20}>20 Minuten</option><option value={30}>30 Minuten</option><option value={45}>45 Minuten</option><option value={60}>60 Minuten</option></select></Field></div><ToggleRow checked={draft.active} onChange={(active) => setDraft((current) => ({ ...current, active }))} title="Zeitfenster aktiv" text="Wird in der lokalen Slot-Vorschau berücksichtigt" /></div><DialogActions error={error} saving={saving} saveLabel="Zeitfenster speichern" onCancel={() => onOpenChange(false)} /></form></DialogContent></Dialog>;
}

export function ExceptionDialog({ open, onOpenChange, exception, appointmentTypes, providers, onSave }: CommonProps & { exception: AvailabilityException | null; appointmentTypes: AppointmentType[]; providers: ScheduleResource[]; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ id: "", kind: "closed" as "closed" | "additional", date: "", startTime: "08:00", endTime: "17:00", appointmentTypeId: "", providerId: "", reason: "" }); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setError(""); setDraft(exception ? { ...exception } : { id: "", kind: "closed", date: "", startTime: "08:00", endTime: "17:00", appointmentTypeId: "", providerId: "", reason: "" }); }, [open, exception]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!draft.date || !draft.startTime || !draft.endTime) return setError("Bitte geben Sie Datum und Uhrzeit an."); if (draft.kind === "additional" && (!draft.appointmentTypeId || !draft.providerId)) return setError("Für eine zusätzliche Öffnung sind Terminart und verantwortliches Team erforderlich."); setSaving(true); setError(""); try { await onSave(draft); onOpenChange(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "Die Ausnahme konnte nicht gespeichert werden."); } finally { setSaving(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="admin-root admin-work-dialog admin-schedule-small-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><SimpleHeader title={exception ? "Ausnahme bearbeiten" : "Ausnahme hinzufügen"} description="Schließzeit oder zusätzliche Öffnung eintragen" /><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"><div className="grid grid-cols-2 gap-2"><Choice active={draft.kind === "closed"} label="Geschlossen" description="Sperrt reguläre Slots" onClick={() => setDraft((current) => ({ ...current, kind: "closed" }))} /><Choice active={draft.kind === "additional"} label="Zusätzliche Öffnung" description="Ergänzt freie Zeiten" onClick={() => setDraft((current) => ({ ...current, kind: "additional" }))} /></div><Field label="Datum *"><input type="date" className="admin-field w-full" value={draft.date} onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Von"><input type="time" className="admin-field w-full" value={draft.startTime} onChange={(e) => setDraft((current) => ({ ...current, startTime: e.target.value }))} /></Field><Field label="Bis"><input type="time" className="admin-field w-full" value={draft.endTime} onChange={(e) => setDraft((current) => ({ ...current, endTime: e.target.value }))} /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Terminart (optional)"><select className="admin-field w-full" value={draft.appointmentTypeId} onChange={(e) => setDraft((current) => ({ ...current, appointmentTypeId: e.target.value }))}><option value="">Alle Terminarten</option>{appointmentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Team (optional)"><select className="admin-field w-full" value={draft.providerId} onChange={(e) => setDraft((current) => ({ ...current, providerId: e.target.value }))}><option value="">Gesamte Praxis</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div><Field label="Grund / Notiz"><input className="admin-field w-full" value={draft.reason} onChange={(e) => setDraft((current) => ({ ...current, reason: e.target.value }))} placeholder="z. B. Fortbildung oder Urlaubsvertretung" /></Field></div><DialogActions error={error} saving={saving} saveLabel="Ausnahme speichern" onCancel={() => onOpenChange(false)} /></form></DialogContent></Dialog>;
}

export function AppointmentTypeDialog({ open, onOpenChange, appointmentType, onSave }: CommonProps & { appointmentType: AppointmentType | null; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ id: "", name: "", shortName: "", category: "control" as AppointmentType["category"], durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, color: "#347a91", publicBookable: false, newPatientOnly: false, active: true, description: "", preparation: "", sortOrder: 0 }); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setError(""); setDraft(appointmentType ? { ...appointmentType } : { id: "", name: "", shortName: "", category: "control", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, color: "#347a91", publicBookable: false, newPatientOnly: false, active: true, description: "", preparation: "", sortOrder: 0 }); }, [open, appointmentType]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!draft.name.trim() || !draft.shortName.trim()) return setError("Name und Kurzname sind erforderlich."); setSaving(true); setError(""); try { await onSave(draft); onOpenChange(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "Die Terminart konnte nicht gespeichert werden."); } finally { setSaving(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="admin-root admin-work-dialog admin-schedule-small-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><SimpleHeader title={appointmentType ? "Terminart bearbeiten" : "Terminart anlegen"} description="Dauer, Puffer und künftige Online-Eignung festlegen" /><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><Field label="Bezeichnung *"><input className="admin-field w-full" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} /></Field><Field label="Kurzname *"><input className="admin-field w-full" value={draft.shortName} onChange={(e) => setDraft((current) => ({ ...current, shortName: e.target.value }))} /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Kategorie"><select className="admin-field w-full" value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value as AppointmentType["category"] }))}><option value="consultation">Beratung</option><option value="diagnostics">Diagnostik</option><option value="treatment">Behandlung</option><option value="control">Kontrolle</option><option value="retention">Retention</option><option value="emergency">Notfall</option><option value="other">Sonstiges</option></select></Field><Field label="Farbe"><div className="admin-field flex items-center gap-3"><input type="color" className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0" value={draft.color} onChange={(e) => setDraft((current) => ({ ...current, color: e.target.value }))} /><span className="text-[11px] text-[#617988]">Kennzeichnung im Terminplan</span></div></Field></div><div className="grid grid-cols-3 gap-3"><Field label="Dauer"><NumberField value={draft.durationMinutes} onChange={(durationMinutes) => setDraft((current) => ({ ...current, durationMinutes }))} /></Field><Field label="Puffer davor"><NumberField value={draft.bufferBeforeMinutes} onChange={(bufferBeforeMinutes) => setDraft((current) => ({ ...current, bufferBeforeMinutes }))} /></Field><Field label="Puffer danach"><NumberField value={draft.bufferAfterMinutes} onChange={(bufferAfterMinutes) => setDraft((current) => ({ ...current, bufferAfterMinutes }))} /></Field></div><Field label="Beschreibung"><textarea className="admin-field min-h-[84px] w-full" value={draft.description} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} /></Field><Field label="Vorbereitungshinweis"><input className="admin-field w-full" value={draft.preparation} onChange={(e) => setDraft((current) => ({ ...current, preparation: e.target.value }))} /></Field><div className="space-y-2"><ToggleRow checked={draft.active} onChange={(active) => setDraft((current) => ({ ...current, active }))} title="Terminart aktiv" text="Kann intern für neue Termine verwendet werden" /><ToggleRow checked={draft.publicBookable} onChange={(publicBookable) => setDraft((current) => ({ ...current, publicBookable }))} title="Für Online-Buchung vorgesehen" text="Nur lokale Vorschau – Veröffentlichung bleibt gesperrt" /><ToggleRow checked={draft.newPatientOnly} onChange={(newPatientOnly) => setDraft((current) => ({ ...current, newPatientOnly }))} title="Nur für Neupatient:innen" text="Kennzeichnet Erstberatungsangebote" /></div></div><DialogActions error={error} saving={saving} saveLabel="Terminart speichern" onCancel={() => onOpenChange(false)} /></form></DialogContent></Dialog>;
}

export function ResourceDialog({ open, onOpenChange, resource, onSave }: CommonProps & { resource: ScheduleResource | null; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ id: "", name: "", kind: "practitioner" as ScheduleResource["kind"], color: "#347a91", active: true, sortOrder: 0 }); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setError(""); setDraft(resource ? { ...resource } : { id: "", name: "", kind: "practitioner", color: "#347a91", active: true, sortOrder: 0 }); }, [open, resource]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!draft.name.trim()) return setError("Bitte geben Sie einen Namen ein."); setSaving(true); setError(""); try { await onSave(draft); onOpenChange(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "Die Ressource konnte nicht gespeichert werden."); } finally { setSaving(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="admin-root admin-work-dialog admin-schedule-small-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><SimpleHeader title={resource ? "Ressource bearbeiten" : "Ressource hinzufügen"} description="Behandler:in, Team, Raum oder Stuhl verwalten" /><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="space-y-5 px-5 py-6 sm:px-7"><Field label="Name *"><input className="admin-field w-full" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Art"><select className="admin-field w-full" value={draft.kind} onChange={(e) => setDraft((current) => ({ ...current, kind: e.target.value as ScheduleResource["kind"] }))}><option value="practitioner">Behandler:in / Team</option><option value="room">Raum</option><option value="chair">Behandlungsstuhl</option></select></Field><Field label="Farbe"><input type="color" className="admin-field h-[42px] w-full cursor-pointer p-1.5" value={draft.color} onChange={(e) => setDraft((current) => ({ ...current, color: e.target.value }))} /></Field></div><ToggleRow checked={draft.active} onChange={(active) => setDraft((current) => ({ ...current, active }))} title="Aktiv" text="Steht für Planung und Online-Zeitfenster zur Verfügung" /></div><DialogActions error={error} saving={saving} saveLabel="Ressource speichern" onCancel={() => onOpenChange(false)} /></form></DialogContent></Dialog>;
}

export function DeleteConfirmDialog({ open, onOpenChange, title, description, onConfirm }: CommonProps & { title: string; description: string; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (open) setError(""); }, [open]);
  async function confirm() { setDeleting(true); setError(""); try { await onConfirm(); onOpenChange(false); } catch (caught) { setError(caught instanceof Error ? caught.message : "Der Eintrag konnte nicht gelöscht werden."); } finally { setDeleting(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="admin-root max-w-[calc(100%-2rem)] rounded-[16px] border-[#d8b9b5] bg-white p-0 sm:!max-w-[470px]"><div className="px-6 py-6 pr-14"><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fff0ef] text-[#a23e38]"><Trash2 className="h-5 w-5" /></span><DialogTitle className="!text-[17px] !font-semibold !text-[#263f52]">{title}</DialogTitle><DialogDescription className="mt-2 !text-[12px] !leading-5 !text-[#687e8d]">{description}</DialogDescription>{error && <div className="mt-4 rounded-[10px] bg-[#fff2f1] px-3 py-2.5 text-[11px] text-[#9c302b]">{error}</div>}</div><div className="grid grid-cols-2 gap-2 border-t border-[#e3ebf0] bg-[#fbfdfe] px-6 py-4"><button type="button" className="admin-secondary-button h-10" onClick={() => onOpenChange(false)}>Abbrechen</button><button type="button" disabled={deleting} onClick={confirm} className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#ad3f38] px-4 text-[13px] font-semibold text-white hover:bg-[#94342f] disabled:opacity-50">{deleting ? <span className="admin-spinner h-4 w-4" /> : <Trash2 className="h-4 w-4" />}Löschen</button></div></DialogContent></Dialog>;
}

function SimpleHeader({ title, description }: { title: string; description: string }) { return <DialogHeader className="shrink-0 border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7"><DialogTitle className="!text-[18px] !font-semibold !text-[#173249]">{title}</DialogTitle><DialogDescription className="mt-1 !text-[12px] !text-[#687f8e]">{description}</DialogDescription></DialogHeader>; }
function DialogActions({ error, saving, saveLabel, onCancel }: { error: string; saving: boolean; saveLabel: string; onCancel: () => void }) { return <div className="shrink-0 border-t border-[#deebf2] bg-[#fbfdfe] px-5 py-4 sm:px-7">{error && <div className="mb-3 rounded-[10px] border border-[#e6aaa5] bg-[#fff2f1] px-4 py-2.5 text-[11px] font-medium text-[#9c302b]" role="alert">{error}</div>}<div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end"><button type="button" onClick={onCancel} className="admin-secondary-button h-10">Abbrechen</button><button type="submit" disabled={saving} className="admin-primary-button h-10">{saving ? <span className="admin-spinner h-4 w-4" /> : <Check className="h-4 w-4" />}{saving ? "Wird gespeichert …" : saveLabel}</button></div></div>; }
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={className}><span className="admin-label">{label}</span>{children}</label>; }
function NumberField({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <div className="relative"><input type="number" min="0" max="480" className="admin-field w-full pr-12" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#788d9a]">Min.</span></div>; }
function ToggleRow({ checked, onChange, title, text }: { checked: boolean; onChange: (checked: boolean) => void; title: string; text: string }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[12px] border border-[#d6e4ed] bg-[#f8fbfd] px-4 py-3"><span><span className="block text-[12px] font-semibold text-[#29475d]">{title}</span><span className="mt-0.5 block text-[10px] text-[#738895]">{text}</span></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-[#276f52]" /></label>; }
function Choice({ active, label, description, onClick }: { active: boolean; label: string; description: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-[12px] border px-3 py-3 text-left transition ${active ? "border-[#356b8d] bg-[#eef7fc] ring-1 ring-[#356b8d]/15" : "border-[#d6e3eb] hover:border-[#9ab4c5]"}`}><span className="block text-[11px] font-semibold text-[#29475d]">{label}</span><span className="mt-0.5 block text-[9px] text-[#748995]">{description}</span></button>; }

import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, Check, Plus, Trash2, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { Customer, CustomerDraft } from "../types";

type Props = {
  open: boolean;
  customer?: Customer | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: CustomerDraft) => Promise<void>;
};

const emptyDraft: CustomerDraft = {
  salutation: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  email: "",
  phone: "",
  mobile: "",
  street: "",
  postalCode: "",
  city: "",
  insurer: "",
  insuranceType: "gesetzlich",
  patientNumber: "",
  status: "active",
  notes: "",
  reminderConsent: true,
  appointments: [],
};

export function CustomerDialog({ open, customer, saving, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setDraft(customer ? { ...customer, appointments: customer.appointments.map((item) => ({ ...item })) } : { ...emptyDraft, appointments: [] });
    setError("");
  }, [open, customer]);

  function set<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.firstName.trim() || !draft.lastName.trim()) return setError("Vor- und Nachname sind erforderlich.");
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return setError("Bitte prüfen Sie die E-Mail-Adresse.");
    setError("");
    try { await onSave(draft); } catch (caught) { setError(caught instanceof Error ? caught.message : "Speichern nicht möglich."); }
  }

  function addAppointment() {
    set("appointments", [...draft.appointments, { date: "", time: "", type: "Kontrolle", note: "" }]);
  }

  function updateAppointment(index: number, key: string, value: string) {
    set("appointments", draft.appointments.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-root admin-work-dialog admin-customer-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]">
        <DialogHeader className="border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e7f3fa] text-[#063255]"><UserRound className="h-5 w-5" /></span><div><DialogTitle className="!text-[18px] !font-semibold !leading-6 !text-[#173249]">{customer ? "Kund:in bearbeiten" : "Neue Kund:in anlegen"}</DialogTitle><DialogDescription className="mt-0.5 !text-[12px] !text-[#667c8b]">Stammdaten und Termine sicher erfassen</DialogDescription></div></div>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="admin-scrollbar admin-dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-8">
            <Section title="Persönliche Angaben" description="Name und Kontaktdaten der Patientin oder des Patienten">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <Field label="Anrede" className="lg:col-span-2"><select className="admin-field w-full" value={draft.salutation} onChange={(e) => set("salutation", e.target.value)}><option value="">Keine Angabe</option><option>Frau</option><option>Herr</option><option>Divers</option></select></Field>
                <Field label="Vorname *" className="lg:col-span-3"><input className="admin-field w-full" value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
                <Field label="Nachname *" className="lg:col-span-4"><input className="admin-field w-full" value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
                <Field label="Geburtsdatum" className="lg:col-span-3"><input type="date" className="admin-field w-full" value={draft.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
                <Field label="E-Mail" className="lg:col-span-6"><input type="email" className="admin-field w-full" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="name@beispiel.de" /></Field>
                <Field label="Telefon" className="lg:col-span-3"><input type="tel" className="admin-field w-full" value={draft.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                <Field label="Mobil" className="lg:col-span-3"><input type="tel" className="admin-field w-full" value={draft.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
                <Field label="Straße und Hausnummer" className="lg:col-span-6"><input className="admin-field w-full" value={draft.street} onChange={(e) => set("street", e.target.value)} /></Field>
                <Field label="PLZ" className="lg:col-span-2"><input inputMode="numeric" className="admin-field w-full" value={draft.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></Field>
                <Field label="Ort" className="lg:col-span-4"><input className="admin-field w-full" value={draft.city} onChange={(e) => set("city", e.target.value)} /></Field>
              </div>
            </Section>

            <Section title="Praxisdaten" description="Interne Zuordnung und Versicherungsangaben">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <Field label="Patientennummer" className="lg:col-span-3"><input className="admin-field w-full" value={draft.patientNumber} onChange={(e) => set("patientNumber", e.target.value)} placeholder="z. B. 2026-0042" /></Field>
                <Field label="Versicherung" className="lg:col-span-3"><input className="admin-field w-full" value={draft.insurer} onChange={(e) => set("insurer", e.target.value)} /></Field>
                <Field label="Versicherungsart" className="lg:col-span-3"><select className="admin-field w-full" value={draft.insuranceType} onChange={(e) => set("insuranceType", e.target.value as CustomerDraft["insuranceType"])}><option value="gesetzlich">Gesetzlich</option><option value="privat">Privat</option><option value="selbstzahler">Selbstzahler</option></select></Field>
                <Field label="Status" className="lg:col-span-3"><select className="admin-field w-full" value={draft.status} onChange={(e) => set("status", e.target.value as CustomerDraft["status"])}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Behandlung beendet</option><option value="archived">Archiviert</option></select></Field>
                <Field label="Interne Notiz" className="lg:col-span-12"><textarea className="admin-field min-h-[76px] w-full" value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Nur für das Praxisteam sichtbar" /></Field>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[12px] border border-[#d5e4ed] bg-[#f7fbfd] px-4 py-3.5">
                <input type="checkbox" checked={draft.reminderConsent} onChange={(e) => set("reminderConsent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#063255]" />
                <span><span className="block text-[13px] font-semibold text-[#244158]">Einwilligung für E-Mail-Erinnerungen liegt vor</span><span className="mt-0.5 block text-[11px] leading-5 text-[#6d8290]">Nur mit Einwilligung werden automatische Erinnerungen versendet.</span></span>
              </label>
            </Section>

            <Section title="Termine" description="Mehrere zukünftige Termine können getrennt verwaltet werden" noBorder>
              <div className="space-y-3">
                {draft.appointments.map((appointment, index) => (
                  <div key={appointment.id ?? index} className="grid gap-3 rounded-[13px] border border-[#dbe7ee] bg-[#fbfdfe] p-3 md:grid-cols-2 md:items-end lg:grid-cols-[1.15fr_.85fr_1.2fr_1.5fr_auto]">
                    <Field label="Datum"><input type="date" required className="admin-field w-full" value={appointment.date} onChange={(e) => updateAppointment(index, "date", e.target.value)} /></Field>
                    <Field label="Uhrzeit"><input type="time" required className="admin-field w-full" value={appointment.time} onChange={(e) => updateAppointment(index, "time", e.target.value)} /></Field>
                    <Field label="Terminart"><input className="admin-field w-full" value={appointment.type} onChange={(e) => updateAppointment(index, "type", e.target.value)} /></Field>
                    <Field label="Notiz"><input className="admin-field w-full" value={appointment.note ?? ""} onChange={(e) => updateAppointment(index, "note", e.target.value)} /></Field>
                    <button type="button" onClick={() => set("appointments", draft.appointments.filter((_, i) => i !== index))} className="admin-icon-button text-[#a83b35]" aria-label="Termin entfernen"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {!draft.appointments.length && <div className="rounded-[12px] border border-dashed border-[#c6d8e4] px-4 py-6 text-center text-[12px] text-[#718895]">Noch kein Termin hinterlegt.</div>}
              </div>
              <button type="button" onClick={addAppointment} className="admin-secondary-button mt-3 h-10"><CalendarPlus className="h-4 w-4" />Termin hinzufügen</button>
            </Section>
          </div>
          <div className="flex shrink-0 flex-col gap-3 border-t border-[#deebf2] bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="min-h-5 flex-1 text-[12px] font-medium text-[#b42318]" role="alert">{error}</div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"><button type="button" onClick={() => onOpenChange(false)} className="admin-secondary-button h-10">Abbrechen</button><button type="submit" disabled={saving} className="admin-primary-button h-10">{saving ? <span className="admin-spinner h-4 w-4" /> : <Check className="h-4 w-4" />}{saving ? "Wird gespeichert …" : "Speichern"}</button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, description, children, noBorder }: { title: string; description: string; children: React.ReactNode; noBorder?: boolean }) {
  return <section className={`py-1 ${noBorder ? "" : "mb-6 border-b border-[#e3edf3] pb-7"}`}><div className="mb-4"><h3 className="!text-[15px] !font-semibold !text-[#1f3c53]">{title}</h3><p className="mt-0.5 !text-[11px] !font-normal !text-[#728795]">{description}</p></div>{children}</section>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={className}><span className="admin-label">{label}</span>{children}</label>; }

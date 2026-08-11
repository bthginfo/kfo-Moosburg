import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  BellOff,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileUp,
  FilterX,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AdminShell } from "../AdminShell";
import { CustomerDialog } from "../components/CustomerDialog";
import { ImportWizard } from "../components/ImportWizard";
import type { Customer, CustomerDraft, CustomerStatus } from "../types";

type Props = { customers: Customer[]; onLoggedOut: () => void; onSave: (draft: CustomerDraft) => Promise<void>; onRefresh: () => Promise<void> };
const statusLabels: Record<CustomerStatus, string> = { active: "Aktiv", paused: "Pausiert", completed: "Beendet", archived: "Archiviert" };

export function CustomersPage({ customers, onLoggedOut, onSave, onRefresh }: Props) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [appointment, setAppointment] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (params.get("neu") === "1") { setEditing(null); setDialogOpen(true); setParams({}, { replace: true }); } }, [params, setParams]);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const filtered = useMemo(() => customers.filter((customer) => {
    const haystack = `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.patientNumber ?? ""}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (status !== "all" && customer.status !== status) return false;
    const next = nextAppointment(customer, today);
    if (appointment === "upcoming" && !next) return false;
    if (appointment === "none" && next) return false;
    if (appointment === "30days" && (!next || daysBetween(today, next.date) > 30)) return false;
    return true;
  }), [customers, search, status, appointment, today]);

  async function save(draft: CustomerDraft) {
    setSaving(true);
    try { await onSave(draft); setDialogOpen(false); } finally { setSaving(false); }
  }
  function openCustomer(customer?: Customer) { setEditing(customer ?? null); setDialogOpen(true); }
  function clearFilters() { setSearch(""); setStatus("all"); setAppointment("all"); }
  const filtersActive = Boolean(search || status !== "all" || appointment !== "all");

  return (
    <AdminShell
      title="Kund:innen"
      eyebrow="Patientenverwaltung"
      description="Stammdaten, Termine und Erinnerungseinwilligungen zentral und übersichtlich verwalten."
      onLoggedOut={onLoggedOut}
      action={<div className="flex gap-2"><button onClick={() => setImportOpen(true)} className="admin-secondary-button h-[43px] flex-1 sm:flex-none"><FileUp className="h-[17px] w-[17px]" />Liste importieren</button><button onClick={() => openCustomer()} className="admin-primary-button h-[43px] flex-1 sm:flex-none"><Plus className="h-[18px] w-[18px]" />Neu anlegen</button></div>}
    >
      <section className="admin-surface overflow-hidden">
        <div className="border-b border-[#deebf2] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1 xl:max-w-[420px]"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#718795]" /><input className="admin-field admin-field-leading w-full" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, E-Mail oder Patientennummer" aria-label="Kund:innen durchsuchen" /></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:flex">
              <FilterSelect label="Status" value={status} onChange={setStatus} options={[["all", "Alle Status"], ["active", "Aktiv"], ["paused", "Pausiert"], ["completed", "Beendet"], ["archived", "Archiviert"]]} />
              <FilterSelect label="Termin" value={appointment} onChange={setAppointment} options={[["all", "Alle Termine"], ["upcoming", "Mit kommendem Termin"], ["30days", "In den nächsten 30 Tagen"], ["none", "Ohne Termin"]]} />
            </div>
            {filtersActive && <button onClick={clearFilters} className="admin-quiet-button h-10 self-start xl:self-auto"><FilterX className="h-4 w-4" />Filter löschen</button>}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#718692]"><span>{filtered.length} von {customers.length} Kund:innen</span>{selected.length > 0 && <span className="rounded-[8px] bg-[#e5f0f7] px-2.5 py-1 font-semibold text-[#16486a]">{selected.length} ausgewählt</span>}</div>
        </div>

        {filtered.length ? (
          <>
            <div className="admin-scrollbar hidden overflow-x-auto md:block">
              <table className="min-w-full table-fixed text-left">
                <thead className="bg-[#f6fafc]"><tr className="border-b border-[#dce8ef] text-[10px] font-semibold uppercase tracking-[.06em] text-[#6c8290]"><th className="w-12 px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-[#063255]" checked={selected.length === filtered.length && filtered.length > 0} onChange={(e) => setSelected(e.target.checked ? filtered.map((item) => item.id) : [])} aria-label="Alle auswählen" /></th><th className="w-[25%] px-2 py-3">Patient:in</th><th className="w-[23%] px-2 py-3">Kontakt</th><th className="w-[20%] px-2 py-3">Nächster Termin</th><th className="w-[13%] px-2 py-3">Status</th><th className="w-[13%] px-2 py-3">Erinnerung</th><th className="w-16 px-4 py-3 text-right">Aktion</th></tr></thead>
                <tbody className="divide-y divide-[#e7eef3]">{filtered.map((customer) => { const next = nextAppointment(customer, today); return <tr key={customer.id} className="group transition hover:bg-[#f8fbfd]"><td className="px-4 py-3.5"><input type="checkbox" className="h-4 w-4 accent-[#063255]" checked={selected.includes(customer.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, customer.id] : current.filter((id) => id !== customer.id))} aria-label={`${customer.firstName} ${customer.lastName} auswählen`} /></td><td className="px-2 py-3.5"><div className="flex items-center gap-3"><Avatar customer={customer} /><div className="min-w-0"><button onClick={() => openCustomer(customer)} className="truncate text-left text-[13px] font-semibold text-[#203f57] hover:text-[#f08300]">{customer.lastName}, {customer.firstName}</button><div className="mt-0.5 truncate text-[10px] text-[#788c99]">{customer.patientNumber ? `Pat.-Nr. ${customer.patientNumber}` : customer.birthDate ? `Geb. ${formatDate(customer.birthDate)}` : "Keine Patientennummer"}</div></div></div></td><td className="px-2 py-3.5"><div className="truncate text-[12px] text-[#34556c]">{customer.email || "Keine E-Mail"}</div><div className="mt-0.5 truncate text-[10px] text-[#7a8e9a]">{customer.mobile || customer.phone || "Keine Telefonnummer"}</div></td><td className="px-2 py-3.5">{next ? <div><div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2c4d64]"><CalendarDays className="h-3.5 w-3.5 text-[#50809c]" />{formatDate(next.date)} · {next.time}</div><div className="mt-0.5 text-[10px] text-[#768b98]">{next.type}</div></div> : <span className="text-[11px] text-[#81939e]">Nicht geplant</span>}</td><td className="px-2 py-3.5"><StatusBadge status={customer.status} /></td><td className="px-2 py-3.5">{customer.reminderConsent && customer.email ? <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#347357]"><CheckCircle2 className="h-3.5 w-3.5" />Erlaubt</span> : <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8a7770]"><BellOff className="h-3.5 w-3.5" />Nicht aktiv</span>}</td><td className="px-4 py-3.5 text-right"><button onClick={() => openCustomer(customer)} className="admin-icon-button ml-auto h-8 w-8" aria-label={`${customer.firstName} ${customer.lastName} bearbeiten`}><Pencil className="h-3.5 w-3.5" /></button></td></tr>; })}</tbody>
              </table>
            </div>
            <div className="divide-y divide-[#e2ebf1] md:hidden">{filtered.map((customer) => { const next = nextAppointment(customer, today); return <article key={customer.id} className="px-4 py-4"><div className="flex items-start gap-3"><Avatar customer={customer} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><button onClick={() => openCustomer(customer)} className="text-left text-[13px] font-semibold text-[#203f57]">{customer.firstName} {customer.lastName}</button><div className="mt-1 flex items-center gap-2"><StatusBadge status={customer.status} />{customer.patientNumber && <span className="text-[9px] text-[#81939e]">Nr. {customer.patientNumber}</span>}</div></div><button onClick={() => openCustomer(customer)} className="admin-icon-button h-8 w-8"><MoreHorizontal className="h-4 w-4" /></button></div><div className="mt-3 grid gap-2 rounded-[11px] bg-[#f5f9fb] p-3"><div className="flex items-center gap-2 text-[11px] text-[#45657a]"><Mail className="h-3.5 w-3.5 text-[#7993a3]" /><span className="truncate">{customer.email || "Keine E-Mail"}</span></div><div className="flex items-center gap-2 text-[11px] text-[#45657a]"><CalendarDays className="h-3.5 w-3.5 text-[#7993a3]" /><span>{next ? `${formatDate(next.date)} · ${next.time} · ${next.type}` : "Kein Termin geplant"}</span></div></div></div></div></article>; })}</div>
          </>
        ) : <EmptyCustomers filtered={filtersActive} onClear={clearFilters} onAdd={() => openCustomer()} />}
      </section>
      <CustomerDialog open={dialogOpen} customer={editing} saving={saving} onOpenChange={setDialogOpen} onSave={save} />
      <ImportWizard open={importOpen} onOpenChange={setImportOpen} onComplete={onRefresh} />
    </AdminShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="relative"><span className="sr-only">{label}</span><select className="admin-field min-w-[170px] w-full appearance-none pr-9" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8492]" /></label>; }
function Avatar({ customer }: { customer: Customer }) { return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#e5f1f7] text-[11px] font-semibold text-[#17496a]">{customer.firstName[0]}{customer.lastName[0]}</span>; }
function StatusBadge({ status }: { status: CustomerStatus }) { const styles = { active: "bg-[#e5f5ec] text-[#276f52]", paused: "bg-[#fff2dc] text-[#91600d]", completed: "bg-[#e5f0f7] text-[#335f7c]", archived: "bg-[#eef1f3] text-[#65737c]" }; return <span className={`inline-flex rounded-[7px] px-2 py-1 text-[9px] font-semibold ${styles[status]}`}>{statusLabels[status]}</span>; }
function nextAppointment(customer: Customer, today: string) { return [...customer.appointments].filter((item) => item.date >= today && ["scheduled", "confirmed", "arrived"].includes(item.status || "scheduled")).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function daysBetween(from: string, to: string) { return Math.ceil((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000); }
function EmptyCustomers({ filtered, onClear, onAdd }: { filtered: boolean; onClear: () => void; onAdd: () => void }) { return <div className="flex min-h-[410px] flex-col items-center justify-center px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e7f3fa] text-[#174e72]"><UsersRound className="h-7 w-7" /></span><h2 className="mt-4 !text-[16px] !font-semibold !text-[#29465c]">{filtered ? "Keine passenden Kund:innen" : "Noch keine Kund:innen angelegt"}</h2><p className="mt-2 max-w-sm !text-[12px] !font-normal !leading-5 !text-[#718692]">{filtered ? "Passen Sie Ihre Suche oder die Filter an." : "Legen Sie den ersten Eintrag manuell an oder importieren Sie eine bestehende Liste."}</p><button onClick={filtered ? onClear : onAdd} className="admin-primary-button mt-5 h-10">{filtered ? <FilterX className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{filtered ? "Filter zurücksetzen" : "Erste Kund:in anlegen"}</button></div>; }

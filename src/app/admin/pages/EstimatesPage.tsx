import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CopyPlus,
  Edit3,
  FileCheck2,
  FileText,
  LoaderCircle,
  Mail,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { AdminShell } from "../AdminShell";
import { adminApi } from "../api";
import type {
  CostEstimate,
  Customer,
  EstimateBundle,
  EstimateCatalogItem,
  EstimateDraft,
  EstimateLineItem,
  EstimateStatus,
} from "../types";

type Props = { customers: Customer[]; onLoggedOut: () => void };
type Mode = "estimates" | "catalog";

const statusLabels: Record<EstimateStatus, string> = {
  draft: "Entwurf",
  in_review: "Zur Prüfung",
  sent: "Versendet",
  accepted: "Angenommen",
  declined: "Abgelehnt",
  expired: "Abgelaufen",
  archived: "Archiviert",
};

const emptyBundle: EstimateBundle = { estimates: [], catalog: [], events: [] };
const defaultTerms = "Dieser Kostenvoranschlag ist unverbindlich und basiert auf dem derzeit bekannten Behandlungsumfang. Tatsächliche Kosten, Erstattungen und Eigenanteile können sich durch den Behandlungsverlauf oder die Entscheidung des Kostenträgers ändern.";

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function newLine(): EstimateLineItem {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `line-${Date.now()}-${Math.random()}`,
    catalogItemId: "",
    position: 1,
    code: "",
    description: "",
    category: "Behandlung",
    quantity: 1,
    unit: "Stück",
    unitPriceCents: 0,
    discountPercent: 0,
    totalCents: 0,
    note: "",
  };
}

function emptyDraft(): EstimateDraft {
  return {
    customerId: "",
    title: "Kieferorthopädischer Kostenvoranschlag",
    diagnosis: "",
    insuranceType: "",
    insurer: "",
    kigLevel: "",
    status: "draft",
    validUntil: dateAfter(30),
    internalNotes: "",
    patientNote: "",
    terms: defaultTerms,
    insuranceShareCents: 0,
    items: [newLine()],
  };
}

function toDraft(estimate: CostEstimate): EstimateDraft {
  return {
    id: estimate.id,
    customerId: estimate.customerId,
    title: estimate.title,
    diagnosis: estimate.diagnosis,
    insuranceType: estimate.insuranceType,
    insurer: estimate.insurer,
    kigLevel: estimate.kigLevel,
    status: estimate.status,
    validUntil: estimate.validUntil,
    internalNotes: estimate.internalNotes,
    patientNote: estimate.patientNote,
    terms: estimate.terms,
    insuranceShareCents: estimate.insuranceShareCents,
    items: estimate.items.map((item) => ({ ...item })),
  };
}

function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((Number(cents) || 0) / 100);
}

function shortDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Die Anfrage konnte nicht verarbeitet werden.";
}

export function EstimatesPage({ customers, onLoggedOut }: Props) {
  const [bundle, setBundle] = useState<EstimateBundle>(emptyBundle);
  const [mode, setMode] = useState<Mode>("estimates");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EstimateStatus | "all">("all");
  const [editor, setEditor] = useState<EstimateDraft | null>(null);
  const [catalogEditor, setCatalogEditor] = useState<EstimateCatalogItem | null | "new">(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setBundle(await adminApi.estimates());
    } catch (error) {
      setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeEstimates = useMemo(() => bundle.estimates.filter((item) => item.status !== "archived"), [bundle.estimates]);
  const filtered = useMemo(() => bundle.estimates.filter((item) => {
    const needle = search.trim().toLowerCase();
    return (status === "all" ? item.status !== "archived" : item.status === status)
      && (!needle || `${item.number} ${item.customerName} ${item.title}`.toLowerCase().includes(needle));
  }), [bundle.estimates, search, status]);

  const metrics = useMemo(() => ({
    open: activeEstimates.filter((item) => item.status === "draft" || item.status === "in_review").length,
    sent: activeEstimates.filter((item) => item.status === "sent").length,
    accepted: activeEstimates.filter((item) => item.status === "accepted").length,
    patientShare: activeEstimates.filter((item) => item.status === "accepted").reduce((sum, item) => sum + item.patientShareCents, 0),
  }), [activeEstimates]);

  function apply(next: EstimateBundle) {
    setBundle(next);
    setEditor(null);
    setCatalogEditor(null);
  }

  async function action(label: string, run: () => Promise<EstimateBundle>) {
    try {
      apply(await run());
      toast.success(label);
    } catch (error) {
      toast.error(errorText(error));
    }
  }

  async function changeStatus(item: CostEstimate, next: EstimateStatus) {
    if (item.status === "accepted") return;
    await action(`Status: ${statusLabels[next]}`, () => adminApi.updateEstimateStatus(item.id, next));
  }

  async function send(item: CostEstimate) {
    if (!item.customerEmail) return toast.error("Bei dieser Patientin oder diesem Patienten fehlt eine E-Mail-Adresse.");
    if (!window.confirm(`Kostenvoranschlag ${item.number} an ${item.customerEmail} senden?`)) return;
    await action("Kostenvoranschlag wurde per E-Mail versendet.", () => adminApi.sendEstimate(item.id));
  }

  async function duplicate(item: CostEstimate) {
    await action("Neue Version wurde als Entwurf angelegt.", () => adminApi.duplicateEstimate(item.id));
  }

  async function archive(item: CostEstimate) {
    if (!window.confirm(`${item.number} archivieren? Der Datensatz bleibt im Verlauf erhalten.`)) return;
    await action("Kostenvoranschlag wurde archiviert.", () => adminApi.archiveEstimate(item.id));
  }

  return (
    <AdminShell
      title="Kostenvoranschläge"
      eyebrow="Behandlungsplanung & Kosten"
      description="Angebote patientenbezogen erstellen, fachlich prüfen, versenden und versioniert nachverfolgen."
      onLoggedOut={onLoggedOut}
      action={mode === "estimates" ? <button className="admin-primary-button" onClick={() => setEditor(emptyDraft())}><Plus className="h-4 w-4" />Neuer Kostenvoranschlag</button> : <button className="admin-primary-button" onClick={() => setCatalogEditor("new")}><Plus className="h-4 w-4" />Neue Leistung</button>}
    >
      <main className="estimate-page">
        <div className="mb-5 inline-flex rounded-[13px] border border-[#c9dbe6] bg-white p-1" aria-label="Arbeitsbereich">
          <button className={`min-h-10 rounded-[10px] px-4 text-[13px] font-semibold ${mode === "estimates" ? "bg-[#063255] text-white" : "text-[#526d80]"}`} aria-pressed={mode === "estimates"} onClick={() => setMode("estimates")}><FileText className="mr-2 inline h-4 w-4" />Übersicht</button>
          <button className={`min-h-10 rounded-[10px] px-4 text-[13px] font-semibold ${mode === "catalog" ? "bg-[#063255] text-white" : "text-[#526d80]"}`} aria-pressed={mode === "catalog"} onClick={() => setMode("catalog")}><ClipboardList className="mr-2 inline h-4 w-4" />Leistungskatalog</button>
        </div>

        {loading ? <Loading /> : loadError ? <LoadError message={loadError} onRetry={load} /> : mode === "catalog" ? (
          <CatalogView bundle={bundle} onEdit={setCatalogEditor} onArchive={async (item) => {
            if (!window.confirm(`Leistung „${item.name}“ deaktivieren? Bereits verwendete Angebote bleiben unverändert.`)) return;
            await action("Katalogposition wurde deaktiviert.", () => adminApi.archiveEstimateCatalogItem(item.id));
          }} />
        ) : (
          <>
            <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Edit3} label="Offen / in Prüfung" value={String(metrics.open)} />
              <Metric icon={Send} label="Versendet" value={String(metrics.sent)} />
              <Metric icon={FileCheck2} label="Angenommen" value={String(metrics.accepted)} success />
              <Metric icon={CircleDollarSign} label="Angenommene Eigenanteile" value={euro(metrics.patientShare)} />
            </section>
            <section className="admin-surface overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[#dfeaf1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div><h2 className="!text-[16px] !font-semibold !text-[#29475d]">Angebotsübersicht</h2><p className="mt-1 !text-[12px] !text-[#708795]">{filtered.length} von {status === "archived" ? bundle.estimates.filter((item) => item.status === "archived").length : activeEstimates.length} Kostenvoranschlägen</p></div>
                <div className="grid gap-2 sm:grid-cols-[minmax(230px,1fr)_180px]">
                  <label className="relative"><span className="sr-only">Kostenvoranschläge durchsuchen</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718895]" /><input className="admin-field admin-field-leading w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nummer oder Patient:in" /></label>
                  <label><span className="sr-only">Nach Status filtern</span><select className="admin-field w-full" value={status} onChange={(event) => setStatus(event.target.value as EstimateStatus | "all")}><option value="all">Alle aktiven Status</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                </div>
              </div>
              {filtered.length ? <EstimateList items={filtered} onOpen={(item) => setEditor(toDraft(item))} onStatus={changeStatus} onPrint={(item) => window.open(adminApi.estimatePrintUrl(item.id), "_blank", "noopener,noreferrer")} onSend={send} onDuplicate={duplicate} onArchive={archive} /> : <EmptyEstimates filtered={Boolean(search || status !== "all")} onNew={() => setEditor(emptyDraft())} />}
            </section>
          </>
        )}
      </main>

      <EstimateEditor open={Boolean(editor)} draft={editor} customers={customers} catalog={bundle.catalog} events={editor?.id ? bundle.events.filter((event) => event.estimateId === editor.id).slice(0, 8) : []} onClose={() => setEditor(null)} onSaved={apply} />
      <CatalogEditor open={catalogEditor !== null} item={catalogEditor === "new" ? null : catalogEditor} onClose={() => setCatalogEditor(null)} onSaved={apply} />
    </AdminShell>
  );
}

function Metric({ icon: Icon, label, value, success }: { icon: typeof FileText; label: string; value: string; success?: boolean }) {
  return <article className="admin-surface flex min-h-[105px] items-center gap-4 p-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${success ? "bg-[#e2f4e9] text-[#2a7150]" : "bg-[#e8f3fa] text-[#245f85]"}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#718794]">{label}</div><strong className="mt-1 block truncate text-[20px] font-semibold text-[#173249]">{value}</strong></div></article>;
}

function EstimateList({ items, onOpen, onStatus, onPrint, onSend, onDuplicate, onArchive }: { items: CostEstimate[]; onOpen: (item: CostEstimate) => void; onStatus: (item: CostEstimate, status: EstimateStatus) => void; onPrint: (item: CostEstimate) => void; onSend: (item: CostEstimate) => void; onDuplicate: (item: CostEstimate) => void; onArchive: (item: CostEstimate) => void }) {
  return <div>
    <div className="hidden grid-cols-[1.05fr_1.5fr_1fr_1fr_1fr_250px] gap-4 border-b border-[#e5edf2] bg-[#f7fafc] px-5 py-3 text-[11px] font-semibold uppercase tracking-[.05em] text-[#718592] xl:grid"><span>Nummer</span><span>Patient:in</span><span>Status</span><span>Gültig bis</span><span className="text-right">Eigenanteil</span><span className="text-right">Aktionen</span></div>
    {items.map((item) => <article key={item.id} className="border-b border-[#e5edf2] p-4 last:border-0 xl:grid xl:grid-cols-[1.05fr_1.5fr_1fr_1fr_1fr_250px] xl:items-center xl:gap-4 xl:px-5 xl:py-4">
      <button onClick={() => onOpen(item)} className="text-left"><span className="block text-[13px] font-semibold text-[#063255]">{item.number}</span><span className="mt-1 block text-[12px] text-[#748895]">Version {item.version} · aktualisiert {shortDate(item.updatedAt)}</span></button>
      <div className="mt-3 xl:mt-0"><div className="text-[13px] font-semibold text-[#29475d]">{item.customerName}</div><div className="mt-1 truncate text-[12px] text-[#748895]">{item.title}</div></div>
      <div className="mt-3 xl:mt-0"><StatusBadge status={item.status} /></div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-[#617989] xl:block"><span className="xl:hidden">Gültig bis</span><span>{shortDate(item.validUntil)}</span></div>
      <div className="mt-2 flex items-center justify-between xl:mt-0 xl:block xl:text-right"><span className="text-[12px] text-[#718592] xl:hidden">Eigenanteil</span><strong className="text-[14px] text-[#173249]">{euro(item.patientShareCents)}</strong></div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 xl:mt-0">
        <button className="admin-icon-button" onClick={() => onOpen(item)} aria-label={`${item.number} öffnen`} title={item.status === "accepted" ? "Details ansehen" : "Bearbeiten"}>{item.status === "accepted" ? <ChevronRight className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}</button>
        <button className="admin-icon-button" onClick={() => onPrint(item)} aria-label={`${item.number} drucken`} title="Drucken / PDF"><Printer className="h-4 w-4" /></button>
        <button className="admin-icon-button" onClick={() => onSend(item)} aria-label={`${item.number} per E-Mail senden`} title="Per E-Mail senden"><Mail className="h-4 w-4" /></button>
        <button className="admin-icon-button" onClick={() => onDuplicate(item)} aria-label={`Neue Version von ${item.number}`} title="Neue Version"><CopyPlus className="h-4 w-4" /></button>
        <button disabled={item.status === "archived"} className="admin-icon-button text-[#9a453f]" onClick={() => onArchive(item)} aria-label={`${item.number} archivieren`} title={item.status === "archived" ? "Bereits archiviert" : "Archivieren"}><Archive className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 xl:col-span-6 xl:mt-2"><label className="flex max-w-full flex-wrap items-center gap-2 text-[12px] leading-5 text-[#647c8b]"><span>Status</span><select className="h-9 max-w-full rounded-[9px] border border-[#cbdbe5] bg-white px-2 text-[12px] text-[#29475d]" disabled={item.status === "accepted" || item.status === "archived"} value={item.status} onChange={(event) => onStatus(item, event.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{item.status === "accepted" && <span>Gesperrt · Änderungen nur als neue Version</span>}</label></div>
    </article>)}
  </div>;
}

function StatusBadge({ status }: { status: EstimateStatus }) {
  const colors: Record<EstimateStatus, string> = { draft: "bg-[#eef3f6] text-[#536c7c]", in_review: "bg-[#fff2da] text-[#8a5b11]", sent: "bg-[#e6f1f8] text-[#275f82]", accepted: "bg-[#e2f4e9] text-[#286b4c]", declined: "bg-[#fff0ef] text-[#9a423b]", expired: "bg-[#f4ecf7] text-[#765080]", archived: "bg-[#eef0f2] text-[#68737c]" };
  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11px] font-semibold ${colors[status]}`}>{statusLabels[status]}</span>;
}

function EmptyEstimates({ filtered, onNew }: { filtered: boolean; onNew: () => void }) {
  return <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e8f3fa] text-[#245f85]"><FileText className="h-7 w-7" /></span><h3 className="mt-4 text-[16px] font-semibold text-[#29475d]">{filtered ? "Keine passenden Kostenvoranschläge" : "Noch keine Kostenvoranschläge"}</h3><p className="mt-2 max-w-md text-[13px] leading-5 text-[#718592]">{filtered ? "Ändern Sie Suche oder Statusfilter." : "Erstellen Sie den ersten patientenbezogenen Entwurf. Preise werden erst durch die Praxis gepflegt."}</p>{!filtered && <button className="admin-primary-button mt-5" onClick={onNew}><Plus className="h-4 w-4" />Ersten Entwurf anlegen</button>}</div>;
}

function Loading() { return <div className="admin-surface flex min-h-[430px] flex-col items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#f58a07]" /><p className="mt-4 text-[13px] text-[#657d8c]">Kostenvoranschläge werden geladen …</p></div>; }
function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="admin-surface flex min-h-[380px] flex-col items-center justify-center px-6 text-center"><h2 className="text-[16px] font-semibold text-[#29475d]">Kostenvoranschläge nicht erreichbar</h2><p className="mt-2 max-w-lg text-[13px] leading-5 text-[#718592]">{message}</p><button onClick={onRetry} className="admin-primary-button mt-5"><RefreshCw className="h-4 w-4" />Erneut laden</button></div>; }

function CatalogView({ bundle, onEdit, onArchive }: { bundle: EstimateBundle; onEdit: (item: EstimateCatalogItem) => void; onArchive: (item: EstimateCatalogItem) => void }) {
  const [search, setSearch] = useState("");
  const items = bundle.catalog.filter((item) => item.active && (!search.trim() || `${item.code} ${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())));
  return <section className="admin-surface overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#dfeaf1] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-[16px] font-semibold text-[#29475d]">Leistungskatalog</h2><p className="mt-1 text-[12px] leading-5 text-[#708795]">Nur fachlich geprüfte Praxiswerte. Keine Gebührenposition ist vorbelegt.</p></div><label className="relative"><span className="sr-only">Leistungskatalog durchsuchen</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718895]" /><input className="admin-field admin-field-leading w-full sm:w-[280px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, Leistung, Kategorie" /></label></div>{items.length ? <div>{items.map((item) => <article key={item.id} className="grid gap-3 border-b border-[#e5edf2] p-4 last:border-0 sm:grid-cols-[90px_1fr_160px_130px_100px] sm:items-center sm:px-5"><div className="text-[12px] font-semibold text-[#587083]">{item.code || "Ohne Code"}</div><div><div className="text-[13px] font-semibold text-[#29475d]">{item.name}</div><div className="mt-1 text-[12px] text-[#748895]">{item.category} · {item.unit}{item.externalReference ? ` · Ref. ${item.externalReference}` : ""}</div></div><div className="text-[12px] text-[#617989]">{item.calculationType === "points" ? `${item.points} Punkte × ${item.pointValue.toLocaleString("de-DE")} €` : "Festpreis"}</div><strong className="text-[14px] text-[#173249] sm:text-right">{euro(item.computedUnitPriceCents)}</strong><div className="flex justify-end gap-2"><button className="admin-icon-button" onClick={() => onEdit(item)} aria-label={`${item.name} bearbeiten`} title="Bearbeiten"><Edit3 className="h-4 w-4" /></button><button className="admin-icon-button text-[#9a453f]" onClick={() => onArchive(item)} aria-label={`${item.name} deaktivieren`} title="Deaktivieren"><Trash2 className="h-4 w-4" /></button></div></article>)}</div> : <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><ClipboardList className="h-8 w-8 text-[#7898ad]" /><h3 className="mt-4 text-[15px] font-semibold text-[#29475d]">{search ? "Keine passende Leistung" : "Katalog ist noch leer"}</h3><p className="mt-2 max-w-md text-[13px] text-[#718592]">Legen Sie geprüfte Praxisleistungen, Material- oder Laborkosten selbst an.</p></div>}</section>;
}

function EstimateEditor({ open, draft, customers, catalog, events, onClose, onSaved }: { open: boolean; draft: EstimateDraft | null; customers: Customer[]; catalog: EstimateCatalogItem[]; events: EstimateBundle["events"]; onClose: () => void; onSaved: (bundle: EstimateBundle) => void }) {
  const [form, setForm] = useState<EstimateDraft>(emptyDraft());
  const [patientSearch, setPatientSearch] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (draft) { setForm({ ...draft, items: draft.items.map((item) => ({ ...item })) }); setPatientSearch(""); setError(""); } }, [draft]);
  const locked = form.status === "accepted";
  const selectedCustomer = customers.find((item) => item.id === form.customerId);
  const patientMatches = customers.filter((item) => `${item.firstName} ${item.lastName} ${item.patientNumber || ""}`.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 8);
  const subtotal = form.items.reduce((sum, item) => sum + Math.max(0, Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100))), 0);
  const insurerShare = Math.min(subtotal, Math.max(0, form.insuranceShareCents));
  const patientShare = subtotal - insurerShare;

  function updateLine(index: number, patch: Partial<EstimateLineItem>) {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }
  function addCatalogLine() {
    const item = catalog.find((entry) => entry.id === catalogId);
    if (!item) return;
    setForm((current) => ({ ...current, items: [...current.items, { ...newLine(), catalogItemId: item.id, position: current.items.length + 1, code: item.code, description: item.name, category: item.category, unit: item.unit, unitPriceCents: item.computedUnitPriceCents }] }));
    setCatalogId("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked) return;
    if (!form.customerId) return setError("Bitte wählen Sie eine Patientin oder einen Patienten aus.");
    if (!form.items.length || form.items.some((item) => !item.description.trim())) return setError("Bitte ergänzen Sie für jede Position eine Bezeichnung.");
    setSaving(true); setError("");
    try { onSaved(await adminApi.saveEstimate({ ...form, insuranceShareCents: insurerShare, items: form.items.map((item, index) => ({ ...item, position: index + 1, totalCents: Math.max(0, Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100))) })) })); toast.success(form.id ? "Kostenvoranschlag wurde gespeichert." : "Kostenvoranschlag wurde angelegt."); }
    catch (requestError) { setError(errorText(requestError)); }
    finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent className="admin-root admin-work-dialog admin-estimate-dialog estimate-ui flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]"><DialogHeader className="shrink-0 border-b border-[#dbe7ee] px-5 py-5 pr-14 sm:px-7"><DialogTitle className="!text-[19px] !font-semibold !text-[#173249]">{form.id ? "Kostenvoranschlag prüfen" : "Kostenvoranschlag anlegen"}</DialogTitle><DialogDescription className="mt-1 !text-[13px] !text-[#657d8c]">Patient:in, Leistungsumfang und erwartete Kosten transparent zusammenführen.</DialogDescription></DialogHeader><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-dialog-scroll min-h-0 flex-1 overflow-y-auto"><div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-6">
    {locked && <div className="flex items-start gap-3 rounded-[12px] border border-[#bcdac8] bg-[#eef9f2] p-4 text-[13px] leading-5 text-[#286548]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Angenommener Stand ist gesperrt.</strong><br />Nutzen Sie in der Übersicht „Neue Version“, wenn sich die Planung ändert.</div></div>}
    <Section title="Patient:in & Grundlage" text="Der aktuelle Patientenstamm wird beim Speichern als Angebotsstand dokumentiert."><Field label="Patient:in suchen"><input disabled={locked} className="admin-field w-full" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Name oder Patientennummer" /></Field>{!selectedCustomer && patientSearch && <div className="mt-2 grid gap-2 sm:grid-cols-2">{patientMatches.map((customer) => <button type="button" key={customer.id} onClick={() => { setForm((current) => ({ ...current, customerId: customer.id, insuranceType: current.insuranceType || customer.insuranceType || "", insurer: current.insurer || customer.insurer || "" })); setPatientSearch(""); }} className="min-h-11 rounded-[10px] border border-[#cbdce6] px-3 text-left text-[13px] text-[#29475d] hover:border-[#6f96ae]"><strong>{customer.firstName} {customer.lastName}</strong><span className="ml-2 text-[#718592]">{customer.patientNumber || ""}</span></button>)}</div>}{selectedCustomer && <div className="mt-2 flex items-center justify-between rounded-[11px] border border-[#bcd3e1] bg-[#edf7fd] p-3"><div className="text-[13px] text-[#29475d]"><strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong><span className="ml-2 text-[#688092]">{selectedCustomer.patientNumber ? `Pat.-Nr. ${selectedCustomer.patientNumber}` : selectedCustomer.email}</span></div>{!locked && <button type="button" className="admin-icon-button" onClick={() => setForm((current) => ({ ...current, customerId: "" }))} aria-label="Patientenauswahl entfernen"><X className="h-4 w-4" /></button>}</div>}<div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]"><Field label="Titel"><input disabled={locked} className="admin-field w-full" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="Gültig bis"><input disabled={locked} type="date" className="admin-field w-full" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Versicherungsart"><select disabled={locked} className="admin-field w-full" value={form.insuranceType} onChange={(event) => setForm((current) => ({ ...current, insuranceType: event.target.value }))}><option value="">Nicht angegeben</option><option value="gesetzlich">Gesetzlich</option><option value="privat">Privat</option><option value="selbstzahler">Selbstzahler</option></select></Field><Field label="Kostenträger"><input disabled={locked} className="admin-field w-full" value={form.insurer} onChange={(event) => setForm((current) => ({ ...current, insurer: event.target.value }))} /></Field><Field label="KIG (optional)"><input disabled={locked} className="admin-field w-full" value={form.kigLevel} onChange={(event) => setForm((current) => ({ ...current, kigLevel: event.target.value }))} placeholder="z. B. KIG D4" /></Field></div><Field label="Diagnose / Behandlungsziel" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[110px] w-full" value={form.diagnosis} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} /></Field></Section>
    <Section title="Leistungspositionen" text="Katalogpreise werden als Snapshot übernommen und können für diesen Entwurf angepasst werden.">{!locked && <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><select className="admin-field w-full" value={catalogId} onChange={(event) => setCatalogId(event.target.value)}><option value="">Leistung aus Katalog wählen</option>{catalog.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ` : ""}{item.name} · {euro(item.computedUnitPriceCents)}</option>)}</select><button type="button" disabled={!catalogId} className="admin-secondary-button" onClick={addCatalogLine}><Plus className="h-4 w-4" />Übernehmen</button><button type="button" className="admin-secondary-button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, { ...newLine(), position: current.items.length + 1 }] }))}><Plus className="h-4 w-4" />Freie Position</button></div>}<div className="space-y-3">{form.items.map((item, index) => <div key={item.id} className="rounded-[13px] border border-[#d8e5ed] bg-[#fbfdfe] p-4"><div className="grid gap-3 lg:grid-cols-[90px_minmax(220px,1fr)_90px_110px_100px_42px]"><Field label="Code"><input disabled={locked} className="admin-field w-full" value={item.code} onChange={(event) => updateLine(index, { code: event.target.value })} /></Field><Field label="Leistung *"><input disabled={locked} className="admin-field w-full" value={item.description} onChange={(event) => updateLine(index, { description: event.target.value })} /></Field><Field label="Menge"><input disabled={locked} type="number" min="0.01" step="0.01" className="admin-field w-full" value={item.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></Field><Field label="Einzelpreis €"><input disabled={locked} type="number" min="0" step="0.01" className="admin-field w-full" value={(item.unitPriceCents / 100).toFixed(2)} onChange={(event) => updateLine(index, { unitPriceCents: Math.round(Number(event.target.value) * 100) })} /></Field><Field label="Rabatt %"><input disabled={locked} type="number" min="0" max="100" step="0.1" className="admin-field w-full" value={item.discountPercent} onChange={(event) => updateLine(index, { discountPercent: Number(event.target.value) })} /></Field>{!locked && <button type="button" className="admin-icon-button mt-[27px] text-[#9a453f]" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Position ${index + 1} entfernen`}><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]"><Field label="Einheit"><input disabled={locked} className="admin-field w-full" value={item.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} /></Field><Field label="Positionshinweis"><input disabled={locked} className="admin-field w-full" value={item.note} onChange={(event) => updateLine(index, { note: event.target.value })} /></Field><div className="self-end pb-2 text-right text-[13px] text-[#607887]">Positionssumme <strong className="ml-2 text-[15px] text-[#173249]">{euro(Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100)))}</strong></div></div></div>)}</div></Section>
    <Section title="Hinweise & Dokumentation" text="Patientenhinweise erscheinen im Ausdruck; interne Notizen bleiben ausschließlich in der Verwaltung."><Field label="Hinweis für Patient:innen"><textarea disabled={locked} className="admin-field min-h-[95px] w-full" value={form.patientNote} onChange={(event) => setForm((current) => ({ ...current, patientNote: event.target.value }))} /></Field><Field label="Bedingungen / Kostenträgerhinweis" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[120px] w-full" value={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))} /></Field><Field label="Interne Notiz" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[90px] w-full" value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} /></Field></Section>
  </div><aside className="space-y-4 xl:sticky xl:top-0 xl:self-start"><div className="overflow-hidden rounded-[16px] border border-[#174b70] bg-[#063255] text-white"><div className="border-b border-white/10 p-5"><div className="text-[12px] font-semibold uppercase tracking-[.08em] text-[#a9c5d6]">Finanzielle Übersicht</div><div className="mt-5 space-y-3 text-[13px]"><div className="flex justify-between"><span className="text-[#c4d8e4]">Behandlungssumme</span><strong>{euro(subtotal)}</strong></div><label className="block border-y border-white/10 py-4"><span className="mb-2 block text-[#c4d8e4]">Erwartete Kassenbeteiligung</span><div className="relative"><input disabled={locked} type="number" min="0" max={subtotal / 100} step="0.01" className="h-11 w-full rounded-[10px] border border-white/20 bg-white/10 px-3 pr-8 text-right text-[15px] font-semibold text-white outline-none focus:ring-2 focus:ring-[#f58a07]" value={(form.insuranceShareCents / 100).toFixed(2)} onChange={(event) => setForm((current) => ({ ...current, insuranceShareCents: Math.round(Number(event.target.value) * 100) }))} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5d8e3]">€</span></div><small className="mt-2 block text-[11px] leading-4 text-[#9fbbcb]">Manuelle Erwartung, keine Erstattungszusage.</small></label></div></div><div className="bg-[#0b4167] p-5"><div className="text-[12px] text-[#bcd3e1]">Voraussichtlicher Eigenanteil</div><strong className="mt-2 block text-[27px] font-semibold text-white">{euro(patientShare)}</strong></div></div>{form.id && <div className="admin-surface p-4"><h3 className="text-[13px] font-semibold text-[#29475d]">Letzte Aktivitäten</h3>{events.length ? <ol className="mt-3 space-y-3">{events.map((event) => <li key={event.id} className="border-l-2 border-[#d7e5ed] pl-3 text-[11px] leading-4 text-[#6c8290]"><strong className="block text-[12px] text-[#3c586c]">{event.detail}</strong>{new Date(event.createdAt).toLocaleString("de-DE")}</li>)}</ol> : <p className="mt-2 text-[12px] text-[#718592]">Noch keine Aktivitäten.</p>}</div>}</aside></div></div><div className="shrink-0 border-t border-[#dce7ee] bg-[#fbfdfe] px-5 py-4 sm:px-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{error ? <div className="rounded-[10px] bg-[#fff0ef] px-3 py-2 text-[12px] text-[#963c36]">{error}</div> : <div className="text-[12px] text-[#6b8291]">Summen werden beim Speichern serverseitig erneut berechnet.</div>}<div className="flex justify-end gap-2"><button type="button" className="admin-secondary-button" onClick={onClose}>Schließen</button>{!locked && <button type="submit" disabled={saving} className="admin-primary-button">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Wird gespeichert …" : "Sicher speichern"}</button>}</div></div></div></form></DialogContent></Dialog>;
}

function CatalogEditor({ open, item, onClose, onSaved }: { open: boolean; item: EstimateCatalogItem | null; onClose: () => void; onSaved: (bundle: EstimateBundle) => void }) {
  const [form, setForm] = useState({ id: "", code: "", name: "", description: "", category: "Behandlung", calculationType: "fixed" as "fixed" | "points", points: 0, pointValue: 0, unitPrice: 0, unit: "Stück", active: true, externalReference: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setForm(item ? { id: item.id, code: item.code, name: item.name, description: item.description, category: item.category, calculationType: item.calculationType, points: item.points, pointValue: item.pointValue, unitPrice: item.unitPriceCents / 100, unit: item.unit, active: item.active, externalReference: item.externalReference } : { id: "", code: "", name: "", description: "", category: "Behandlung", calculationType: "fixed", points: 0, pointValue: 0, unitPrice: 0, unit: "Stück", active: true, externalReference: "" }); setError(""); }, [item, open]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!form.name.trim()) return setError("Bitte geben Sie eine Bezeichnung ein."); setSaving(true); setError(""); try { onSaved(await adminApi.saveEstimateCatalogItem({ id: form.id || undefined, code: form.code, name: form.name, description: form.description, category: form.category, calculationType: form.calculationType, points: form.points, pointValue: form.pointValue, unitPriceCents: Math.round(form.unitPrice * 100), unit: form.unit, active: form.active, externalReference: form.externalReference })); toast.success("Katalogposition wurde gespeichert."); } catch (requestError) { setError(errorText(requestError)); } finally { setSaving(false); } }
  const computed = form.calculationType === "points" ? form.points * form.pointValue : form.unitPrice;
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent className="admin-root admin-work-dialog admin-catalog-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><DialogHeader className="border-b border-[#dce8ef] px-6 py-5 pr-14"><DialogTitle className="text-[18px] font-semibold text-[#173249]">{item ? "Katalogposition bearbeiten" : "Katalogposition anlegen"}</DialogTitle><DialogDescription className="mt-1 text-[12px] text-[#687f8e]">Nur fachlich geprüfte Praxiswerte eintragen.</DialogDescription></DialogHeader><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-dialog-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-6"><div className="grid gap-4 sm:grid-cols-[140px_1fr]"><Field label="Code / Position"><input className="admin-field w-full" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} /></Field><Field label="Bezeichnung *"><input className="admin-field w-full" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Kategorie"><input className="admin-field w-full" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></Field><Field label="Einheit"><input className="admin-field w-full" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></Field></div><Field label="Beschreibung"><textarea className="admin-field min-h-[90px] w-full" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field><div className="grid grid-cols-2 gap-2"><button type="button" className={`min-h-12 rounded-[11px] border px-3 text-[13px] font-semibold ${form.calculationType === "fixed" ? "border-[#063255] bg-[#e9f3f9] text-[#063255]" : "border-[#ccdae4] text-[#637b8a]"}`} onClick={() => setForm((current) => ({ ...current, calculationType: "fixed" }))}>Festpreis</button><button type="button" className={`min-h-12 rounded-[11px] border px-3 text-[13px] font-semibold ${form.calculationType === "points" ? "border-[#063255] bg-[#e9f3f9] text-[#063255]" : "border-[#ccdae4] text-[#637b8a]"}`} onClick={() => setForm((current) => ({ ...current, calculationType: "points" }))}>Punkte × Punktwert</button></div>{form.calculationType === "fixed" ? <Field label="Preis pro Einheit (€)"><input type="number" min="0" step="0.01" className="admin-field w-full" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} /></Field> : <div className="grid gap-4 sm:grid-cols-2"><Field label="Punkte"><input type="number" min="0" step="0.001" className="admin-field w-full" value={form.points} onChange={(event) => setForm((current) => ({ ...current, points: Number(event.target.value) }))} /></Field><Field label="Punktwert (€)"><input type="number" min="0" step="0.000001" className="admin-field w-full" value={form.pointValue} onChange={(event) => setForm((current) => ({ ...current, pointValue: Number(event.target.value) }))} /></Field></div>}<div className="rounded-[12px] border border-[#c9dce7] bg-[#edf7fd] p-4"><div className="text-[12px] text-[#687f8e]">Berechneter Einheitspreis</div><strong className="mt-1 block text-[21px] text-[#173249]">{computed.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong><p className="mt-2 text-[11px] leading-4 text-[#6e8391]">Keine automatische Gebührenbewertung. Code, Punktzahl und Punktwert müssen von der Praxis geprüft werden.</p></div><Field label="ivoris / externe Referenz (optional)"><input className="admin-field w-full" value={form.externalReference} onChange={(event) => setForm((current) => ({ ...current, externalReference: event.target.value }))} /></Field></div><div className="border-t border-[#dce8ef] bg-[#fbfdfe] px-6 py-4"><div className="flex items-center justify-between gap-3">{error ? <div className="text-[12px] text-[#963c36]">{error}</div> : <span />}<div className="flex gap-2"><button type="button" className="admin-secondary-button" onClick={onClose}>Abbrechen</button><button type="submit" disabled={saving} className="admin-primary-button">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Speichern</button></div></div></div></form></DialogContent></Dialog>;
}

function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <section className="rounded-[15px] border border-[#dce8ef] bg-white p-4 sm:p-5"><h3 className="text-[15px] font-semibold text-[#29475d]">{title}</h3><p className="mb-5 mt-1 text-[12px] leading-5 text-[#718592]">{text}</p>{children}</section>; }
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={className}><span className="admin-label">{label}</span>{children}</label>; }

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CopyPlus,
  Database,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
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
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { AdminShell } from "../AdminShell";
import { adminApi } from "../api";
import { EstimateImportDialog } from "../components/EstimateImportDialog";
import type {
  CostEstimate,
  Customer,
  EstimateBundle,
  EstimateCatalogItem,
  EstimateDraft,
  EstimateLineItem,
  EstimatePointValue,
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

const statusTransitions: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["draft", "sent", "archived"],
  sent: ["accepted", "declined", "expired", "archived"],
  accepted: ["archived"],
  declined: ["archived"],
  expired: ["archived"],
  archived: [],
};

const emptyBundle: EstimateBundle = { estimates: [], catalog: [], events: [], pointValues: [] };
const defaultTerms = "Dieser Kostenvoranschlag ist unverbindlich und basiert auf dem derzeit bekannten Behandlungsumfang. Tatsächliche Kosten, Erstattungen und Eigenanteile können sich durch den Behandlungsverlauf oder die Entscheidung des Kostenträgers ändern.";

function dateAfter(days: number) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
  const [year, month, day] = formatter.format(new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
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
    feeSystem: "private",
    points: 0,
    pointValue: 0,
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
    pointValueQuarter: currentQuarter(),
    insurerGroup: "",
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
    updatedAt: estimate.updatedAt,
    customerId: estimate.customerId,
    title: estimate.title,
    diagnosis: estimate.diagnosis,
    insuranceType: estimate.insuranceType,
    insurer: estimate.insurer,
    kigLevel: estimate.kigLevel,
    pointValueQuarter: estimate.pointValueQuarter,
    insurerGroup: estimate.insurerGroup,
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

function currentQuarter() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || String(new Date().getFullYear());
  const month = Number(parts.find((part) => part.type === "month")?.value || 1);
  return `${year}Q${Math.ceil(month / 3)}`;
}

function formatQuarter(value: string) {
  const match = /^(\d{4})-?Q([1-4])$/i.exec(value);
  return match ? `${match[2]}. Quartal ${match[1]}` : value || "ohne Quartal";
}

function formatPointValue(value: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(Number(value) || 0);
}

function normalizedCents(value: number) {
  return Math.round(Number(value) || 0);
}

function formatCentsInput(value: number) {
  return (normalizedCents(value) / 100).toFixed(2);
}

function formatCentsDisplay(value: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(normalizedCents(value) / 100);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date) : "–";
}

function resolvePointValue(pointValues: EstimatePointValue[], quarter: string, fundType: string) {
  return pointValues
    .filter((item) => item.quarter === quarter && item.fundType === fundType && item.pwKfo > 0)
    .sort((a, b) => a.fundGroup - b.fundGroup)[0];
}

function inferInsurerGroup(insurer: string) {
  const value = insurer.toLocaleLowerCase("de");
  if (!value.trim()) return "";
  if (/\baok\b/.test(value)) return "1";
  if (/\bbkk\b|betriebskrankenkasse/.test(value)) return "2";
  if (/\bikk\b|innungskrankenkasse/.test(value)) return "3";
  if (/landwirtschaft|\blkk\b|svlfg/.test(value)) return "4";
  if (/knappschaft/.test(value)) return "6";
  if (/\btk\b|techniker|barmer|\bdak\b|\bkkh\b|\bhek\b|\bhkk\b|ersatzkasse/.test(value)) return "8";
  return "";
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
  const [acting, setActing] = useState(false);

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
    if (acting) return;
    setActing(true);
    try {
      apply(await run());
      toast.success(label);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setActing(false);
    }
  }

  async function changeStatus(item: CostEstimate, next: EstimateStatus) {
    if (item.status === "archived" || item.status === next) return;
    if (next === "sent" && !window.confirm(`${item.number} als sicher übergeben markieren? Der Inhalt dieses Stands wird anschließend gesperrt.`)) return;
    if (next === "accepted" && !window.confirm(`${item.number} wirklich als angenommen markieren? Dieser Stand bleibt anschließend unveränderlich.`)) return;
    if (next === "archived" && !window.confirm(`${item.number} archivieren? Der Stand bleibt unveränderlich im Verlauf erhalten.`)) return;
    await action(`Status: ${statusLabels[next]}`, () => adminApi.updateEstimateStatus(item.id, next));
  }

  async function send(item: CostEstimate) {
    if (!["draft", "in_review"].includes(item.status)) return toast.error("Dieser Stand ist bereits versendet oder abgeschlossen. Bitte erstellen Sie eine neue Version.");
    if (item.pickupNoticeSent) return toast.error("Der neutrale Abholhinweis wurde bereits versendet.");
    const recipient = customers.find((customer) => customer.id === item.customerId)?.email?.trim();
    if (!recipient) return toast.error("Bei dieser Patientin oder diesem Patienten fehlt eine aktuelle E-Mail-Adresse.");
    if (!window.confirm(`Neutralen E-Mail-Hinweis zu ${item.number} an die aktuell hinterlegte Adresse ${recipient} senden?`)) return;
    await action("Neutraler Abholhinweis wurde per E-Mail versendet.", () => adminApi.sendEstimate(item.id));
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
      description="Kostenvoranschläge patientenbezogen erstellen, fachlich prüfen, sicher übergeben und versioniert nachverfolgen."
      onLoggedOut={onLoggedOut}
      action={mode === "estimates" ? <button className="admin-primary-button" onClick={() => setEditor(emptyDraft())}><Plus className="h-4 w-4" />Neuer Kostenvoranschlag</button> : <button className="admin-primary-button" onClick={() => setCatalogEditor("new")}><Plus className="h-4 w-4" />Neue Leistung</button>}
    >
      <main className="estimate-page">
        <div className="mb-5 grid w-full grid-cols-2 rounded-[13px] border border-[#c9dbe6] bg-white p-1 sm:inline-flex sm:w-auto" aria-label="Arbeitsbereich">
          <button className={`min-h-10 rounded-[10px] px-4 text-[13px] font-semibold ${mode === "estimates" ? "bg-[#063255] text-white" : "text-[#526d80]"}`} aria-pressed={mode === "estimates"} onClick={() => setMode("estimates")}><FileText className="mr-2 inline h-4 w-4" />Übersicht</button>
          <button className={`min-h-10 rounded-[10px] px-2 text-[12px] font-semibold sm:px-4 sm:text-[13px] ${mode === "catalog" ? "bg-[#063255] text-white" : "text-[#526d80]"}`} aria-pressed={mode === "catalog"} onClick={() => setMode("catalog")}><ClipboardList className="mr-1.5 inline h-4 w-4 sm:mr-2" /><span className="sm:hidden">Katalog &amp; Punktwerte</span><span className="hidden sm:inline">Leistungskatalog &amp; Punktwerte</span></button>
        </div>

        {loading ? <Loading /> : loadError ? <LoadError message={loadError} onRetry={load} /> : mode === "catalog" ? (
          <CatalogWorkspace bundle={bundle} busy={acting} onBundle={apply} onAction={action} onEdit={setCatalogEditor} onArchive={async (item) => {
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
              {filtered.length ? <EstimateList items={filtered} busy={acting} onOpen={(item) => setEditor(toDraft(item))} onStatus={changeStatus} onPrint={(item) => window.open(adminApi.estimatePrintUrl(item.id), "_blank", "noopener,noreferrer")} onSend={send} onDuplicate={duplicate} onArchive={archive} /> : <EmptyEstimates filtered={Boolean(search || status !== "all")} onNew={() => setEditor(emptyDraft())} />}
            </section>
          </>
        )}
      </main>

      <EstimateEditor open={Boolean(editor)} draft={editor} customers={customers} catalog={bundle.catalog} pointValues={bundle.pointValues} events={editor?.id ? bundle.events.filter((event) => event.estimateId === editor.id).slice(0, 8) : []} onClose={() => setEditor(null)} onSaved={apply} />
      <CatalogEditor open={catalogEditor !== null} item={catalogEditor === "new" ? null : catalogEditor} onClose={() => setCatalogEditor(null)} onSaved={apply} />
    </AdminShell>
  );
}

function Metric({ icon: Icon, label, value, success }: { icon: typeof FileText; label: string; value: string; success?: boolean }) {
  return <article className="admin-surface flex min-h-[105px] items-center gap-4 p-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${success ? "bg-[#e2f4e9] text-[#2a7150]" : "bg-[#e8f3fa] text-[#245f85]"}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><div className="truncate text-[12px] text-[#718794]">{label}</div><strong className="mt-1 block truncate text-[20px] font-semibold text-[#173249]">{value}</strong></div></article>;
}

function EstimateList({ items, busy, onOpen, onStatus, onPrint, onSend, onDuplicate, onArchive }: { items: CostEstimate[]; busy: boolean; onOpen: (item: CostEstimate) => void; onStatus: (item: CostEstimate, status: EstimateStatus) => void; onPrint: (item: CostEstimate) => void; onSend: (item: CostEstimate) => void; onDuplicate: (item: CostEstimate) => void; onArchive: (item: CostEstimate) => void }) {
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
        <button disabled={busy || item.pickupNoticeSent || !["draft", "in_review"].includes(item.status)} className="admin-icon-button" onClick={() => onSend(item)} aria-label={`Neutralen Abholhinweis zu ${item.number} senden`} title={item.pickupNoticeSent ? "Abholhinweis bereits gesendet" : ["draft", "in_review"].includes(item.status) ? "Neutralen Abholhinweis senden" : "Bereits übergeben oder abgeschlossen"}><Mail className="h-4 w-4" /></button>
        <button disabled={busy} className="admin-icon-button" onClick={() => onDuplicate(item)} aria-label={`Neue Version von ${item.number}`} title="Neue Version"><CopyPlus className="h-4 w-4" /></button>
        <button disabled={busy || item.status === "archived"} className="admin-icon-button text-[#9a453f]" onClick={() => onArchive(item)} aria-label={`${item.number} archivieren`} title={item.status === "archived" ? "Bereits archiviert" : "Archivieren"}><Archive className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 xl:col-span-6 xl:mt-2"><label className="flex max-w-full flex-wrap items-center gap-2 text-[12px] leading-5 text-[#647c8b]"><span>Status</span><select className="h-9 max-w-full rounded-[9px] border border-[#cbdbe5] bg-white px-2 text-[12px] text-[#29475d]" disabled={busy || statusTransitions[item.status].length === 0} value={item.status} onChange={(event) => onStatus(item, event.target.value as EstimateStatus)}>{Object.entries(statusLabels).filter(([key]) => key === item.status || statusTransitions[item.status].includes(key as EstimateStatus)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{!["draft", "in_review"].includes(item.status) && <span>Inhalt gesperrt · Änderungen nur als neue Version</span>}</label></div>
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

type PointValueView = {
  id: string;
  quarter: string;
  fundGroup: number;
  fundType: string;
  fundTypeLabel: string;
  fundNumber: string;
  pwKfo: number;
  source: string;
  sourceUrl: string;
  importedAt: string;
};

function CatalogWorkspace({ bundle, busy, onBundle, onAction, onEdit, onArchive }: {
  bundle: EstimateBundle;
  busy: boolean;
  onBundle: (bundle: EstimateBundle) => void;
  onAction: (label: string, run: () => Promise<EstimateBundle>) => Promise<void>;
  onEdit: (item: EstimateCatalogItem) => void;
  onArchive: (item: EstimateCatalogItem) => void;
}) {
  const [importKind, setImportKind] = useState<"catalog" | "pointValues" | null>(null);
  const pointValues = ((bundle as EstimateBundle & { pointValues?: PointValueView[] }).pointValues ?? []);
  const quarters = Array.from(new Set(pointValues.map((item) => item.quarter))).sort().reverse();
  const [quarter, setQuarter] = useState(currentQuarter());
  const visiblePointValues = pointValues.filter((item) => item.quarter === quarter).sort((a, b) => a.fundType.localeCompare(b.fundType, "de", { numeric: true }) || a.fundGroup - b.fundGroup);

  useEffect(() => {
    if (!pointValues.some((item) => item.quarter === quarter) && quarters[0]) setQuarter(quarters[0]);
  }, [pointValues, quarter, quarters]);

  return <div className="space-y-5">
    <section className="admin-surface border-l-4 border-l-[#2f769d] p-4 sm:p-5">
      <div className="flex items-start gap-3"><Database className="mt-0.5 h-5 w-5 shrink-0 text-[#245f85]" /><div><h2 className="text-[15px] font-semibold text-[#29475d]">Verlässliche Berechnungsgrundlage</h2><p className="mt-1 max-w-4xl text-[12px] leading-5 text-[#657d8c]">Die BEMA-Punktzahlen werden bundesweit durch die KZBV festgelegt. Der KFO-Punktwert wird dagegen von der KZVB quartalsweise je Kassenart veröffentlicht. Beim Übernehmen in einen Kostenvoranschlag werden beide Werte als damaliger Berechnungsstand gespeichert.</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold"><a className="inline-flex items-center gap-1.5 text-[#1e638b] underline decoration-[#9dbdce] underline-offset-2 hover:text-[#063255]" href="https://www.kzbv.de/wp-content/uploads/KZBV_BEMA_Kurzfassung_2026-01-01.pdf" target="_blank" rel="noreferrer">KZBV: BEMA 2026 <ExternalLink className="h-3.5 w-3.5" /></a><a className="inline-flex items-center gap-1.5 text-[#1e638b] underline decoration-[#9dbdce] underline-offset-2 hover:text-[#063255]" href="https://www.kzvb.de/abrechnung/punktwerte" target="_blank" rel="noreferrer">KZVB: aktuelle Punktwerte <ExternalLink className="h-3.5 w-3.5" /></a></div></div></div>
    </section>

    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#dfeaf1] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="admin-kicker">Bundeseinheitlicher Katalog</div><h2 className="mt-1 text-[17px] font-semibold text-[#29475d]">BEMA-Leistungen</h2><p className="mt-1 text-[12px] leading-5 text-[#708795]">{bundle.catalog.filter((item) => item.active).length} aktive Positionen · Punktzahlen bleiben unabhängig vom Quartal.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><button disabled={busy} className="admin-primary-button" onClick={() => onAction("Offizieller BEMA-Katalog 2026 wurde aktualisiert.", () => adminApi.importOfficialBemaCatalog())}><FileCheck2 className="h-4 w-4" />BEMA 2026 übernehmen</button><button disabled={busy} className="admin-secondary-button" onClick={() => setImportKind("catalog")}><UploadCloud className="h-4 w-4" />CSV / XLSX importieren</button></div>
      </div>
      <CatalogLedger items={bundle.catalog} onEdit={onEdit} onArchive={onArchive} />
    </section>

    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#dfeaf1] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="admin-kicker">Quartalswerte Bayern</div><h2 className="mt-1 text-[17px] font-semibold text-[#29475d]">KZVB-Punktwerte</h2><p className="mt-1 text-[12px] leading-5 text-[#708795]">KFO-Punktwerte nach Quartal und Kassenart. Die Quelle und der Importzeitpunkt bleiben nachvollziehbar.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><button disabled={busy} className="admin-primary-button" onClick={() => onAction(`${formatQuarter(currentQuarter())} wurde von der KZVB abgerufen.`, () => adminApi.syncKzvbPointValues(currentQuarter()))}><RefreshCw className="h-4 w-4" />Aktuelles Quartal abrufen</button><button disabled={busy} className="admin-secondary-button" onClick={() => setImportKind("pointValues")}><FileSpreadsheet className="h-4 w-4" />CSV / XLSX importieren</button></div>
      </div>
      <div className="flex flex-col gap-3 border-b border-[#e3ecf2] bg-[#f8fbfd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="text-[12px] text-[#607887]"><strong className="font-semibold text-[#29475d]">Datenstand auswählen</strong><span className="ml-2">{visiblePointValues.length} Punktwert{visiblePointValues.length === 1 ? "" : "e"}</span></div><label className="flex items-center gap-2 text-[12px] font-semibold text-[#405e72]"><span>Quartal</span><select className="admin-field min-w-[150px]" value={quarter} onChange={(event) => setQuarter(event.target.value)}>{!quarters.includes(quarter) && <option value={quarter}>{formatQuarter(quarter)}</option>}{quarters.map((item) => <option key={item} value={item}>{formatQuarter(item)}</option>)}</select></label></div>
      {visiblePointValues.length ? <div>
        <div className="hidden grid-cols-[minmax(210px,1.5fr)_100px_130px_minmax(200px,1fr)] gap-4 border-b border-[#e5edf2] bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[.04em] text-[#718592] lg:grid"><span>Kassenart</span><span>Gruppe</span><span className="text-right">PW KFO</span><span>Quelle / Import</span></div>
        {visiblePointValues.map((item) => <article key={item.id} className="grid gap-3 border-b border-[#e5edf2] p-4 last:border-0 lg:grid-cols-[minmax(210px,1.5fr)_100px_130px_minmax(200px,1fr)] lg:items-center lg:gap-4 lg:px-5"><div><div className="text-[13px] font-semibold text-[#29475d]">{item.fundTypeLabel}</div><div className="mt-1 text-[11px] text-[#718592]">Kassenart {item.fundType}{item.fundNumber ? ` · Kassennummer ${item.fundNumber}` : ""}</div></div><div className="text-[12px] text-[#607887]"><span className="lg:hidden">Vergütungsgruppe </span>{item.fundGroup}</div><div className="lg:text-right"><span className="text-[11px] text-[#718592] lg:hidden">PW KFO </span><strong className="text-[15px] text-[#173249]">{formatPointValue(item.pwKfo)} €</strong></div><div className="text-[11px] leading-5 text-[#607887]"><span className="inline-flex rounded-[6px] border border-[#bddac8] bg-[#eef9f2] px-2 py-0.5 font-semibold text-[#286548]">{item.source || "KZVB"}</span><span className="ml-2">importiert {formatDateTime(item.importedAt)}</span>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-[#1e638b] underline underline-offset-2">Quelle <ExternalLink className="h-3 w-3" /></a>}</div></article>)}
      </div> : <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center"><Database className="h-8 w-8 text-[#7898ad]" /><h3 className="mt-4 text-[15px] font-semibold text-[#29475d]">Für {formatQuarter(quarter)} fehlen Punktwerte</h3><p className="mt-2 max-w-lg text-[13px] leading-5 text-[#718592]">Rufen Sie das aktuelle Quartal direkt von der KZVB ab oder importieren Sie die veröffentlichte CSV-/XLSX-Datei.</p></div>}
    </section>

    <EstimateImportDialog kind={importKind} onClose={() => setImportKind(null)} onImported={(next) => { onBundle(next); toast.success(importKind === "catalog" ? "BEMA-Leistungen wurden importiert." : "KZVB-Punktwerte wurden importiert."); }} />
  </div>;
}

function CatalogLedger({ items: catalog, onEdit, onArchive }: { items: EstimateCatalogItem[]; onEdit: (item: EstimateCatalogItem) => void; onArchive: (item: EstimateCatalogItem) => void }) {
  const [search, setSearch] = useState("");
  const items = catalog.filter((item) => item.active && (!search.trim() || `${item.code} ${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())));
  return <><div className="flex flex-col gap-3 border-b border-[#e3ecf2] bg-[#f8fbfd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="text-[12px] text-[#607887]">{items.length} passende Position{items.length === 1 ? "" : "en"}</div><label className="relative"><span className="sr-only">BEMA-Leistungen durchsuchen</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718895]" /><input className="admin-field admin-field-leading w-full sm:w-[320px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, Leistung, Kategorie" /></label></div>{items.length ? <div><div className="hidden grid-cols-[90px_minmax(240px,1fr)_100px_minmax(150px,.7fr)_90px] gap-4 border-b border-[#e5edf2] px-5 py-3 text-[11px] font-semibold uppercase tracking-[.04em] text-[#718592] lg:grid"><span>Code</span><span>Leistung</span><span>Punkte</span><span>Quelle / Stand</span><span className="text-right">Aktionen</span></div>{items.map((item) => { const sourced = item as EstimateCatalogItem & { feeSystem?: string; source?: string; sourceVersion?: string }; return <article key={item.id} className="grid gap-3 border-b border-[#e5edf2] p-4 last:border-0 lg:grid-cols-[90px_minmax(240px,1fr)_100px_minmax(150px,.7fr)_90px] lg:items-center lg:gap-4 lg:px-5"><div className="text-[12px] font-semibold text-[#063255]">{item.code || "–"}</div><div><div className="text-[13px] font-semibold text-[#29475d]">{item.name}</div><div className="mt-1 text-[11px] text-[#748895]">{item.category} · {item.unit} · {sourced.feeSystem || (item.calculationType === "points" ? "Punktleistung" : "Privat")}</div></div><div><strong className="text-[14px] text-[#173249]">{formatPointValue(item.points)}</strong><span className="ml-1 text-[11px] text-[#718592]">Punkte</span></div><div className="text-[11px] leading-5 text-[#607887]"><span className={`inline-flex rounded-[6px] border px-2 py-0.5 font-semibold ${sourced.source ? "border-[#bddac8] bg-[#eef9f2] text-[#286548]" : "border-[#d5e1e9] bg-[#f5f8fa] text-[#637987]"}`}>{sourced.source || "Manuell"}</span>{sourced.sourceVersion && <span className="ml-2">Stand {sourced.sourceVersion}</span>}</div><div className="flex justify-end gap-2"><button className="admin-icon-button" onClick={() => onEdit(item)} aria-label={`${item.name} bearbeiten`} title="Bearbeiten"><Edit3 className="h-4 w-4" /></button><button className="admin-icon-button text-[#9a453f]" onClick={() => onArchive(item)} aria-label={`${item.name} deaktivieren`} title="Deaktivieren"><Trash2 className="h-4 w-4" /></button></div></article>; })}</div> : <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><ClipboardList className="h-8 w-8 text-[#7898ad]" /><h3 className="mt-4 text-[15px] font-semibold text-[#29475d]">{search ? "Keine passende BEMA-Leistung" : "Noch keine Leistungen hinterlegt"}</h3><p className="mt-2 max-w-md text-[13px] leading-5 text-[#718592]">Übernehmen Sie den geprüften BEMA-Stand 2026 oder importieren Sie Ihre eigene fachlich geprüfte Liste.</p></div>}</>;
}

function CatalogView({ bundle, onEdit, onArchive }: { bundle: EstimateBundle; onEdit: (item: EstimateCatalogItem) => void; onArchive: (item: EstimateCatalogItem) => void }) {
  const [search, setSearch] = useState("");
  const items = bundle.catalog.filter((item) => item.active && (!search.trim() || `${item.code} ${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())));
  return <section className="admin-surface overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#dfeaf1] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-[16px] font-semibold text-[#29475d]">Leistungskatalog</h2><p className="mt-1 text-[12px] leading-5 text-[#708795]">Nur fachlich geprüfte Praxiswerte. Keine Gebührenposition ist vorbelegt.</p></div><label className="relative"><span className="sr-only">Leistungskatalog durchsuchen</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718895]" /><input className="admin-field admin-field-leading w-full sm:w-[280px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, Leistung, Kategorie" /></label></div>{items.length ? <div>{items.map((item) => <article key={item.id} className="grid gap-3 border-b border-[#e5edf2] p-4 last:border-0 sm:grid-cols-[90px_1fr_160px_130px_100px] sm:items-center sm:px-5"><div className="text-[12px] font-semibold text-[#587083]">{item.code || "Ohne Code"}</div><div><div className="text-[13px] font-semibold text-[#29475d]">{item.name}</div><div className="mt-1 text-[12px] text-[#748895]">{item.category} · {item.unit}{item.externalReference ? ` · Ref. ${item.externalReference}` : ""}</div></div><div className="text-[12px] text-[#617989]">{item.calculationType === "points" ? `${item.points} Punkte × ${item.pointValue.toLocaleString("de-DE")} €` : "Festpreis"}</div><strong className="text-[14px] text-[#173249] sm:text-right">{euro(item.computedUnitPriceCents)}</strong><div className="flex justify-end gap-2"><button className="admin-icon-button" onClick={() => onEdit(item)} aria-label={`${item.name} bearbeiten`} title="Bearbeiten"><Edit3 className="h-4 w-4" /></button><button className="admin-icon-button text-[#9a453f]" onClick={() => onArchive(item)} aria-label={`${item.name} deaktivieren`} title="Deaktivieren"><Trash2 className="h-4 w-4" /></button></div></article>)}</div> : <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><ClipboardList className="h-8 w-8 text-[#7898ad]" /><h3 className="mt-4 text-[15px] font-semibold text-[#29475d]">{search ? "Keine passende Leistung" : "Katalog ist noch leer"}</h3><p className="mt-2 max-w-md text-[13px] text-[#718592]">Legen Sie geprüfte Praxisleistungen, Material- oder Laborkosten selbst an.</p></div>}</section>;
}

function EstimateEditor({ open, draft, customers, catalog, pointValues, events, onClose, onSaved }: { open: boolean; draft: EstimateDraft | null; customers: Customer[]; catalog: EstimateCatalogItem[]; pointValues: EstimatePointValue[]; events: EstimateBundle["events"]; onClose: () => void; onSaved: (bundle: EstimateBundle) => void }) {
  const [form, setForm] = useState<EstimateDraft>(emptyDraft());
  const [patientSearch, setPatientSearch] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [basisNotice, setBasisNotice] = useState("");
  useEffect(() => { if (draft) { setForm({ ...draft, pointValueQuarter: draft.pointValueQuarter || currentQuarter(), insurerGroup: draft.insurerGroup || "", items: draft.items.map((item) => ({ ...item })) }); setPatientSearch(""); setError(""); setBasisNotice(""); } }, [draft]);
  const locked = !["draft", "in_review"].includes(form.status);
  const selectedCustomer = customers.find((item) => item.id === form.customerId);
  const patientMatches = customers.filter((item) => `${item.firstName} ${item.lastName} ${item.patientNumber || ""}`.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 8);
  const subtotal = form.items.reduce((sum, item) => sum + Math.max(0, Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100))), 0);
  const insurerShare = Math.min(subtotal, Math.max(0, form.insuranceShareCents));
  const patientShare = subtotal - insurerShare;
  const quarterOptions = Array.from(new Set([form.pointValueQuarter, currentQuarter(), ...pointValues.map((item) => item.quarter)].filter(Boolean))).sort().reverse();
  const groupOptions = Array.from(new Map(pointValues.filter((item) => item.quarter === form.pointValueQuarter).map((item) => [item.fundType, item.fundTypeLabel])).entries()).sort(([a], [b]) => a.localeCompare(b, "de", { numeric: true }));
  const resolvedPointValue = resolvePointValue(pointValues, form.pointValueQuarter, form.insurerGroup);

  function updateLine(index: number, patch: Partial<EstimateLineItem>) {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }
  function changeBasis(pointValueQuarter: string, insurerGroup: string) {
    const resolved = resolvePointValue(pointValues, pointValueQuarter, insurerGroup);
    let recalculated = 0;
    setForm((current) => ({
      ...current,
      pointValueQuarter,
      insurerGroup,
      items: current.items.map((item) => {
        if (item.feeSystem !== "BEMA") return item;
        recalculated++;
        return { ...item, pointValue: resolved?.pwKfo || 0, unitPriceCents: resolved ? Math.round(item.points * resolved.pwKfo * 100) : 0 };
      }),
    }));
    setBasisNotice(recalculated ? resolved ? `${recalculated} BEMA-Position${recalculated === 1 ? "" : "en"} wurde${recalculated === 1 ? "" : "n"} mit dem neuen Punktwert neu berechnet.` : `${recalculated} BEMA-Position${recalculated === 1 ? "" : "en"} wurde${recalculated === 1 ? "" : "n"} auf 0,00 € gesetzt, weil kein passender Punktwert vorliegt.` : "");
  }
  function addCatalogLine() {
    const item = catalog.find((entry) => entry.id === catalogId);
    if (!item) return;
    const pointValue = item.feeSystem === "BEMA" ? resolvedPointValue?.pwKfo || 0 : item.pointValue;
    setForm((current) => ({ ...current, items: [...current.items, { ...newLine(), catalogItemId: item.id, position: current.items.length + 1, code: item.code, description: item.name, category: item.category, unit: item.unit, feeSystem: item.feeSystem, points: item.points, pointValue, unitPriceCents: item.feeSystem === "BEMA" ? Math.round(item.points * pointValue * 100) : item.computedUnitPriceCents }] }));
    if (item.feeSystem === "BEMA" && !resolvedPointValue) setBasisNotice("Die BEMA-Position wurde ohne Preis übernommen. Bitte wählen Sie Quartal und Kassenart mit hinterlegtem KFO-Punktwert.");
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
    <Section title="Patient:in & Grundlage" text="Der aktuelle Patientenstamm wird beim Speichern als Angebotsstand dokumentiert."><Field label="Patient:in suchen"><input disabled={locked} className="admin-field w-full" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Name oder Patientennummer" /></Field>{!selectedCustomer && patientSearch && <div className="mt-2 grid gap-2 sm:grid-cols-2">{patientMatches.map((customer) => <button type="button" key={customer.id} onClick={() => { setForm((current) => ({ ...current, customerId: customer.id, insuranceType: current.insuranceType || customer.insuranceType || "", insurer: current.insurer || customer.insurer || "", insurerGroup: current.insurerGroup || inferInsurerGroup(customer.insurer || "") })); setPatientSearch(""); }} className="min-h-11 rounded-[10px] border border-[#cbdce6] px-3 text-left text-[13px] text-[#29475d] hover:border-[#6f96ae]"><strong>{customer.firstName} {customer.lastName}</strong><span className="ml-2 text-[#718592]">{customer.patientNumber || ""}</span></button>)}</div>}{selectedCustomer && <div className="mt-2 flex items-center justify-between rounded-[11px] border border-[#bcd3e1] bg-[#edf7fd] p-3"><div className="text-[13px] text-[#29475d]"><strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong><span className="ml-2 text-[#688092]">{selectedCustomer.patientNumber ? `Pat.-Nr. ${selectedCustomer.patientNumber}` : selectedCustomer.email}</span></div>{!locked && <button type="button" className="admin-icon-button" onClick={() => setForm((current) => ({ ...current, customerId: "" }))} aria-label="Patientenauswahl entfernen"><X className="h-4 w-4" /></button>}</div>}<div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]"><Field label="Titel"><input disabled={locked} className="admin-field w-full" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="Gültig bis"><input disabled={locked} type="date" className="admin-field w-full" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Versicherungsart"><select disabled={locked} className="admin-field w-full" value={form.insuranceType} onChange={(event) => setForm((current) => ({ ...current, insuranceType: event.target.value }))}><option value="">Nicht angegeben</option><option value="gesetzlich">Gesetzlich</option><option value="privat">Privat</option><option value="selbstzahler">Selbstzahler</option></select></Field><Field label="Kostenträger"><input disabled={locked} className="admin-field w-full" value={form.insurer} onChange={(event) => { const insurer = event.target.value; setForm((current) => ({ ...current, insurer, insurerGroup: current.insurerGroup || inferInsurerGroup(insurer) })); }} /></Field><Field label="KIG (optional)"><input disabled={locked} className="admin-field w-full" value={form.kigLevel} onChange={(event) => setForm((current) => ({ ...current, kigLevel: event.target.value }))} placeholder="z. B. KIG D4" /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Punktwert-Quartal"><select disabled={locked} className="admin-field w-full" value={form.pointValueQuarter} onChange={(event) => changeBasis(event.target.value, form.insurerGroup)}>{quarterOptions.map((item) => <option key={item} value={item}>{formatQuarter(item)}</option>)}</select></Field><Field label="Kassenart / Gruppe"><select disabled={locked} className="admin-field w-full" value={form.insurerGroup} onChange={(event) => changeBasis(form.pointValueQuarter, event.target.value)}><option value="">Bitte auswählen</option>{groupOptions.map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select></Field></div><div className={`mt-3 flex items-start gap-2 rounded-[11px] border px-4 py-3 text-[12px] leading-5 ${resolvedPointValue ? "border-[#bcdac8] bg-[#eef9f2] text-[#286548]" : "border-[#edc67d] bg-[#fff9eb] text-[#79500e]"}`}>{resolvedPointValue ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}<span>{resolvedPointValue ? <><strong>KFO-Punktwert {formatPointValue(resolvedPointValue.pwKfo)} €</strong> · {formatQuarter(resolvedPointValue.quarter)} · {resolvedPointValue.fundTypeLabel}</> : <><strong>Kein passender KFO-Punktwert.</strong> Bitte Quartal und Kassenart prüfen oder Punktwerte im Leistungskatalog importieren.</>}</span></div>{basisNotice && <div className="mt-3 rounded-[10px] border border-[#c9dce7] bg-[#edf7fd] px-3 py-2 text-[11px] leading-5 text-[#40657b]" role="status">{basisNotice}</div>}<Field label="Diagnose / Behandlungsziel" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[110px] w-full" value={form.diagnosis} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} /></Field></Section>
    <Section title="Leistungspositionen" text="BEMA-Positionen werden aus Punktzahl und ausgewähltem KFO-Punktwert berechnet. Punkte, Punktwert und Preis bleiben als Berechnungsstand im Entwurf gespeichert.">{!locked && <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><select className="admin-field w-full" value={catalogId} onChange={(event) => setCatalogId(event.target.value)}><option value="">Leistung aus Katalog wählen</option>{catalog.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ` : ""}{item.name} · {item.feeSystem === "BEMA" ? `${formatPointValue(item.points)} Punkte` : euro(item.computedUnitPriceCents)}</option>)}</select><button type="button" disabled={!catalogId} className="admin-secondary-button" onClick={addCatalogLine}><Plus className="h-4 w-4" />Übernehmen</button><button type="button" className="admin-secondary-button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, { ...newLine(), position: current.items.length + 1 }] }))}><Plus className="h-4 w-4" />Freie Position</button></div>}<div className="space-y-3">{form.items.map((item, index) => <div key={item.id} className="rounded-[13px] border border-[#d8e5ed] bg-[#fbfdfe] p-4"><div className="grid gap-3 lg:grid-cols-[90px_minmax(220px,1fr)_90px_110px_100px_42px]"><Field label="Code"><input disabled={locked} className="admin-field w-full" value={item.code} onChange={(event) => updateLine(index, { code: event.target.value })} /></Field><Field label="Leistung *"><input disabled={locked} className="admin-field w-full" value={item.description} onChange={(event) => updateLine(index, { description: event.target.value })} /></Field><Field label="Menge"><input disabled={locked} type="number" min="0.01" step="0.01" className="admin-field w-full" value={item.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></Field><Field label="Einzelpreis €">{item.feeSystem === "BEMA" ? <input disabled type="text" className="admin-field w-full text-right tabular-nums" value={formatCentsDisplay(item.unitPriceCents)} aria-label="Automatisch berechneter BEMA-Einzelpreis in Euro" /> : <input disabled={locked} type="number" min="0" step="0.01" className="admin-field w-full" value={formatCentsInput(item.unitPriceCents)} onChange={(event) => updateLine(index, { unitPriceCents: Math.round(Number(event.target.value) * 100) })} />}</Field><Field label="Rabatt %"><input disabled={locked} type="number" min="0" max="100" step="0.1" className="admin-field w-full" value={item.discountPercent} onChange={(event) => updateLine(index, { discountPercent: Number(event.target.value) })} /></Field>{!locked && <button type="button" className="admin-icon-button mt-[27px] text-[#9a453f]" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Position ${index + 1} entfernen`}><Trash2 className="h-4 w-4" /></button>}</div>{item.feeSystem === "BEMA" && <div className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[9px] border px-3 py-2 text-[11px] ${item.pointValue > 0 ? "border-[#c7dfd0] bg-[#f0f8f3] text-[#396a50]" : "border-[#edc67d] bg-[#fff9eb] text-[#79500e]"}`}><strong>BEMA-Snapshot</strong><span>{formatPointValue(item.points)} Punkte</span><span>×</span><span>{formatPointValue(item.pointValue)} € Punktwert</span><span>=</span><strong>{euro(item.unitPriceCents)}</strong><span>· {formatQuarter(form.pointValueQuarter)} / {resolvedPointValue?.fundTypeLabel || `Kassenart ${form.insurerGroup || "offen"}`}</span></div>}<div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]"><Field label="Einheit"><input disabled={locked} className="admin-field w-full" value={item.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} /></Field><Field label="Positionshinweis"><input disabled={locked} className="admin-field w-full" value={item.note} onChange={(event) => updateLine(index, { note: event.target.value })} /></Field><div className="self-end pb-2 text-right text-[13px] text-[#607887]">Positionssumme <strong className="ml-2 text-[15px] text-[#173249]">{euro(Math.round(item.quantity * item.unitPriceCents * (1 - item.discountPercent / 100)))}</strong></div></div></div>)}</div></Section>
    <Section title="Hinweise & Dokumentation" text="Patientenhinweise erscheinen im Ausdruck; interne Notizen bleiben ausschließlich in der Verwaltung."><Field label="Hinweis für Patient:innen"><textarea disabled={locked} className="admin-field min-h-[95px] w-full" value={form.patientNote} onChange={(event) => setForm((current) => ({ ...current, patientNote: event.target.value }))} /></Field><Field label="Bedingungen / Kostenträgerhinweis" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[120px] w-full" value={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))} /></Field><Field label="Interne Notiz" className="mt-4"><textarea disabled={locked} className="admin-field min-h-[90px] w-full" value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} /></Field></Section>
  </div><aside className="space-y-4 xl:sticky xl:top-0 xl:self-start"><div className={`rounded-[15px] border p-4 ${resolvedPointValue ? "border-[#bdd6e4] bg-[#edf7fd]" : "border-[#edc67d] bg-[#fff9eb]"}`}><div className="text-[11px] font-semibold uppercase tracking-[.07em] text-[#5f7b8d]">Berechnungsgrundlage</div><div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-[#29475d]"><strong>BEMA-Punkte</strong><span>×</span><strong>{resolvedPointValue ? `${formatPointValue(resolvedPointValue.pwKfo)} €` : "fehlender Punktwert"}</strong><span>= Einheitspreis</span></div><p className="mt-3 text-[11px] leading-5 text-[#607887]">{resolvedPointValue ? `${formatQuarter(resolvedPointValue.quarter)} · ${resolvedPointValue.fundTypeLabel} · Quelle ${resolvedPointValue.source || "KZVB"}` : "BEMA-Positionen können erst nach Auswahl eines passenden Quartals und einer Kassenart berechnet werden."}</p><p className="mt-2 border-t border-[#d5e4ec] pt-2 text-[11px] leading-5 text-[#607887]">Der KZVB-Punktwert berechnet den BEMA-Honorarbetrag, ist aber keine individuelle Erstattungszusage. KIG, gesetzliche Eigenanteile, Mehr-/Zusatzleistungen und private Erstattung bleiben getrennte fachliche Workflows.</p></div><div className="overflow-hidden rounded-[16px] border border-[#174b70] bg-[#063255] text-white"><div className="border-b border-white/10 p-5"><div className="text-[12px] font-semibold uppercase tracking-[.08em] text-[#a9c5d6]">Finanzielle Übersicht</div><div className="mt-5 space-y-3 text-[13px]"><div className="flex justify-between"><span className="text-[#c4d8e4]">Behandlungssumme</span><strong>{euro(subtotal)}</strong></div><label className="block border-y border-white/10 py-4"><span className="mb-2 block text-[#c4d8e4]">Voraussichtliche Kassenbeteiligung</span><div className="relative"><input disabled={locked} type="number" min="0" max={subtotal / 100} step="0.01" className="h-11 w-full rounded-[10px] border border-white/20 bg-white/10 px-3 pr-8 text-right text-[15px] font-semibold text-white outline-none focus:ring-2 focus:ring-[#f58a07]" value={(form.insuranceShareCents / 100).toFixed(2)} onChange={(event) => setForm((current) => ({ ...current, insuranceShareCents: Math.round(Number(event.target.value) * 100) }))} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5d8e3]">€</span></div><small className="mt-2 block text-[11px] leading-4 text-[#9fbbcb]">Bewusst manuell, keine automatische Prozentlogik und keine Erstattungszusage.</small></label></div></div><div className="bg-[#0b4167] p-5"><div className="text-[12px] text-[#bcd3e1]">Voraussichtlicher Eigenanteil</div><strong className="mt-2 block text-[27px] font-semibold text-white">{euro(patientShare)}</strong></div></div>{form.id && <div className="admin-surface p-4"><h3 className="text-[13px] font-semibold text-[#29475d]">Letzte Aktivitäten</h3>{events.length ? <ol className="mt-3 space-y-3">{events.map((event) => <li key={event.id} className="border-l-2 border-[#d7e5ed] pl-3 text-[11px] leading-4 text-[#6c8290]"><strong className="block text-[12px] text-[#3c586c]">{event.detail}</strong>{new Date(event.createdAt).toLocaleString("de-DE")}</li>)}</ol> : <p className="mt-2 text-[12px] text-[#718592]">Noch keine Aktivitäten.</p>}</div>}</aside></div></div><div className="shrink-0 border-t border-[#dce7ee] bg-[#fbfdfe] px-5 py-4 sm:px-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{error ? <div className="rounded-[10px] bg-[#fff0ef] px-3 py-2 text-[12px] text-[#963c36]">{error}</div> : <div className="text-[12px] text-[#6b8291]">Summen werden beim Speichern serverseitig erneut berechnet.</div>}<div className="flex justify-end gap-2"><button type="button" className="admin-secondary-button" onClick={onClose}>Schließen</button>{!locked && <button type="submit" disabled={saving} className="admin-primary-button">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Wird gespeichert …" : "Sicher speichern"}</button>}</div></div></div></form></DialogContent></Dialog>;
}

function CatalogEditor({ open, item, onClose, onSaved }: { open: boolean; item: EstimateCatalogItem | null; onClose: () => void; onSaved: (bundle: EstimateBundle) => void }) {
  const blank = { id: "", code: "", name: "", description: "", category: "Behandlung", calculationType: "fixed" as "fixed" | "points", points: 0, pointValue: 0, unitPrice: 0, unit: "Stück", active: true, externalReference: "", feeSystem: "private" as "BEMA" | "GOZ" | "private", source: "Manuell", sourceVersion: "" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const provenanceLocked = Boolean(item?.source && !["Praxis", "Manuell"].includes(item.source));
  useEffect(() => {
    setForm(item ? { id: item.id, code: item.code, name: item.name, description: item.description, category: item.category, calculationType: item.calculationType, points: item.points, pointValue: item.pointValue, unitPrice: item.unitPriceCents / 100, unit: item.unit, active: item.active, externalReference: item.externalReference, feeSystem: item.feeSystem, source: item.source, sourceVersion: item.sourceVersion } : blank);
    setError("");
  }, [item, open]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return setError("Bitte geben Sie eine Bezeichnung ein.");
    if (form.feeSystem === "BEMA" && form.points <= 0) return setError("Für eine BEMA-Leistung ist eine gültige Punktzahl erforderlich.");
    setSaving(true); setError("");
    try {
      onSaved(await adminApi.saveEstimateCatalogItem({ id: form.id || undefined, code: form.code, name: form.name, description: form.description, category: form.category, calculationType: form.feeSystem === "BEMA" ? "points" : form.calculationType, points: form.points, pointValue: form.feeSystem === "BEMA" ? 0 : form.pointValue, unitPriceCents: form.feeSystem === "BEMA" ? 0 : Math.round(form.unitPrice * 100), unit: form.unit, active: form.active, externalReference: form.externalReference, feeSystem: form.feeSystem, source: form.source, sourceVersion: form.sourceVersion }));
      toast.success("Katalogposition wurde gespeichert.");
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setSaving(false); }
  }
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent className="admin-root admin-work-dialog admin-catalog-dialog flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0"><DialogHeader className="border-b border-[#dce8ef] px-6 py-5 pr-14"><DialogTitle className="text-[18px] font-semibold text-[#173249]">{item ? "Katalogposition bearbeiten" : "Katalogposition anlegen"}</DialogTitle><DialogDescription className="mt-1 text-[12px] text-[#687f8e]">Nur fachlich geprüfte Praxiswerte eintragen.</DialogDescription></DialogHeader><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-dialog-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
    <div className="grid gap-4 sm:grid-cols-[140px_1fr]"><Field label="Code / Position"><input className="admin-field w-full" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} /></Field><Field label="Bezeichnung *"><input className="admin-field w-full" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field></div>
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Gebührensystem"><select className="admin-field w-full" value={form.feeSystem} onChange={(event) => { const feeSystem = event.target.value as typeof form.feeSystem; setForm((current) => ({ ...current, feeSystem, calculationType: feeSystem === "BEMA" ? "points" : current.calculationType })); }}><option value="private">Manuell / privat</option><option value="BEMA">BEMA</option><option value="GOZ">GOZ</option></select></Field><Field label="Kategorie"><input className="admin-field w-full" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></Field><Field label="Einheit"><input className="admin-field w-full" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></Field></div>
    <Field label="Beschreibung"><textarea className="admin-field min-h-[90px] w-full" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field>
    {form.feeSystem === "BEMA" ? <div className="rounded-[12px] border border-[#c9dce7] bg-[#edf7fd] p-4"><Field label="Bundeseinheitliche BEMA-Punkte"><input type="number" min="0.001" step="0.001" className="admin-field w-full" value={form.points} onChange={(event) => setForm((current) => ({ ...current, points: Number(event.target.value) }))} /></Field><p className="mt-3 text-[11px] leading-5 text-[#5f7888]">Der quartals- und kassenabhängige KFO-Punktwert wird erst im Kostenvoranschlag ausgewählt. Im Katalog wird bewusst kein fester BEMA-Preis gespeichert.</p></div> : <Field label="Manueller Preis pro Einheit (€)"><input type="number" min="0" step="0.01" className="admin-field w-full" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} /></Field>}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Quelle"><input readOnly={provenanceLocked} className="admin-field w-full read-only:bg-[#eef4f7] read-only:text-[#607887]" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} /></Field><Field label="Stand / Version"><input readOnly={provenanceLocked} className="admin-field w-full read-only:bg-[#eef4f7] read-only:text-[#607887]" value={form.sourceVersion} onChange={(event) => setForm((current) => ({ ...current, sourceVersion: event.target.value }))} placeholder="z. B. 2026-01-01" /></Field></div>
    <Field label="ivoris / externe Referenz (optional)"><input className="admin-field w-full" value={form.externalReference} onChange={(event) => setForm((current) => ({ ...current, externalReference: event.target.value }))} /></Field>
  </div><div className="border-t border-[#dce8ef] bg-[#fbfdfe] px-6 py-4"><div className="flex items-center justify-between gap-3">{error ? <div className="text-[12px] text-[#963c36]">{error}</div> : <span />}<div className="flex gap-2"><button type="button" className="admin-secondary-button" onClick={onClose}>Abbrechen</button><button type="submit" disabled={saving} className="admin-primary-button">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Speichern</button></div></div></div></form></DialogContent></Dialog>;
}

function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <section className="rounded-[15px] border border-[#dce8ef] bg-white p-4 sm:p-5"><h3 className="text-[15px] font-semibold text-[#29475d]">{title}</h3><p className="mb-5 mt-1 text-[12px] leading-5 text-[#718592]">{text}</p>{children}</section>; }
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={className}><span className="admin-label">{label}</span>{children}</label>; }

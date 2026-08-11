import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileKey2,
  FileText,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MailCheck,
  MailWarning,
  PlugZap,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { AdminShell } from "../AdminShell";
import { adminApi, AdminApiError } from "../api";
import { InvoiceSendWizard } from "../components/InvoiceSendWizard";
import type { Customer, InvoiceBundle, InvoiceDelivery, InvoiceRecord, InvoiceStatus } from "../types";

type Props = { customers: Customer[]; onLoggedOut: () => void };
type LoadState = "loading" | "ready" | "error";
const emptyBundle: InvoiceBundle = { invoices: [], deliveries: [] };
const statusLabels: Record<InvoiceStatus, string> = { not_sent: "Noch nicht versendet", sent: "Versendet", reminder_sent: "Erinnerung versendet", paid: "Bezahlt" };

export function InvoicesPage({ customers, onLoggedOut }: Props) {
  const [state, setState] = useState<LoadState>("loading");
  const [bundle, setBundle] = useState<InvoiceBundle>(emptyBundle);
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<InvoiceRecord | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const response = await adminApi.invoices();
      setBundle(response);
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Rechnungsdaten konnten nicht geladen werden.");
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => bundle.invoices.filter((invoice) => {
    const customer = customers.find((item) => item.id === invoice.customerId);
    const haystack = `${invoice.invoiceNumber} ${customer?.firstName || ""} ${customer?.lastName || ""} ${customer?.patientNumber || ""}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (status === "all" || invoice.status === status);
  }), [bundle.invoices, customers, search, status]);

  const metrics = useMemo(() => ({
    notSent: bundle.invoices.filter((invoice) => invoice.status === "not_sent").length,
    sent: bundle.invoices.filter((invoice) => invoice.status === "sent").length,
    reminded: bundle.invoices.filter((invoice) => invoice.status === "reminder_sent").length,
    paid: bundle.invoices.filter((invoice) => invoice.status === "paid").length,
    attention: bundle.deliveries.filter((delivery) => delivery.status === "failed" || delivery.status === "uncertain").length,
  }), [bundle]);

  return (
    <AdminShell
      title="Rechnungen"
      eyebrow="Sicherer Rechnungsversand"
      description="Geschützte Rechnungen eindeutig zuordnen, zuverlässig versenden und offene Vorgänge im Blick behalten."
      onLoggedOut={onLoggedOut}
      action={<button type="button" onClick={() => setWizardOpen(true)} className="admin-primary-button min-h-11 w-full sm:w-auto"><Send className="h-[18px] w-[18px]" />Rechnungen versenden</button>}
    >
      <main className="invoice-page space-y-5">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-5" aria-label="Rechnungsübersicht">
          <Metric icon={FileText} label="Noch nicht versendet" value={metrics.notSent} tone="neutral" />
          <Metric icon={MailCheck} label="Versendet" value={metrics.sent} tone="blue" />
          <Metric icon={MailWarning} label="Erinnert" value={metrics.reminded} tone="amber" />
          <Metric icon={CircleDollarSign} label="Bezahlt" value={metrics.paid} tone="green" note="nur aus iVoris" />
          <Metric icon={AlertTriangle} label="Versand prüfen" value={metrics.attention} tone={metrics.attention ? "red" : "neutral"} note="Fehler oder unklar" wide />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="admin-surface overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#deebf2] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="!text-[16px] !font-semibold !text-[#173249]">Rechnungsverlauf</h2><p className="mt-1 !text-[12px] !text-[#6b8190]">{filtered.length} von {bundle.invoices.length} Rechnungen</p><p className="mt-1 max-w-xl !text-[12px] !leading-5 !text-[#6b8190]">Eine deaktivierte Erinnerung ist bereits erledigt, als bezahlt gemeldet, noch nicht sicher versendet oder muss zuerst im Gesendet-Postfach geprüft werden.</p></div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px]">
                <label className="relative"><span className="sr-only">Rechnungen durchsuchen</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718795]" /><input className="admin-field admin-field-leading min-h-11 w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, Nummer oder Pat.-Nr." /></label>
                <label className="relative"><span className="sr-only">Nach Rechnungsstatus filtern</span><select className="admin-field min-h-11 w-full appearance-none pr-9" value={status} onChange={(event) => setStatus(event.target.value as "all" | InvoiceStatus)}><option value="all">Alle Status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718795]" /></label>
              </div>
            </div>

            {state === "loading" && <LoadingInvoices />}
            {state === "error" && <ErrorInvoices message={error} onRetry={load} />}
            {state === "ready" && !bundle.invoices.length && <EmptyInvoices onStart={() => setWizardOpen(true)} />}
            {state === "ready" && bundle.invoices.length > 0 && !filtered.length && <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><Search className="h-7 w-7 text-[#7291a4]" /><h3 className="mt-3 text-[15px] font-semibold text-[#29475d]">Keine passenden Rechnungen</h3><p className="mt-1 text-[12px] text-[#6b8190]">Suche oder Statusfilter anpassen.</p></div>}
            {state === "ready" && filtered.length > 0 && <InvoiceList invoices={filtered} deliveries={bundle.deliveries} customers={customers} onReminder={setReminderInvoice} />}
          </div>

          <aside className="space-y-4">
            <section className="admin-surface overflow-hidden">
              <div className="border-b border-[#e0eaf0] px-5 py-4"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#1d678b]" /><h2 className="!text-[15px] !font-semibold !text-[#173249]">Sicher versenden</h2></div></div>
              <div className="space-y-4 p-5 text-[12px] leading-5 text-[#526f82]">
                <SafetyLine icon={LockKeyhole} title="Nur geschützte PDFs" text="Unverschlüsselte Rechnungen werden vor dem Versand blockiert." />
                <SafetyLine icon={UsersRound} title="Einwilligung geprüft" text="Rechnungs-E-Mail und Termin-Erinnerung bleiben getrennte Freigaben." />
                <SafetyLine icon={FileKey2} title="Keine Dateiablage" text="PDFs werden weder in Datenbank noch Blob- oder Dateispeicher abgelegt." />
              </div>
            </section>

            <section className="admin-surface overflow-hidden border-l-4 !border-l-[#f58a07]">
              <div className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#e8f3f9] text-[#1d678b]"><PlugZap className="h-5 w-5" /></span><span className="rounded-[8px] bg-[#fff2dc] px-2.5 py-1 text-[10px] font-semibold text-[#895b0e]">Zugang ausstehend</span></div><h2 className="mt-4 !text-[15px] !font-semibold !text-[#173249]">iVoris-Schnittstelle vorbereitet</h2><p className="mt-2 !text-[12px] !leading-5 !text-[#607989]">Nach Freigabe der Schnittstelle können Stammdaten und Rechnungsstatus automatisch abgeglichen werden.</p><div className="mt-4 rounded-[10px] bg-[#f4f8fa] p-3"><div className="flex items-start gap-2"><Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4e7d98]" /><p className="text-[11px] leading-5 text-[#526f82]"><strong>„Bezahlt“</strong> kommt später ausschließlich aus iVoris und kann hier bewusst nicht manuell gesetzt werden.</p></div></div></div>
            </section>
          </aside>
        </section>
      </main>

      <InvoiceSendWizard open={wizardOpen} customers={customers} onOpenChange={setWizardOpen} onComplete={load} />
      <InvoiceReminderDialog invoice={reminderInvoice} customer={customers.find((item) => item.id === reminderInvoice?.customerId)} onOpenChange={(open) => !open && setReminderInvoice(null)} onSent={async () => { setReminderInvoice(null); await load(); }} />
    </AdminShell>
  );
}

function Metric({ icon: Icon, label, value, tone, note, wide }: { icon: React.ElementType; label: string; value: number; tone: "neutral" | "blue" | "amber" | "green" | "red"; note?: string; wide?: boolean }) {
  const colors = { neutral: "bg-[#edf4f7] text-[#4d6d80]", blue: "bg-[#e6f2f8] text-[#22688d]", amber: "bg-[#fff1da] text-[#92600d]", green: "bg-[#e4f4eb] text-[#287253]", red: "bg-[#fff0ed] text-[#a23b2e]" };
  return <article className={`admin-surface flex min-h-[112px] items-center gap-3 p-4 ${wide ? "col-span-2 xl:col-span-1" : ""}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${colors[tone]}`}><Icon className="h-[21px] w-[21px]" /></span><div className="min-w-0"><div className="text-[24px] font-semibold leading-none tracking-[-.03em] text-[#173249]">{value}</div><div className="mt-1.5 text-[11px] font-semibold leading-4 text-[#526f82]">{label}</div>{note && <div className="mt-0.5 text-[9px] text-[#82939e]">{note}</div>}</div></article>;
}

function InvoiceList({ invoices, deliveries, customers, onReminder }: { invoices: InvoiceRecord[]; deliveries: InvoiceDelivery[]; customers: Customer[]; onReminder: (invoice: InvoiceRecord) => void }) {
  return <><div className="admin-scrollbar hidden overflow-x-auto md:block"><table className="min-w-full table-fixed text-left"><thead className="bg-[#f6fafc]"><tr className="border-b border-[#dce8ef] text-[10px] font-semibold uppercase tracking-[.06em] text-[#6c8290]"><th className="w-[29%] px-5 py-3">Rechnung</th><th className="w-[24%] px-3 py-3">Patient:in</th><th className="w-[18%] px-3 py-3">Status</th><th className="w-[17%] px-3 py-3">Letzte Aktion</th><th className="px-5 py-3 text-right">Aktion</th></tr></thead><tbody className="divide-y divide-[#e5edf2]">{invoices.map((invoice) => { const customer = customers.find((item) => item.id === invoice.customerId); const lastDelivery = latestDelivery(invoice.id, deliveries); const reminderBlocked = !canRemind(invoice, customer, lastDelivery); return <tr key={invoice.id} className="transition hover:bg-[#f8fbfd]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f3f9] text-[#326d90]"><ReceiptText className="h-[18px] w-[18px]" /></span><div className="min-w-0"><div className="truncate text-[12px] font-semibold text-[#29475d]">{invoice.invoiceNumber || "Rechnung ohne Nummer"}</div><div className="mt-0.5 text-[10px] text-[#788c99]">{invoice.issuedAt ? `Vom ${formatDate(invoice.issuedAt)}` : "Datum nicht angegeben"} · {invoice.source === "ivoris" ? "iVoris" : "Upload"}</div></div></div></td><td className="px-3 py-4"><div className="truncate text-[12px] font-semibold text-[#34556c]">{customer ? `${customer.lastName}, ${customer.firstName}` : "Datensatz nicht gefunden"}</div><div className="mt-0.5 text-[10px] text-[#7a8e9a]">{customer?.patientNumber ? `Pat.-Nr. ${customer.patientNumber}` : "Keine Patientennummer"}</div></td><td className="px-3 py-4"><InvoiceStatusBadge status={invoice.status} /></td><td className="px-3 py-4"><DeliveryState delivery={lastDelivery} invoice={invoice} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => onReminder(invoice)} disabled={reminderBlocked} className="admin-secondary-button min-h-11 px-3 text-[12px]" title={reminderBlocked ? reminderBlockReason(invoice, customer, lastDelivery) : undefined}><MailWarning className="h-4 w-4" />Erinnern</button></td></tr>; })}</tbody></table></div><div className="divide-y divide-[#e2ebf1] md:hidden">{invoices.map((invoice) => { const customer = customers.find((item) => item.id === invoice.customerId); const lastDelivery = latestDelivery(invoice.id, deliveries); const reminderBlocked = !canRemind(invoice, customer, lastDelivery); return <article key={invoice.id} className="p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#e8f3f9] text-[#326d90]"><ReceiptText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="break-words text-[13px] font-semibold text-[#29475d]">{invoice.invoiceNumber || "Rechnung ohne Nummer"}</div><div className="mt-1 text-[11px] text-[#607989]">{customer ? `${customer.firstName} ${customer.lastName} · Pat.-Nr. ${customer.patientNumber || "–"}` : "Patient:in nicht gefunden"}</div></div><InvoiceStatusBadge status={invoice.status} /></div><div className="mt-3 grid gap-2 rounded-[11px] bg-[#f5f9fb] p-3"><div className="text-[11px] text-[#526f82]">{invoice.issuedAt ? `Rechnungsdatum ${formatDate(invoice.issuedAt)}` : "Kein Rechnungsdatum"}</div><DeliveryState delivery={lastDelivery} invoice={invoice} /></div><button type="button" onClick={() => onReminder(invoice)} disabled={reminderBlocked} title={reminderBlocked ? reminderBlockReason(invoice, customer, lastDelivery) : undefined} className="admin-secondary-button mt-3 min-h-11 w-full"><MailWarning className="h-4 w-4" />Rechnungserinnerung</button></article>; })}</div></>;
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) { const styles = { not_sent: "bg-[#edf1f3] text-[#566d7b]", sent: "bg-[#e5f1f7] text-[#286887]", reminder_sent: "bg-[#fff1da] text-[#8b5c0e]", paid: "bg-[#e4f4eb] text-[#287253]" }; return <span className={`inline-flex max-w-[145px] items-center rounded-[8px] px-2.5 py-1.5 text-[10px] font-semibold leading-4 ${styles[status]}`}>{statusLabels[status]}</span>; }
function DeliveryState({ delivery, invoice }: { delivery?: InvoiceDelivery; invoice: InvoiceRecord }) { if (delivery?.status === "processing") return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#286887]"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Wird versendet</span>; if (delivery?.status === "failed") return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#a23b2e]"><AlertTriangle className="h-3.5 w-3.5" />Nicht versendet</span>; if (delivery?.status === "uncertain") return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8b5c0e]"><AlertTriangle className="h-3.5 w-3.5" />Postfach prüfen</span>; const date = invoice.reminderSentAt || invoice.sentAt || delivery?.sentAt; return <span className="text-[11px] text-[#607989]">{date ? formatDateTime(date) : "Noch keine Aktion"}</span>; }

function SafetyLine({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) { return <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#edf5f9] text-[#3b7596]"><Icon className="h-4 w-4" /></span><div><div className="font-semibold text-[#29475d]">{title}</div><p className="mt-0.5 !text-[11px] !leading-5 !text-[#607989]">{text}</p></div></div>; }
function LoadingInvoices() { return <div className="flex min-h-[380px] flex-col items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#f58a07]" /><p className="mt-3 text-[12px] font-medium text-[#607989]">Rechnungsstatus wird geladen …</p></div>; }
function ErrorInvoices({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center"><AlertTriangle className="h-8 w-8 text-[#a23b2e]" /><h3 className="mt-3 text-[15px] font-semibold text-[#29475d]">Rechnungsdaten nicht erreichbar</h3><p className="mt-2 max-w-md text-[12px] leading-5 text-[#607989]">{message}</p><button type="button" onClick={onRetry} className="admin-secondary-button mt-5 min-h-11"><RefreshCw className="h-4 w-4" />Erneut versuchen</button></div>; }
function EmptyInvoices({ onStart }: { onStart: () => void }) { return <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-[17px] bg-[#e7f3fa] text-[#174e72]"><ReceiptText className="h-8 w-8" /></span><h2 className="mt-4 !text-[17px] !font-semibold !text-[#29465c]">Noch keine Rechnungen versendet</h2><p className="mt-2 max-w-md !text-[12px] !leading-5 !text-[#718692]">Starten Sie den geführten Versand. Patientennummer, Einwilligung, E-Mail-Adresse und PDF-Schutz werden vorab geprüft.</p><button type="button" onClick={onStart} className="admin-primary-button mt-5 min-h-11"><Send className="h-4 w-4" />Erste Rechnungen versenden</button></div>; }

function InvoiceReminderDialog({ invoice, customer, onOpenChange, onSent }: { invoice: InvoiceRecord | null; customer?: Customer; onOpenChange: (open: boolean) => void; onSent: () => Promise<void> }) {
  const [mode, setMode] = useState<"without" | "attachment">("without");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [fileError, setFileError] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileGeneration = useRef(0);

  useEffect(() => { fileGeneration.current += 1; setMode("without"); setFile(null); setFileHash(""); setFileError(""); setSending(false); }, [invoice]);

  async function chooseFile(next: File | null) {
    const generation = ++fileGeneration.current;
    setFile(null); setFileHash(""); setFileError("");
    if (!next) return;
    try { const hash = await validateReminderPdf(next); if (generation === fileGeneration.current) { setFile(next); setFileHash(hash); } } catch (caught) { if (generation === fileGeneration.current) setFileError(caught instanceof Error ? caught.message : "Datei konnte nicht geprüft werden."); }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!invoice || !customer?.patientNumber) return;
    if (mode === "attachment" && (!file || fileError)) return setFileError("Bitte wählen Sie eine gültige, passwortgeschützte PDF aus.");
    setSending(true);
    try {
      const base64 = file ? await reminderFileToBase64(file) : undefined;
      await adminApi.sendInvoice({ customerId: customer.id, patientNumber: customer.patientNumber, kind: "reminder", invoiceId: invoice.id, documentHash: file ? fileHash : undefined, pdfBase64: base64, fileName: file?.name });
      toast.success("Rechnungserinnerung wurde versendet.");
      setFile(null);
      await onSent();
    } catch (caught) {
      const uncertain = caught instanceof AdminApiError && ["TIMEOUT", "NETWORK", "invoice_uncertain", "invoice_already_processed"].includes(caught.code || "");
      if (uncertain) { setFile(null); toast.warning("Versandstatus unklar. Bitte prüfen Sie zuerst das Gesendet-Postfach und senden Sie nicht erneut."); await onSent(); }
      else setFileError(caught instanceof Error ? caught.message : "Erinnerung konnte nicht versendet werden.");
    } finally { setSending(false); }
  }

  return <Dialog open={Boolean(invoice)} onOpenChange={(open) => !sending && onOpenChange(open)}><DialogContent className="admin-root admin-work-dialog admin-invoice-reminder-dialog invoice-ui flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]"><DialogHeader className="border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#fff1da] text-[#8b5c0e]"><MailWarning className="h-5 w-5" /></span><div><DialogTitle className="!text-[18px] !font-semibold !text-[#173249]">Rechnungserinnerung senden</DialogTitle><DialogDescription className="mt-0.5 !text-[12px] !text-[#607989]">{customer ? `${customer.firstName} ${customer.lastName} · Pat.-Nr. ${customer.patientNumber}` : "Patient:in nicht gefunden"}</DialogDescription></div></div></DialogHeader><form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="admin-scrollbar admin-dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7"><div className="rounded-[12px] border border-[#d7e5ed] bg-[#f7fbfd] p-4"><div className="text-[11px] font-medium text-[#607989]">Rechnung</div><div className="mt-1 text-[13px] font-semibold text-[#29475d]">{invoice?.invoiceNumber || "Ohne Rechnungsnummer"}</div></div><fieldset className="mt-5"><legend className="admin-label">Was soll versendet werden?</legend><div className="grid gap-3"><ReminderMode checked={mode === "without"} onSelect={() => { setMode("without"); setFile(null); setFileError(""); }} icon={MailCheck} title="Erinnerung ohne Anhang" text="Eine freundliche E-Mail ohne erneute Rechnungsdatei." /><ReminderMode checked={mode === "attachment"} onSelect={() => setMode("attachment")} icon={FileKey2} title="Geschützte Rechnung erneut beifügen" text="Die Rechnung wird erneut hochgeladen, geprüft und nicht gespeichert." /></div></fieldset>{mode === "attachment" && <div className="mt-4"><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-[105px] w-full items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#a9c3d3] bg-[#f7fbfd] px-4 text-left hover:bg-[#f0f8fc]"><UploadCloud className="h-6 w-6 shrink-0 text-[#326d90]" /><span><span className="block text-[13px] font-semibold text-[#29475d]">{file ? file.name : "Passwortgeschützte PDF auswählen"}</span><span className="mt-1 block text-[11px] text-[#607989]">Maximal 2,8 MB · Kennwort separat bekannt</span></span></button><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void chooseFile(event.target.files?.[0] || null)} /></div>}{fileError && <div className="mt-4 flex items-start gap-2 rounded-[11px] border border-[#e9b2ab] bg-[#fff5f3] p-3 text-[11px] leading-5 text-[#96362b]" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{fileError}</div>}<div className="mt-5 flex items-start gap-2 rounded-[11px] bg-[#edf5f9] p-3 text-[11px] leading-5 text-[#526f82]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#326d90]" />Einwilligung und E-Mail-Adresse werden unmittelbar vor dem Versand erneut serverseitig geprüft.</div></div><div className="flex shrink-0 gap-2 border-t border-[#deebf2] bg-[#fbfdfe] px-5 py-4 sm:justify-end sm:px-7"><button type="button" onClick={() => onOpenChange(false)} disabled={sending} className="admin-secondary-button min-h-11 flex-1 sm:flex-none">Abbrechen</button><button type="submit" disabled={sending || !invoice || !customer || (mode === "attachment" && !file)} className="admin-primary-button min-h-11 flex-1 sm:flex-none">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? "Wird versendet …" : "Erinnerung senden"}</button></div></form></DialogContent></Dialog>;
}

function ReminderMode({ checked, onSelect, icon: Icon, title, text }: { checked: boolean; onSelect: () => void; icon: React.ElementType; title: string; text: string }) { return <label className={`flex min-h-[82px] cursor-pointer items-start gap-3 rounded-[12px] border px-4 py-3.5 ${checked ? "border-[#79a9c4] bg-[#eef7fc]" : "border-[#d7e4ec] bg-white"}`}><input type="radio" name="reminder-mode" checked={checked} onChange={onSelect} className="mt-1 h-4 w-4 accent-[#063255]" /><Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#3b7596]" /><span><span className="block text-[13px] font-semibold text-[#29475d]">{title}</span><span className="mt-0.5 block text-[11px] leading-5 text-[#607989]">{text}</span></span></label>; }

async function validateReminderPdf(file: File) { if (!file.size || file.size > 2_800_000) throw new Error("PDF muss kleiner als 2,8 MB sein."); const buffer = await file.arrayBuffer(); const bytes = new Uint8Array(buffer); if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new Error("Die Datei ist keine gültige PDF."); const marker = new TextEncoder().encode("/Encrypt"); let encrypted = false; outer: for (let index = 0; index <= bytes.length - marker.length; index += 1) { for (let offset = 0; offset < marker.length; offset += 1) if (bytes[index + offset] !== marker[offset]) continue outer; encrypted = true; break; } if (!encrypted) throw new Error("Diese PDF ist nicht passwortgeschützt und darf nicht versendet werden."); const digest = await crypto.subtle.digest("SHA-256", buffer); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function reminderFileToBase64(file: File) { return file.arrayBuffer().then((buffer) => { const bytes = new Uint8Array(buffer); const chunks: string[] = []; for (let index = 0; index < bytes.length; index += 0x8000) chunks.push(String.fromCharCode(...bytes.subarray(index, index + 0x8000))); return btoa(chunks.join("")); }); }
function latestDelivery(invoiceId: string, deliveries: InvoiceDelivery[]) { return deliveries.filter((delivery) => delivery.invoiceId === invoiceId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]; }
function canRemind(invoice: InvoiceRecord, customer?: Customer, delivery?: InvoiceDelivery) { return Boolean((invoice.status === "sent") && customer?.status === "active" && customer.patientNumber && customer.invoiceEmailConsent && customer.email && /^\S+@\S+\.\S+$/.test(customer.email) && delivery?.status !== "uncertain"); }
function reminderBlockReason(invoice: InvoiceRecord, customer?: Customer, delivery?: InvoiceDelivery) { if (invoice.status === "paid") return "Bereits als bezahlt gemeldet"; if (invoice.status === "reminder_sent") return "Erinnerung bereits versendet"; if (invoice.status === "not_sent") return "Rechnung wurde noch nicht erfolgreich versendet"; if (delivery?.status === "uncertain") return "Zuerst Gesendet-Postfach prüfen"; if (!customer?.invoiceEmailConsent) return "Einwilligung für Rechnungs-E-Mails fehlt"; if (!customer?.email) return "Keine E-Mail-Adresse hinterlegt"; return "Stammdaten müssen zuerst geprüft werden"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

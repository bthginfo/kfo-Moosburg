import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileKey2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MailCheck,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  UserRoundSearch,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { adminApi, AdminApiError } from "../api";
import type { Customer, InvoiceDeliveryStatus } from "../types";

const MAX_PDF_BYTES = 2_800_000;
const MAX_TOTAL_BYTES = 100_000_000;
const MAX_FILES = 250;
const MAX_NAME_LENGTH = 180;

type LocalResult = InvoiceDeliveryStatus | "ready";
type InvoiceFile = {
  id: string;
  name: string;
  file?: File;
  size: number;
  encrypted: boolean;
  hash: string;
  customerId: string;
  autoMatches: string[];
  result: LocalResult;
  message: string;
};

type Props = {
  open: boolean;
  customers: Customer[];
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void> | void;
};

const steps = ["Dateien", "Zuordnung", "Freigabe", "Versand", "Ergebnis"];

export function InvoiceSendWizard({ open, customers, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState<InvoiceFile[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [confirmedTab, setConfirmedTab] = useState(false);
  const [confirmedPassword, setConfirmedPassword] = useState(false);
  const [pickerRow, setPickerRow] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const parseGeneration = useRef(0);

  const eligibleCustomers = useMemo(() => customers.filter((customer) => customer.status === "active" && customer.patientNumber), [customers]);
  const readyRows = useMemo(() => rows.filter((row) => canSend(row, customers)), [rows, customers]);
  const sentCount = rows.filter((row) => row.result === "sent").length;
  const uncertainCount = rows.filter((row) => row.result === "uncertain").length;
  const failedCount = rows.filter((row) => row.result === "failed").length;

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    if (!sending) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [sending]);

  function reset() {
    parseGeneration.current += 1;
    setStep(1);
    setRows([]);
    setIssues([]);
    setParsing(false);
    setConfirmedTab(false);
    setConfirmedPassword(false);
    setPickerRow("");
    setPickerSearch("");
    setSending(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function requestClose(nextOpen: boolean) {
    if (!nextOpen && sending) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  async function ingest(fileList: FileList | File[]) {
    const generation = ++parseGeneration.current;
    setParsing(true);
    setIssues([]);
    try {
      const extracted = await extractFiles(Array.from(fileList));
      const nextRows: InvoiceFile[] = [];
      const nextIssues = [...extracted.issues];
      const seenHashes = new Set<string>();
      for (const file of extracted.files) {
        try {
          const validation = await inspectPdf(file);
          if (seenHashes.has(validation.hash)) { nextIssues.push(`${file.name}: Doppelte Datei wurde ausgelassen.`); continue; }
          seenHashes.add(validation.hash);
          const matches = findMatches(file.name, eligibleCustomers);
          nextRows.push({
            id: crypto.randomUUID(), name: file.name, file, size: file.size,
            encrypted: validation.encrypted, hash: validation.hash,
            customerId: matches.length === 1 ? matches[0].id : "",
            autoMatches: matches.map((customer) => customer.id), result: "ready", message: "",
          });
        } catch (error) {
          nextIssues.push(`${file.name}: ${error instanceof Error ? error.message : "Datei konnte nicht gelesen werden."}`);
        }
      }
      if (generation !== parseGeneration.current) return;
      setRows(nextRows);
      setIssues(nextIssues);
      if (nextRows.length) setStep(2);
    } finally {
      if (generation === parseGeneration.current) setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function assign(rowId: string, customerId: string) {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, customerId } : row));
    setPickerRow("");
    setPickerSearch("");
  }

  async function sendRows(onlyFailed = false) {
    const queue = rows.filter((row) => canSend(row, customers) && row.file && (!onlyFailed || row.result === "failed") && row.result !== "sent" && row.result !== "uncertain");
    if (!queue.length) return;
    setStep(4);
    setSending(true);
    for (const row of queue) {
      const customer = customers.find((item) => item.id === row.customerId);
      if (!customer?.patientNumber || !row.file) continue;
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, result: "processing", message: "Wird sicher übertragen …" } : item));
      try {
        const base64 = await fileToBase64(row.file);
        const response = await adminApi.sendInvoice({
          customerId: customer.id,
          patientNumber: customer.patientNumber,
          invoiceNumber: invoiceNumberFromName(row.name),
          issuedAt: issuedAtFromName(row.name),
          documentHash: row.hash,
          pdfBase64: base64,
          fileName: row.name,
          kind: "invoice",
        });
        setRows((current) => current.map((item) => item.id === row.id ? { ...item, file: undefined, result: response.delivery.status, message: "Vom E-Mail-Server angenommen" } : item));
      } catch (error) {
        const uncertain = isUncertain(error);
        setRows((current) => current.map((item) => item.id === row.id ? {
          ...item,
          file: uncertain ? undefined : item.file,
          result: uncertain ? "uncertain" : "failed",
          message: uncertain ? "Status unklar – bitte zuerst das gesendete Postfach prüfen." : (error instanceof Error ? error.message : "Versand nicht möglich."),
        } : item));
      }
    }
    setSending(false);
    setStep(5);
    await onComplete();
  }

  const pickerCustomers = eligibleCustomers.filter((customer) => {
    const term = pickerSearch.trim().toLowerCase();
    return !term || `${customer.firstName} ${customer.lastName} ${customer.patientNumber}`.toLowerCase().includes(term);
  }).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="admin-root admin-work-dialog admin-invoice-dialog invoice-ui flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]" onInteractOutside={(event) => sending && event.preventDefault()}>
        <DialogHeader className="border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#e7f3fa] text-[#063255]"><FileKey2 className="h-[22px] w-[22px]" /></span>
            <div><DialogTitle className="!text-[19px] !font-semibold !leading-6 !text-[#173249]">Rechnungen sicher versenden</DialogTitle><DialogDescription className="mt-0.5 !text-[12px] !text-[#607989]">Geführt, geprüft und ohne dauerhafte Dateispeicherung</DialogDescription></div>
          </div>
        </DialogHeader>

        <div className="border-b border-[#e0eaf0] bg-[#f8fbfd] px-5 py-4 sm:px-7" aria-label={`Schritt ${step} von ${steps.length}: ${steps[step - 1]}`}>
          <div className="grid grid-cols-5 gap-1 sm:gap-3">{steps.map((label, index) => { const number = index + 1; const done = number < step; const active = number === step; return <div key={label} className="min-w-0"><div className={`h-1.5 rounded-sm ${done || active ? "bg-[#063255]" : "bg-[#dce7ed]"}`} /><div className={`mt-2 hidden text-[11px] font-semibold sm:block ${active ? "text-[#063255]" : done ? "text-[#4a687c]" : "text-[#8495a0]"}`}>{number}. {label}</div><span className="sr-only">{number}. {label}{active ? ", aktuell" : done ? ", erledigt" : ""}</span></div>; })}</div>
        </div>

        <div className="admin-scrollbar admin-dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-8">
          {step === 1 && <UploadStep inputRef={inputRef} parsing={parsing} dragActive={dragActive} issues={issues} onFiles={ingest} onDragActive={setDragActive} />}
          {step === 2 && <MappingStep rows={rows} issues={issues} customers={customers} pickerRow={pickerRow} pickerSearch={pickerSearch} pickerCustomers={pickerCustomers} onPickerRow={setPickerRow} onPickerSearch={setPickerSearch} onAssign={assign} />}
          {step === 3 && <ApprovalStep total={rows.length} ready={readyRows.length} blocked={rows.length - readyRows.length} confirmedTab={confirmedTab} confirmedPassword={confirmedPassword} onConfirmedTab={setConfirmedTab} onConfirmedPassword={setConfirmedPassword} />}
          {step === 4 && <SendingStep rows={rows} customers={customers} />}
          {step === 5 && <ResultStep rows={rows} customers={customers} sent={sentCount} failed={failedCount} uncertain={uncertainCount} />}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#deebf2] bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="max-w-xl text-[11px] leading-5 text-[#607989]">PDF-Dateien bleiben nur in diesem geöffneten Browser-Dialog und werden nach erfolgreichem Versand aus dem Arbeitsspeicher entfernt.</p>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            {step > 1 && step < 4 && <button type="button" onClick={() => setStep((current) => current - 1)} className="admin-secondary-button min-h-11"><ArrowLeft className="h-4 w-4" />Zurück</button>}
            {step === 1 && <button type="button" onClick={() => requestClose(false)} className="admin-secondary-button min-h-11">Abbrechen</button>}
            {step === 2 && <button type="button" disabled={!readyRows.length} onClick={() => setStep(3)} className="admin-primary-button min-h-11">Freigabe prüfen<ChevronRight className="h-4 w-4" /></button>}
            {step === 3 && <button type="button" disabled={!readyRows.length || !confirmedTab || !confirmedPassword} onClick={() => void sendRows()} className="admin-primary-button min-h-11"><Send className="h-4 w-4" />{readyRows.length} {readyRows.length === 1 ? "Rechnung" : "Rechnungen"} senden</button>}
            {step === 4 && <button type="button" disabled className="admin-primary-button min-h-11"><LoaderCircle className="h-4 w-4 animate-spin" />Versand läuft</button>}
            {step === 5 && failedCount > 0 && <button type="button" onClick={() => void sendRows(true)} className="admin-secondary-button min-h-11">Sichere Fehler erneut senden</button>}
            {step === 5 && <button type="button" onClick={() => requestClose(false)} className="admin-primary-button min-h-11"><Check className="h-4 w-4" />Fertig</button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadStep({ inputRef, parsing, dragActive, issues, onFiles, onDragActive }: { inputRef: React.RefObject<HTMLInputElement>; parsing: boolean; dragActive: boolean; issues: string[]; onFiles: (files: FileList | File[]) => Promise<void>; onDragActive: (active: boolean) => void }) {
  const choose = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.length) void onFiles(event.target.files); };
  return <section className="mx-auto max-w-4xl">
    <div className="mb-6"><div className="admin-kicker mb-2">Schritt 1</div><h2 className="!text-[20px] !font-semibold !text-[#173249]">Rechnungsdateien auswählen</h2><p className="mt-2 !text-[13px] !leading-6 !text-[#607989]">Wählen Sie einzelne PDF-Rechnungen oder ein ZIP-Archiv. ZIP-Dateien werden ausschließlich in diesem Browser entpackt.</p></div>
    <button type="button" disabled={parsing} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); onDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => onDragActive(false)} onDrop={(event) => { event.preventDefault(); onDragActive(false); if (event.dataTransfer.files.length) void onFiles(event.dataTransfer.files); }} className={`flex min-h-[250px] w-full flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-6 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f58a07]/25 ${dragActive ? "border-[#f58a07] bg-[#fff8ed]" : "border-[#a9c3d3] bg-[#f7fbfd] hover:border-[#6e9bb6] hover:bg-[#f0f8fc]"}`}>
      {parsing ? <><LoaderCircle className="h-9 w-9 animate-spin text-[#f58a07]" /><span className="mt-4 text-[15px] font-semibold text-[#173249]">Dateien werden sicher geprüft …</span></> : <><span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-white text-[#063255] shadow-[0_7px_20px_rgba(6,50,85,.09)]"><UploadCloud className="h-8 w-8" /></span><span className="mt-4 text-[16px] font-semibold text-[#173249]">PDF oder ZIP hier ablegen</span><span className="mt-1 text-[12px] text-[#607989]">oder klicken, um Dateien auszuwählen</span><span className="mt-4 rounded-[8px] bg-white px-3 py-1.5 text-[11px] font-medium text-[#46667b]">Max. 250 PDFs · je 2,8 MB · insgesamt 100 MB</span></>}
    </button>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf,application/zip,.zip" multiple className="sr-only" onChange={choose} />
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-[13px] border border-[#d7e5ed] bg-white p-4"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#29485e]"><FileText className="h-[18px] w-[18px] text-[#457d9d]" />Eindeutiger Dateiname</div><p className="mt-2 text-[12px] leading-5 text-[#607989]">Die Patientennummer muss als eigener Bestandteil enthalten sein.</p><code className="mt-3 block rounded-[8px] bg-[#edf5f9] px-3 py-2 text-[12px] font-semibold text-[#063255]">Rechnung_12345_2026-08.pdf</code></div>
      <div className="rounded-[13px] border border-[#d7e5ed] bg-white p-4"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#29485e]"><LockKeyhole className="h-[18px] w-[18px] text-[#457d9d]" />Nur geschützte PDFs</div><p className="mt-2 text-[12px] leading-5 text-[#607989]">Die Datei muss bereits passwortgeschützt sein. Das Kennwort wird separat mitgeteilt und nie in dieser Anwendung erfasst.</p></div>
    </div>
    {issues.length > 0 && <div className="mt-5 rounded-[13px] border border-[#e9b2ab] bg-[#fff5f3] p-4" role="alert"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#9f2e23]"><AlertTriangle className="h-[18px] w-[18px]" />{issues.length} {issues.length === 1 ? "Datei benötigt Aufmerksamkeit" : "Dateien benötigen Aufmerksamkeit"}</div><ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#87443d]">{issues.slice(0, 8).map((issue) => <li key={issue}>• {issue}</li>)}</ul>{issues.length > 8 && <p className="mt-2 text-[11px] text-[#87443d]">… und {issues.length - 8} weitere</p>}</div>}
  </section>;
}

function MappingStep({ rows, issues, customers, pickerRow, pickerSearch, pickerCustomers, onPickerRow, onPickerSearch, onAssign }: { rows: InvoiceFile[]; issues: string[]; customers: Customer[]; pickerRow: string; pickerSearch: string; pickerCustomers: Customer[]; onPickerRow: (id: string) => void; onPickerSearch: (value: string) => void; onAssign: (rowId: string, customerId: string) => void }) {
  const ready = rows.filter((row) => canSend(row, customers)).length;
  return <section><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="admin-kicker mb-2">Schritt 2</div><h2 className="!text-[20px] !font-semibold !text-[#173249]">Zuordnung prüfen</h2><p className="mt-2 !text-[13px] !leading-6 !text-[#607989]">Wir ordnen ausschließlich über die Patientennummer zu – niemals über einen Namen.</p></div><div className="rounded-[10px] bg-[#eaf5fb] px-4 py-2.5 text-[12px] font-semibold text-[#174f71]">{ready} von {rows.length} versandbereit</div></div>
    {issues.length > 0 && <div className="mb-4 flex items-start gap-2 rounded-[11px] border border-[#ebcc99] bg-[#fff9ee] p-3 text-[11px] leading-5 text-[#795514]" role="status"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{issues.length} {issues.length === 1 ? "Datei wurde" : "Dateien wurden"} ausgelassen.</strong> Nur gültige PDF-Rechnungen erscheinen in der Liste.</span></div>}
    <div className="hidden overflow-visible rounded-[14px] border border-[#d8e5ed] md:block"><table className="w-full table-fixed text-left"><thead className="bg-[#f5f9fb] text-[10px] font-semibold uppercase tracking-[.06em] text-[#69808f]"><tr><th className="w-[34%] px-4 py-3">Datei</th><th className="w-[31%] px-4 py-3">Patient:in</th><th className="px-4 py-3">Prüfung</th></tr></thead><tbody className="divide-y divide-[#e4edf2] bg-white">{rows.map((row) => <MappingRow key={row.id} row={row} customers={customers} pickerOpen={pickerRow === row.id} pickerSearch={pickerSearch} pickerCustomers={pickerCustomers} onPickerOpen={() => { onPickerRow(pickerRow === row.id ? "" : row.id); onPickerSearch(""); }} onPickerSearch={onPickerSearch} onAssign={(customerId) => onAssign(row.id, customerId)} />)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{rows.map((row) => <MappingCard key={row.id} row={row} customers={customers} pickerOpen={pickerRow === row.id} pickerSearch={pickerSearch} pickerCustomers={pickerCustomers} onPickerOpen={() => { onPickerRow(pickerRow === row.id ? "" : row.id); onPickerSearch(""); }} onPickerSearch={onPickerSearch} onAssign={(customerId) => onAssign(row.id, customerId)} />)}</div>
  </section>;
}

function MappingRow({ row, customers, pickerOpen, pickerSearch, pickerCustomers, onPickerOpen, onPickerSearch, onAssign }: PickerProps) {
  const customer = customers.find((item) => item.id === row.customerId);
  return <tr className="align-top"><td className="px-4 py-4"><FileIdentity row={row} /></td><td className="relative px-4 py-4"><PatientIdentity customer={customer} row={row} pickerOpen={pickerOpen} onPickerOpen={onPickerOpen} />{pickerOpen && <PatientPicker id={`patient-picker-${row.id}`} value={pickerSearch} customers={pickerCustomers} onChange={onPickerSearch} onAssign={onAssign} onClose={onPickerOpen} />}</td><td className="px-4 py-4"><BlockerList row={row} customer={customer} /></td></tr>;
}

type PickerProps = { row: InvoiceFile; customers: Customer[]; pickerOpen: boolean; pickerSearch: string; pickerCustomers: Customer[]; onPickerOpen: () => void; onPickerSearch: (value: string) => void; onAssign: (customerId: string) => void };
function MappingCard(props: PickerProps) { const customer = props.customers.find((item) => item.id === props.row.customerId); return <article className="rounded-[14px] border border-[#d8e5ed] bg-white p-4"><FileIdentity row={props.row} /><div className="relative mt-4 border-t border-[#e8eff3] pt-4"><PatientIdentity customer={customer} row={props.row} pickerOpen={props.pickerOpen} onPickerOpen={props.onPickerOpen} />{props.pickerOpen && <PatientPicker id={`patient-picker-${props.row.id}`} value={props.pickerSearch} customers={props.pickerCustomers} onChange={props.onPickerSearch} onAssign={props.onAssign} onClose={props.onPickerOpen} />}</div><div className="mt-4"><BlockerList row={props.row} customer={customer} /></div></article>; }

function FileIdentity({ row }: { row: InvoiceFile }) { return <div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f3f9] text-[#326d90]"><FileText className="h-[18px] w-[18px]" /></span><div className="min-w-0"><div className="break-all text-[12px] font-semibold leading-5 text-[#29475d]">{row.name}</div><div className="mt-0.5 text-[10px] text-[#7a8d99]">{formatBytes(row.size)}</div></div></div>; }
function PatientIdentity({ customer, row, pickerOpen, onPickerOpen }: { customer?: Customer; row: InvoiceFile; pickerOpen: boolean; onPickerOpen: () => void }) { const pickerId = `patient-picker-${row.id}`; return <div>{customer ? <div><div className="text-[12px] font-semibold text-[#29475d]">{customer.firstName} {customer.lastName}</div><div className="mt-0.5 text-[12px] text-[#6f8492]">Pat.-Nr. {customer.patientNumber}</div></div> : <div className="text-[12px] font-semibold text-[#9a4f21]">{row.autoMatches.length > 1 ? "Mehrere Nummern gefunden" : "Keine eindeutige Zuordnung"}</div>}<button type="button" onClick={onPickerOpen} aria-expanded={pickerOpen} aria-controls={pickerId} aria-haspopup="listbox" className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-[#bfd1dc] bg-white px-3 text-[12px] font-semibold text-[#174f71] hover:bg-[#f3f9fc]"><UserRoundSearch className="h-4 w-4" />{customer ? "Zuordnung ändern" : "Patient:in auswählen"}</button></div>; }
function PatientPicker({ id, value, customers, onChange, onAssign, onClose }: { id: string; value: string; customers: Customer[]; onChange: (value: string) => void; onAssign: (id: string) => void; onClose: () => void }) { const listId = `${id}-list`; return <div id={id} className="absolute left-2 right-2 top-[100px] z-20 rounded-[12px] border border-[#abc2d1] bg-white p-3 shadow-[0_18px_40px_rgba(6,50,85,.2)] md:left-4 md:right-4"><label className="relative block"><span className="sr-only">Patient:innen durchsuchen</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748a97]" /><input autoFocus role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" className="admin-field admin-field-leading h-11 w-full" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }} placeholder="Name oder Patientennummer" /></label><div id={listId} role="listbox" aria-label="Passende Patient:innen" className="admin-scrollbar mt-2 max-h-52 overflow-y-auto">{customers.map((customer) => <button key={customer.id} type="button" role="option" aria-selected="false" onClick={() => onAssign(customer.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[9px] px-3 text-left hover:bg-[#edf6fb]"><span className="text-[12px] font-semibold text-[#29475d]">{customer.firstName} {customer.lastName}</span><span className="text-[12px] text-[#6f8492]">{customer.patientNumber}</span></button>)}{!customers.length && <p className="px-3 py-4 text-center text-[12px] text-[#718692]">Keine passenden aktiven Patient:innen gefunden.</p>}</div></div>; }

function BlockerList({ row, customer }: { row: InvoiceFile; customer?: Customer }) { const blockers = blockersFor(row, customer); if (!blockers.length) return <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#e6f5ed] px-2.5 py-1.5 text-[11px] font-semibold text-[#267152]"><CheckCircle2 className="h-4 w-4" />Versandbereit</span>; return <div className="flex flex-wrap gap-1.5">{blockers.map((blocker) => <span key={blocker.label} className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1.5 text-[10px] font-semibold ${blocker.critical ? "bg-[#fff0ed] text-[#a33b2d]" : "bg-[#fff4df] text-[#8a5d0f]"}`}><AlertTriangle className="h-3.5 w-3.5" />{blocker.label}</span>)}</div>; }

function ApprovalStep({ total, ready, blocked, confirmedTab, confirmedPassword, onConfirmedTab, onConfirmedPassword }: { total: number; ready: number; blocked: number; confirmedTab: boolean; confirmedPassword: boolean; onConfirmedTab: (value: boolean) => void; onConfirmedPassword: (value: boolean) => void }) { return <section className="mx-auto max-w-4xl"><div className="admin-kicker mb-2">Schritt 3</div><h2 className="!text-[20px] !font-semibold !text-[#173249]">Versand freigeben</h2><p className="mt-2 !text-[13px] !leading-6 !text-[#607989]">Bitte nehmen Sie sich einen Moment für die letzte Sicherheitsprüfung.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><SummaryNumber value={total} label="geprüft" /><SummaryNumber value={ready} label="werden versendet" good /><SummaryNumber value={blocked} label="werden ausgelassen" warning={blocked > 0} /></div><div className="mt-6 rounded-[15px] border border-[#bfd6e3] bg-[#edf7fc] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#155f84]" /><div><h3 className="text-[15px] font-semibold text-[#173249]">Was jetzt passiert</h3><ul className="mt-2 space-y-2 text-[12px] leading-5 text-[#45657a]"><li>• Jede Rechnung wird einzeln geprüft und nacheinander versendet.</li><li>• Die Anwendung speichert weder PDF noch Kennwort in Datenbank, Dateiablage oder Browser-Speicher.</li><li>• Nur Versandstatus, Rechnungsempfänger:in und Zeitstempel bleiben nachvollziehbar.</li></ul></div></div></div><div className="mt-5 space-y-3"><ConfirmCheck checked={confirmedTab} onChange={onConfirmedTab} title="Ich lasse diesen Tab bis zum Ergebnis geöffnet" description="Beim Schließen kann der laufende Versand nicht zuverlässig fortgesetzt werden." /><ConfirmCheck checked={confirmedPassword} onChange={onConfirmedPassword} title="Die PDF-Kennwörter sind den Empfänger:innen separat bekannt" description="Kennwörter dürfen nicht gemeinsam mit der Rechnung per E-Mail versendet werden." /></div></section>; }
function SummaryNumber({ value, label, good, warning }: { value: number; label: string; good?: boolean; warning?: boolean }) { return <div className={`rounded-[13px] border p-4 ${good ? "border-[#b9dac8] bg-[#f0faf5]" : warning ? "border-[#ebcc99] bg-[#fff9ee]" : "border-[#d8e5ed] bg-white"}`}><div className="text-[24px] font-semibold tracking-[-.03em] text-[#173249]">{value}</div><div className="mt-1 text-[11px] font-medium text-[#607989]">{label}</div></div>; }
function ConfirmCheck({ checked, onChange, title, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description: string }) { return <label className={`flex min-h-[76px] cursor-pointer items-start gap-3 rounded-[13px] border px-4 py-3.5 ${checked ? "border-[#82b5cf] bg-[#f0f8fc]" : "border-[#d2e1ea] bg-white"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#063255]" /><span><span className="block text-[13px] font-semibold text-[#29475d]">{title}</span><span className="mt-0.5 block text-[11px] leading-5 text-[#607989]">{description}</span></span></label>; }

function SendingStep({ rows, customers }: { rows: InvoiceFile[]; customers: Customer[] }) { const total = rows.filter((row) => canSend(row, customers) || ["processing", "sent", "failed", "uncertain"].includes(row.result)).length; const finished = rows.filter((row) => ["sent", "failed", "uncertain"].includes(row.result)).length; const percentage = total ? Math.round(finished / total * 100) : 0; return <section><div className="mx-auto max-w-3xl text-center"><div className="admin-kicker mb-2">Schritt 4</div><h2 className="!text-[20px] !font-semibold !text-[#173249]">Rechnungen werden versendet</h2><p className="mt-2 !text-[13px] !leading-6 !text-[#607989]">Bitte lassen Sie diesen Tab geöffnet. Sie können den Fortschritt für jede Person sehen.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dfeaf0]" role="progressbar" aria-label="Fortschritt des Rechnungsversands" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full bg-[#f58a07] transition-[width] duration-300" style={{ width: `${percentage}%` }} /></div><div className="mt-2 text-[12px] font-semibold text-[#45657a]" aria-live="polite">{finished} von {total} abgeschlossen</div></div><div className="mx-auto mt-6 max-w-4xl space-y-2">{rows.filter((row) => canSend(row, customers) || row.result !== "ready").map((row) => <ProgressRow key={row.id} row={row} customer={customers.find((item) => item.id === row.customerId)} />)}</div></section>; }
function ProgressRow({ row, customer }: { row: InvoiceFile; customer?: Customer }) { const detail = resultDetail(row.result); const Icon = detail.icon; return <div className="flex min-h-[64px] items-center gap-3 rounded-[12px] border border-[#dbe6ed] bg-white px-4 py-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${detail.className}`}><Icon className={`h-[18px] w-[18px] ${row.result === "processing" ? "animate-spin" : ""}`} /></span><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold text-[#29475d]">{customer ? `${customer.firstName} ${customer.lastName}` : row.name}</div><div className="mt-0.5 truncate text-[10px] text-[#6f8492]">{row.message || detail.label}</div></div><span className="hidden text-[11px] font-semibold text-[#526f82] sm:block">{detail.label}</span></div>; }

function ResultStep({ rows, customers, sent, failed, uncertain }: { rows: InvoiceFile[]; customers: Customer[]; sent: number; failed: number; uncertain: number }) { return <section><div className="mx-auto max-w-3xl text-center"><span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] ${failed || uncertain ? "bg-[#fff2df] text-[#9a6108]" : "bg-[#e6f5ed] text-[#267152]"}`}>{failed || uncertain ? <AlertTriangle className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}</span><div className="admin-kicker mb-2 mt-5">Schritt 5</div><h2 className="!text-[20px] !font-semibold !text-[#173249]">Versand abgeschlossen</h2><p className="mt-2 !text-[13px] !leading-6 !text-[#607989]">{failed || uncertain ? "Einige Einträge benötigen noch Ihre Aufmerksamkeit." : "Alle freigegebenen Rechnungen wurden vom E-Mail-Server angenommen."}</p><div className="mt-5 grid grid-cols-3 gap-3"><SummaryNumber value={sent} label="versendet" good /><SummaryNumber value={failed} label="nicht versendet" warning={failed > 0} /><SummaryNumber value={uncertain} label="Status unklar" warning={uncertain > 0} /></div></div>{uncertain > 0 && <div className="mx-auto mt-5 max-w-4xl rounded-[13px] border border-[#e7bd78] bg-[#fff8eb] p-4 text-[12px] leading-5 text-[#795514]"><strong>Wichtig:</strong> Ein unklarer Eintrag darf nicht automatisch erneut versendet werden. Prüfen Sie zuerst das Gesendet-Postfach, damit niemand eine Rechnung doppelt erhält.</div>}<div className="mx-auto mt-6 max-w-4xl space-y-2">{rows.filter((row) => ["sent", "failed", "uncertain"].includes(row.result)).map((row) => <ProgressRow key={row.id} row={row} customer={customers.find((item) => item.id === row.customerId)} />)}</div></section>; }

async function extractFiles(inputs: File[]): Promise<{ files: File[]; issues: string[] }> {
  const files: File[] = [];
  const issues: string[] = [];
  let totalBytes = 0;
  for (const input of inputs) {
    if (files.length >= MAX_FILES) { issues.push(`Es werden höchstens ${MAX_FILES} PDF-Dateien verarbeitet.`); break; }
    const lower = input.name.toLowerCase();
    if (lower.endsWith(".pdf")) {
      if (input.name.length > MAX_NAME_LENGTH) { issues.push(`${input.name.slice(0, 40)}…: Dateiname ist zu lang.`); continue; }
      totalBytes += input.size;
      if (totalBytes > MAX_TOTAL_BYTES) { issues.push("Die Dateien sind zusammen größer als 100 MB."); break; }
      files.push(input);
      continue;
    }
    if (!lower.endsWith(".zip")) { issues.push(`${input.name}: Nur PDF- und ZIP-Dateien sind erlaubt.`); continue; }
    if (input.size > MAX_TOTAL_BYTES) { issues.push(`${input.name}: ZIP-Datei ist zu groß.`); continue; }
    try {
      // CRC checking would decompress every entry before we can inspect the ZIP metadata.
      // Validate sizes/ratios first, then decompress only the entries that passed.
      const zip = await JSZip.loadAsync(input, { checkCRC32: false, createFolders: false });
      const entries = Object.values(zip.files).filter((entry) => !entry.dir);
      if (files.length + entries.length > MAX_FILES) { issues.push(`${input.name}: Das Archiv enthält mehr als ${MAX_FILES} Dateien.`); continue; }
      let zipSafe = true;
      let archiveBytes = 0;
      for (const entry of entries) {
        const meta = entry as typeof entry & { unsafeOriginalName?: string; _data?: { compressedSize?: number; uncompressedSize?: number } };
        const rawName = meta.unsafeOriginalName || entry.name;
        const segments = rawName.replace(/\\/g, "/").split("/");
        const baseName = segments.at(-1) || "";
        const compressed = meta._data?.compressedSize || 0;
        const uncompressed = meta._data?.uncompressedSize || 0;
        if (rawName.startsWith("/") || /^[a-z]:/i.test(rawName) || rawName.includes("\\") || segments.includes("..")) { issues.push(`${input.name}: Unsicherer Pfad im ZIP-Archiv erkannt.`); zipSafe = false; break; }
        if (!baseName.toLowerCase().endsWith(".pdf")) { issues.push(`${baseName || input.name}: Keine PDF-Datei.`); zipSafe = false; break; }
        if (!baseName || baseName.length > MAX_NAME_LENGTH) { issues.push(`${input.name}: Ein Dateiname im Archiv ist zu lang.`); zipSafe = false; break; }
        if (!compressed || !uncompressed || uncompressed > MAX_PDF_BYTES || uncompressed / compressed > 100) { issues.push(`${baseName}: Datei ist leer, zu groß oder ungewöhnlich stark komprimiert.`); zipSafe = false; break; }
        archiveBytes += uncompressed;
        if (totalBytes + archiveBytes > MAX_TOTAL_BYTES) { issues.push(`${input.name}: Entpackter Inhalt ist größer als 100 MB.`); zipSafe = false; break; }
      }
      if (!zipSafe) continue;
      totalBytes += archiveBytes;
      for (const entry of entries) {
        const baseName = entry.name.replace(/\\/g, "/").split("/").at(-1) || entry.name;
        const bytes = await entry.async("uint8array");
        const copiedBytes = new Uint8Array(bytes.byteLength);
        copiedBytes.set(bytes);
        files.push(new File([copiedBytes.buffer], baseName, { type: "application/pdf", lastModified: input.lastModified }));
      }
    } catch {
      issues.push(`${input.name}: ZIP-Archiv ist beschädigt oder konnte nicht sicher geprüft werden.`);
    }
  }
  return { files, issues };
}

async function inspectPdf(file: File): Promise<{ encrypted: boolean; hash: string }> {
  if (!file.size || file.size > MAX_PDF_BYTES) throw new Error("PDF muss kleiner als 2,8 MB sein.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new Error("Keine gültige PDF-Datei.");
  const encrypted = containsAscii(bytes, "/Encrypt");
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return { encrypted, hash: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("") };
}

function containsAscii(bytes: Uint8Array, value: string) { const needle = Array.from(value, (character) => character.charCodeAt(0)); outer: for (let index = 0; index <= bytes.length - needle.length; index += 1) { for (let offset = 0; offset < needle.length; offset += 1) if (bytes[index + offset] !== needle[offset]) continue outer; return true; } return false; }
function findMatches(name: string, customers: Customer[]) { return customers.filter((customer) => customer.patientNumber && patientNumberPattern(customer.patientNumber).test(name)); }
function patientNumberPattern(value: string) { const parts = value.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean).map(escapeRegex); const body = parts.join("[-_. ]*"); return new RegExp(`(^|[^a-zA-Z0-9])${body}(?=$|[^a-zA-Z0-9])`, "i"); }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function customerEmailValid(customer?: Customer) { return Boolean(customer?.email && /^\S+@\S+\.\S+$/.test(customer.email)); }
function blockersFor(row: InvoiceFile, customer?: Customer) { const result: Array<{ label: string; critical?: boolean }> = []; if (!row.encrypted) result.push({ label: "PDF nicht geschützt", critical: true }); if (!customer) result.push({ label: row.autoMatches.length > 1 ? "Zuordnung unklar" : "Nicht zugeordnet" }); else { if (customer.status !== "active") result.push({ label: "Patient:in nicht aktiv" }); if (!customerEmailValid(customer)) result.push({ label: "Keine gültige E-Mail" }); if (!customer.invoiceEmailConsent) result.push({ label: "Einwilligung fehlt", critical: true }); if (!customer.patientNumber) result.push({ label: "Patientennummer fehlt" }); } return result; }
function canSend(row: InvoiceFile, customers: Customer[]) { const customer = customers.find((item) => item.id === row.customerId); return Boolean(row.file && row.encrypted && customer?.status === "active" && customer.patientNumber && customer.invoiceEmailConsent && customerEmailValid(customer)); }
function fileToBase64(file: File): Promise<string> { return file.arrayBuffer().then((buffer) => { const bytes = new Uint8Array(buffer); const chunks: string[] = []; for (let index = 0; index < bytes.length; index += 0x8000) chunks.push(String.fromCharCode(...bytes.subarray(index, index + 0x8000))); return btoa(chunks.join("")); }); }
function invoiceNumberFromName(name: string) { return name.replace(/\.pdf$/i, "").slice(0, 100); }
function issuedAtFromName(name: string) { const match = name.match(/(?:^|[^0-9])(20\d{2})[-_.](0[1-9]|1[0-2])(?:[-_.]([0-2]\d|3[01]))?(?:[^0-9]|$)/); if (!match) return undefined; return `${match[1]}-${match[2]}-${match[3] || "01"}`; }
function isUncertain(error: unknown) { return error instanceof AdminApiError && ["TIMEOUT", "NETWORK", "invoice_uncertain", "invoice_already_processed"].includes(error.code || ""); }
function formatBytes(bytes: number) { return bytes < 1_000_000 ? `${Math.round(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`; }
function resultDetail(result: LocalResult) { if (result === "processing") return { label: "Wird versendet", className: "bg-[#e8f3f9] text-[#326d90]", icon: LoaderCircle }; if (result === "sent") return { label: "Versendet", className: "bg-[#e6f5ed] text-[#267152]", icon: CheckCircle2 }; if (result === "failed") return { label: "Nicht versendet", className: "bg-[#fff0ed] text-[#a33b2d]", icon: XCircle }; if (result === "uncertain") return { label: "Status unklar", className: "bg-[#fff4df] text-[#8a5d0f]", icon: AlertTriangle }; return { label: "Bereit", className: "bg-[#e8f3f9] text-[#326d90]", icon: FileCheck2 }; }

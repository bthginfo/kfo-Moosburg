import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { adminApi } from "../api";
import type { EstimateBundle } from "../types";

type ImportKind = "catalog" | "pointValues";
type RawRow = string[];
type CatalogImportRow = {
  code: string;
  name: string;
  description: string;
  category: string;
  points: number;
  unit: string;
  feeSystem: "BEMA";
  source: string;
  sourceVersion: string;
};
type PointValueImportRow = {
  quarter: string;
  fundGroup: number;
  fundType: string;
  fundTypeLabel: string;
  fundNumber: string;
  pwKfo: number;
  source: string;
  sourceUrl: string;
};
type ParsedRow = {
  row: number;
  value: CatalogImportRow | PointValueImportRow | null;
  error: string;
};

type Props = {
  kind: ImportKind | null;
  onClose: () => void;
  onImported: (bundle: EstimateBundle) => void;
};

const aliases: Record<string, string[]> = {
  code: ["code", "bema", "bema nr", "bema nummer", "position", "gebuehrennummer", "gebührennummer"],
  name: ["name", "bezeichnung", "leistung", "leistungsbezeichnung", "kurztext"],
  description: ["beschreibung", "langtext", "erlaeuterung", "erläuterung"],
  category: ["kategorie", "bereich", "abschnitt"],
  points: ["punkte", "punktzahl", "bewertungszahl", "bewertung"],
  unit: ["einheit", "mengeneinheit"],
  source: ["quelle", "source", "herkunft"],
  sourceVersion: ["version", "stand", "quellenstand", "gueltig ab", "gültig ab"],
  quarter: ["quartal", "quarter", "abrechnungsquartal", "abr zeit"],
  fundGroup: ["vergütungsgruppe", "verguetungsgruppe", "vg", "kassengruppe", "kgr", "fund group"],
  fundType: ["kassenart", "kassentyp", "kassenart code", "kk art", "kt", "fund type"],
  fundTypeLabel: ["kassenart bezeichnung", "kassenbezeichnung", "bezeichnung kassenart"],
  fundNumber: ["kassennummer", "ik", "institutionskennzeichen", "kassen nr", "kk nr bkv"],
  pwKfo: ["pw kfo", "punktwert kfo", "kfo punktwert", "punktwert", "pw-kfo"],
  sourceUrl: ["quellenlink", "quelle url", "source url", "url", "link"],
};

export function EstimateImportDialog({ kind, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (kind) {
      setFile(null);
      setRows([]);
      setError("");
    }
  }, [kind]);

  const validRows = useMemo(() => rows.filter((row) => row.value).map((row) => row.value!), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => row.error), [rows]);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected || !kind) return;
    if (!/\.(csv|xlsx)$/i.test(selected.name)) {
      setError("Bitte wählen Sie eine CSV- oder XLSX-Datei. Das alte XLS-Format wird nicht unterstützt.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("Die Datei ist größer als 10 MB. Bitte teilen Sie den Import auf.");
      return;
    }
    setParsing(true);
    setError("");
    setRows([]);
    try {
      const table = await readTable(selected);
      if (table.length < 2) throw new Error("Die Datei enthält keine Datenzeilen.");
      const headers = table[0].map((cell) => cell.trim());
      if (!headers.some(Boolean)) throw new Error("In der ersten Zeile wurden keine Spaltennamen gefunden.");
      const mapped = table.slice(1).map((row, index) => parseRow(kind, headers, row, index + 2));
      if (!mapped.length) throw new Error("Die Datei enthält keine Datenzeilen.");
      setFile(selected);
      setRows(mapped);
    } catch (caught) {
      setFile(null);
      setError(caught instanceof Error ? caught.message : "Die Datei konnte nicht gelesen werden.");
    } finally {
      setParsing(false);
    }
  }

  async function runImport() {
    if (!kind || !validRows.length) return;
    setSaving(true);
    setError("");
    try {
      const bundle = kind === "catalog"
        ? await adminApi.importEstimateCatalog(validRows as CatalogImportRow[])
        : await adminApi.importEstimatePointValues(validRows as PointValueImportRow[]);
      onImported(bundle);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Der Import konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  const catalog = kind === "catalog";
  return <Dialog open={Boolean(kind)} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="admin-root admin-work-dialog max-w-[900px] flex-col gap-0 overflow-hidden rounded-[18px] border-[#bdd1de] bg-white p-0">
      <DialogHeader className="border-b border-[#dce8ef] px-5 py-5 pr-14 sm:px-7">
        <DialogTitle className="!text-[18px] !font-semibold !text-[#173249]">{catalog ? "BEMA-Leistungen importieren" : "KZVB-Punktwerte importieren"}</DialogTitle>
        <DialogDescription className="mt-1 !text-[12px] !text-[#687f8e]">CSV oder XLSX prüfen, Fehler erkennen und nur vollständige Zeilen übernehmen.</DialogDescription>
      </DialogHeader>
      <div className="admin-dialog-scroll min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={parsing || saving} className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#bcd0dd] bg-[#f8fbfd] px-5 text-center transition hover:border-[#7399b1] hover:bg-[#f3f9fc] disabled:opacity-60">
          {parsing ? <LoaderCircle className="h-7 w-7 animate-spin text-[#f58a07]" /> : <UploadCloud className="h-7 w-7 text-[#245f85]" />}
          <span className="mt-3 text-[14px] font-semibold text-[#29475d]">{parsing ? "Datei wird geprüft …" : "CSV- oder XLSX-Datei auswählen"}</span>
          <span className="mt-1 text-[11px] text-[#718592]">Maximal 10 MB · Kopfzeile in der ersten Zeile</span>
        </button>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" onChange={choose} className="hidden" />

        {file && <div className="mt-4 flex items-center gap-3 rounded-[11px] border border-[#d5e3eb] bg-white px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#39755a]" />
          <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-[#29475d]">{file.name}</div><div className="mt-0.5 text-[11px] text-[#718592]">{rows.length} Datenzeilen erkannt</div></div>
          <button type="button" className="admin-secondary-button min-h-10" onClick={() => inputRef.current?.click()}>Andere Datei</button>
        </div>}

        {rows.length > 0 && <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[11px] border border-[#bcdac8] bg-[#eef9f2] p-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#286548]"><CheckCircle2 className="h-4 w-4" />{validRows.length} gültige Zeilen</div><p className="mt-1 text-[11px] leading-4 text-[#4d7561]">Diese Datensätze können übernommen werden.</p></div>
            <div className={`rounded-[11px] border p-4 ${invalidRows.length ? "border-[#edc67d] bg-[#fff9eb]" : "border-[#d9e5ec] bg-[#f7fafc]"}`}><div className={`flex items-center gap-2 text-[12px] font-semibold ${invalidRows.length ? "text-[#79500e]" : "text-[#607887]"}`}><AlertTriangle className="h-4 w-4" />{invalidRows.length} fehlerhafte Zeilen</div><p className="mt-1 text-[11px] leading-4 text-[#6d7f8a]">Fehlerhafte Zeilen werden nicht importiert.</p></div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[12px] border border-[#d6e3eb]">
            <div className="border-b border-[#dce7ee] bg-[#f4f8fb] px-4 py-3 text-[12px] font-semibold text-[#35536a]">Importvorschau</div>
            <div className="admin-scrollbar overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-white text-[#6b8290]"><tr><th className="border-b border-[#e1ebf1] px-3 py-2">Zeile</th>{(catalog ? ["Code", "Leistung", "Punkte", "Stand"] : ["Quartal", "Kassenart", "PW KFO", "Quelle"]).map((header) => <th key={header} className="whitespace-nowrap border-b border-[#e1ebf1] px-3 py-2 font-semibold">{header}</th>)}</tr></thead>
                <tbody>{rows.slice(0, 8).map((row) => <PreviewRow key={row.row} kind={kind!} row={row} />)}</tbody>
              </table>
            </div>
          </div>

          {invalidRows.length > 0 && <div className="mt-4 rounded-[12px] border border-[#edc67d] bg-[#fff9eb] p-4" role="alert"><div className="mb-2 text-[12px] font-semibold text-[#79500e]">Bitte Quelldatei korrigieren</div><ul className="space-y-1 text-[11px] leading-5 text-[#75541c]">{invalidRows.slice(0, 12).map((row) => <li key={row.row}>Zeile {row.row}: {row.error}</li>)}</ul>{invalidRows.length > 12 && <p className="mt-2 text-[11px] text-[#75541c]">… und {invalidRows.length - 12} weitere Fehler.</p>}</div>}
        </>}
        {error && <div className="mt-4 rounded-[11px] border border-[#e9aaa5] bg-[#fff2f1] px-4 py-3 text-[12px] text-[#9c302b]" role="alert">{error}</div>}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-[#dce8ef] bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-[11px] leading-4 text-[#687f8e]">Vor Verwendung fachlich prüfen. Im Entwurf werden Punkte und Punktwert als Berechnungsstand gespeichert.</p>
        <div className="flex shrink-0 justify-end gap-2"><button type="button" className="admin-secondary-button" onClick={onClose}>Abbrechen</button><button type="button" className="admin-primary-button" disabled={!validRows.length || saving} onClick={runImport}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Wird importiert …" : `${validRows.length} Zeilen übernehmen`}</button></div>
      </div>
    </DialogContent>
  </Dialog>;
}

function PreviewRow({ kind, row }: { kind: ImportKind; row: ParsedRow }) {
  const value = row.value;
  const cells = kind === "catalog"
    ? value ? [(value as CatalogImportRow).code, (value as CatalogImportRow).name, formatNumber((value as CatalogImportRow).points), (value as CatalogImportRow).sourceVersion || "–"] : ["–", row.error, "–", "–"]
    : value ? [(value as PointValueImportRow).quarter, (value as PointValueImportRow).fundTypeLabel, formatNumber((value as PointValueImportRow).pwKfo), (value as PointValueImportRow).source] : ["–", row.error, "–", "–"];
  return <tr className={`border-b border-[#edf2f5] last:border-0 ${row.error ? "bg-[#fff9eb]" : ""}`}><td className="px-3 py-2.5 font-semibold text-[#607887]">{row.row}</td>{cells.map((cell, index) => <td key={index} className={`max-w-[260px] truncate whitespace-nowrap px-3 py-2.5 ${row.error && index === 1 ? "text-[#8a5511]" : "text-[#405e72]"}`}>{cell}</td>)}</tr>;
}

async function readTable(file: File): Promise<RawRow[]> {
  if (file.name.toLowerCase().endsWith(".csv")) return parseCsv(await file.text());
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const [firstSheet] = await readXlsxFile(file);
  if (!firstSheet?.data.length) throw new Error("Die Excel-Datei enthält kein lesbares Tabellenblatt.");
  return firstSheet.data.map((row) => row.map((value) => String(value ?? "")));
}

function parseRow(kind: ImportKind, headers: string[], row: RawRow, rowNumber: number): ParsedRow {
  const value = (key: string) => {
    const candidates = aliases[key].map(normalizeHeader);
    const index = headers.findIndex((header) => candidates.includes(normalizeHeader(header)));
    return index >= 0 ? String(row[index] ?? "").trim() : "";
  };
  if (kind === "catalog") {
    const code = value("code");
    const name = value("name");
    const points = parseGermanNumber(value("points"));
    const errors = [!code && "BEMA-Code fehlt", !name && "Leistungsbezeichnung fehlt", points === null && "Punktzahl fehlt oder ist ungültig", points !== null && points <= 0 && "Punktzahl muss größer als 0 sein"].filter(Boolean);
    return errors.length ? { row: rowNumber, value: null, error: errors.join("; ") } : { row: rowNumber, error: "", value: { code, name, points: points!, description: value("description"), category: value("category") || "Kieferorthopädie", unit: value("unit") || "Leistung", feeSystem: "BEMA", source: value("source"), sourceVersion: value("sourceVersion") } };
  }
  const quarter = normalizeQuarter(value("quarter"));
  const fundGroup = parseGermanNumber(value("fundGroup"));
  const fundType = value("fundType");
  const fundTypeLabel = value("fundTypeLabel");
  const pwKfo = parseGermanNumber(value("pwKfo"));
  const errors = [!quarter && "Quartal fehlt oder ist ungültig (z. B. 2026Q1)", fundGroup === null && "Vergütungsgruppe fehlt oder ist ungültig", !fundType && "Kassenart-Code fehlt", pwKfo === null && "KFO-Punktwert fehlt oder ist ungültig", pwKfo !== null && pwKfo <= 0 && "KFO-Punktwert muss größer als 0 sein"].filter(Boolean);
  return errors.length ? { row: rowNumber, value: null, error: errors.join("; ") } : { row: rowNumber, error: "", value: { quarter, fundGroup: fundGroup!, fundType, fundTypeLabel: fundTypeLabel || fundType, fundNumber: value("fundNumber"), pwKfo: pwKfo!, source: value("source"), sourceUrl: value("sourceUrl") } };
}

function normalizeHeader(value: string) { return value.trim().toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function normalizeQuarter(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  const yearFirst = normalized.match(/^(20\d{2})[-/.]?Q?([1-4])$/);
  const quarterFirst = normalized.match(/^Q?([1-4])[-/.]?(20\d{2})$/);
  return yearFirst ? `${yearFirst[1]}Q${yearFirst[2]}` : quarterFirst ? `${quarterFirst[2]}Q${quarterFirst[1]}` : "";
}
function parseGermanNumber(value: string) {
  const compact = value.trim().replace(/\s/g, "").replace(/[€]/g, "");
  if (!compact) return null;
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
function parseCsv(text: string): RawRow[] {
  const rows: RawRow[] = []; let row: string[] = []; let cell = ""; let quoted = false;
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = [";", ",", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && text[index + 1] === '"' && quoted) { cell += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index++; row.push(cell); if (row.some((entry) => entry.trim())) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell); if (row.some((entry) => entry.trim())) rows.push(row);
  return rows;
}
function formatNumber(value: number) { return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6 }).format(value); }

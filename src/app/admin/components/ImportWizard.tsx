import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileSpreadsheet,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { adminApi } from "../api";
import type { CustomerDraft, CustomerStatus } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void> | void;
};
type Row = string[];

const fields = [
  ["firstName", "Vorname *"],
  ["lastName", "Nachname *"],
  ["email", "E-Mail"],
  ["phone", "Telefon"],
  ["birthDate", "Geburtsdatum"],
  ["street", "Straße"],
  ["postalCode", "PLZ"],
  ["city", "Ort"],
  ["patientNumber", "Patientennummer"],
  ["appointmentDate", "Termin-Datum"],
  ["appointmentTime", "Termin-Uhrzeit"],
  ["status", "Status"],
  ["reminderConsent", "E-Mail-Erinnerungen / Einwilligung"],
] as const;

const aliases: Record<string, string[]> = {
  firstName: ["vorname", "first name", "firstname"],
  lastName: ["nachname", "name", "last name", "lastname"],
  email: ["e-mail", "email", "mail"],
  phone: ["telefon", "phone", "mobil", "handy"],
  birthDate: ["geburtsdatum", "geburtstag"],
  street: ["straße", "strasse", "anschrift"],
  postalCode: ["plz", "postleitzahl"],
  city: ["ort", "stadt"],
  patientNumber: ["patientennummer", "patienten-nr", "kundennummer"],
  appointmentDate: ["termin", "termin-datum", "termindatum"],
  appointmentTime: ["uhrzeit", "termin-uhrzeit"],
  status: ["status"],
  reminderConsent: [
    "e-mail-erinnerungen",
    "email-erinnerungen",
    "einwilligung",
    "erinnerungseinwilligung",
    "reminder consent",
    "consent",
  ],
};

export function ImportWizard({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidRows = useMemo(
    () =>
      rows
        .map((row, index) => ({
          row,
          number: index + 2,
          message: validateImportRow(row, headers, mapping),
        }))
        .filter((item) => item.message),
    [rows, headers, mapping],
  );

  useEffect(() => {
    if (open) {
      setStep(1);
      setFile(null);
      setHeaders([]);
      setRows([]);
      setMapping({});
      setError("");
      setResult(null);
    }
  }, [open]);
  async function choose(selected?: File) {
    if (!selected) return;
    if (!/\.(csv|xlsx)$/i.test(selected.name))
      return setError(
        "Bitte wählen Sie eine CSV- oder Excel-Datei (.xlsx). Das alte .xls-Format wird nicht unterstützt.",
      );
    if (selected.size > 10 * 1024 * 1024)
      return setError(
        "Die Datei ist größer als 10 MB. Bitte teilen Sie den Import auf.",
      );
    setError("");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setParsing(true);
    try {
      let parsed: Row[];
      if (selected.name.toLowerCase().endsWith(".csv"))
        parsed = parseCsv(await selected.text());
      else {
        const { default: readXlsxFile } = await import(
          "read-excel-file/browser"
        );
        const [firstSheet] = await readXlsxFile(selected, {
          dateFormat: "dd.mm.yyyy",
        });
        if (!firstSheet)
          throw new Error(
            "Die Excel-Datei enthält kein lesbares Tabellenblatt.",
          );
        parsed = firstSheet.data.map((row) =>
          row.map((value) =>
            value instanceof Date
              ? new Intl.DateTimeFormat("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(value)
              : String(value ?? ""),
          ),
        );
      }
      if (parsed.length < 2)
        throw new Error("Die Datei enthält keine Datenzeilen.");
      const fileHeaders = parsed[0].map((value) => value.trim());
      if (
        new Set(fileHeaders.map((value) => value.toLocaleLowerCase("de")))
          .size !== fileHeaders.length
      )
        throw new Error("Die Kopfzeile enthält doppelte Spaltennamen.");
      setFile(selected);
      setHeaders(fileHeaders);
      setRows(parsed.slice(1));
      setMapping(autoMap(fileHeaders));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Die Datei konnte nicht gelesen werden.",
      );
    } finally {
      setParsing(false);
    }
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function runImport() {
    if (!file) return;
    if (!mapping.firstName || !mapping.lastName)
      return setError("Bitte ordnen Sie Vorname und Nachname zu.");
    setLoading(true);
    setError("");
    try {
      const invalidIndexes = new Set(
        invalidRows.map((item) => item.number - 2),
      );
      const customers = rows
        .map((row, index) =>
          invalidIndexes.has(index) ? null : mapRow(row, headers, mapping),
        )
        .filter((item): item is CustomerDraft => Boolean(item));
      if (!customers.length)
        throw new Error("Es wurden keine gültigen Datenzeilen gefunden.");
      const response = await adminApi.importCustomers(customers);
      setResult({
        ...response,
        skipped: response.skipped + invalidRows.length,
        errors: [
          ...invalidRows.map((item) => ({
            row: item.number,
            message: item.message,
          })),
          ...response.errors,
        ],
      });
      setStep(3);
      await onComplete();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Der Import konnte nicht abgeschlossen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-root admin-scrollbar max-h-[92vh] max-w-[820px] overflow-y-auto rounded-[18px] border-[#bdd1de] bg-white p-0 shadow-[0_30px_80px_rgba(4,35,58,.24)]">
        <DialogHeader className="border-b border-[#deebf2] px-5 py-5 pr-14 text-left sm:px-7">
          <DialogTitle className="!text-[18px] !font-semibold !text-[#173249]">
            Kund:innen aus Liste importieren
          </DialogTitle>
          <DialogDescription className="mt-1 !text-[12px] !text-[#687f8e]">
            CSV oder Excel sicher prüfen und anschließend übernehmen
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5 sm:px-7">
          <StepIndicator step={step} />
          {step === 1 && (
            <div className="pt-5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
                className={`flex min-h-[245px] w-full flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-6 text-center outline-none transition ${dragging ? "border-[#f58a07] bg-[#fff8ee]" : "border-[#bcd0dd] bg-[#f8fbfd] hover:border-[#7399b1] hover:bg-[#f3f9fc]"}`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e2f0f8] text-[#063255]">
                  <UploadCloud className="h-7 w-7" />
                </span>
                <span className="mt-4 text-[15px] font-semibold text-[#244158]">
                  Datei hier ablegen
                </span>
                <span className="mt-1 text-[12px] text-[#708593]">
                  oder klicken, um eine Datei auszuwählen
                </span>
                <span className="mt-4 rounded-[8px] border border-[#d6e4ed] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5b7384]">
                  CSV · XLSX
                </span>
              </button>
              <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  choose(e.target.files?.[0])
                }
              />
              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[#cfe0ea] bg-white px-4 py-3">
                  <FileSpreadsheet className="h-5 w-5 text-[#357356]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-[#29465c]">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-[#718793]">
                      {formatBytes(file.size)} · bereit zur Prüfung
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setError("");
                    }}
                    className="admin-icon-button h-8 w-8"
                    aria-label="Datei entfernen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="mt-4 rounded-[12px] bg-[#eef7fc] px-4 py-3">
                <p className="!text-[11px] !font-normal !leading-5 !text-[#48677a]">
                  <strong className="font-semibold">
                    Mindestens erforderlich:
                  </strong>{" "}
                  Vorname und Nachname. Gängige deutsche Spaltennamen werden
                  automatisch erkannt. Bestehende Einträge werden nicht
                  ungefragt überschrieben.
                </p>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="pt-5">
              <>
                <div className="mb-4">
                  <h3 className="!text-[15px] !font-semibold !text-[#29475d]">
                    Spalten zuordnen
                  </h3>
                  <p className="mt-1 !text-[11px] !font-normal !text-[#6d8290]">
                    Prüfen Sie, welche Dateispalte zu welchem Feld gehört.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map(([key, label]) => (
                    <label key={key}>
                      <span className="admin-label">{label}</span>
                      <select
                        className="admin-field w-full"
                        value={mapping[key] ?? ""}
                        onChange={(e) =>
                          setMapping((current) => ({
                            ...current,
                            [key]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Nicht importieren</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                {invalidRows.length > 0 &&
                  mapping.firstName &&
                  mapping.lastName && (
                    <div className="mt-4 flex items-start gap-2 rounded-[11px] border border-[#edc67d] bg-[#fff9eb] px-4 py-3 text-[11px] leading-5 text-[#75511a]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong className="font-semibold">
                          {invalidRows.length} Zeile
                          {invalidRows.length === 1 ? "" : "n"} unvollständig:
                        </strong>{" "}
                        Vor- oder Nachname fehlt. Diese Zeilen werden
                        übersprungen und im Ergebnis aufgeführt.
                      </span>
                    </div>
                  )}
                <div className="mt-6 overflow-hidden rounded-[13px] border border-[#d3e2eb]">
                  <div className="flex items-center justify-between bg-[#f1f7fa] px-4 py-3 text-[12px] font-semibold text-[#36556b]">
                    <span>Vorschau der ersten Zeilen</span>
                    <span className="text-[10px] font-medium text-[#758b99]">
                      {rows.length} Datenzeilen
                    </span>
                  </div>
                  <div className="admin-scrollbar overflow-x-auto">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="bg-white text-[#6b8290]">
                        <tr>
                          {headers.map((header) => (
                            <th
                              key={header}
                              className="whitespace-nowrap border-b border-[#e1ebf1] px-3 py-2 font-semibold"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 4).map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-[#edf2f5] last:border-0"
                          >
                            {headers.map((_, cell) => (
                              <td
                                key={cell}
                                className="max-w-[180px] truncate whitespace-nowrap px-3 py-2.5 text-[#405e72]"
                              >
                                {row[cell] || "–"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            </div>
          )}
          {step === 3 && result && (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#e2f5ea] text-[#267153]">
                <Check className="h-8 w-8" />
              </span>
              <h3 className="mt-5 !text-[20px] !font-semibold !text-[#234158]">
                Import abgeschlossen
              </h3>
              <p className="mt-2 !text-[13px] !font-normal !text-[#657c8b]">
                {result.imported} Kund:innen wurden übernommen
                {result.skipped ? `, ${result.skipped} übersprungen` : ""}.
              </p>
              {result.errors.length > 0 && (
                <div className="mx-auto mt-5 max-w-lg rounded-[12px] border border-[#edc67d] bg-[#fff9eb] px-4 py-3 text-left">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#79500e]">
                    <AlertTriangle className="h-4 w-4" />
                    {result.errors.length} Hinweise
                  </div>
                  {result.errors.slice(0, 4).map((item) => (
                    <div
                      key={item.row}
                      className="text-[11px] leading-5 text-[#75541c]"
                    >
                      Zeile {item.row}: {item.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && (
            <div
              className="mt-4 rounded-[11px] border border-[#e9aaa5] bg-[#fff2f1] px-4 py-3 text-[12px] font-medium text-[#9c302b]"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#deebf2] bg-[#fbfdfe] px-5 py-4 sm:px-7">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="admin-secondary-button h-10"
            >
              Abbrechen
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="admin-secondary-button h-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          ) : (
            <span />
          )}
          {step === 1 && (
            <button
              type="button"
              disabled={!file || parsing}
              onClick={() => setStep(2)}
              className="admin-primary-button h-10"
            >
              {parsing ? "Datei wird gelesen …" : "Datei prüfen"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              disabled={loading}
              onClick={runImport}
              className="admin-primary-button h-10"
            >
              {loading ? (
                <span className="admin-spinner h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {loading ? "Wird importiert …" : "Import bestätigen"}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="admin-primary-button h-10"
            >
              Fertig
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Importschritte">
      {["Datei wählen", "Prüfen", "Ergebnis"].map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;
        return (
          <li
            key={label}
            className={`border-b-2 pb-3 ${active ? "border-[#f58a07]" : done ? "border-[#4a9471]" : "border-[#dbe6ed]"}`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-[.06em] ${active ? "text-[#945605]" : done ? "text-[#347154]" : "text-[#8396a2]"}`}
            >
              {String(number).padStart(2, "0")}
            </div>
            <div
              className={`mt-1 text-[11px] font-medium ${active ? "text-[#223f56]" : "text-[#788c99]"}`}
            >
              {label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter =
    text.slice(0, text.indexOf("\n")).split(";").length >
    text.slice(0, text.indexOf("\n")).split(",").length
      ? ";"
      : ",";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i + 1] === '"' && quoted) {
      cell += '"';
      i++;
    } else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
function autoMap(headers: string[]) {
  const result: Record<string, string> = {};
  for (const [key, names] of Object.entries(aliases)) {
    const found = headers.find((header) =>
      names.includes(header.trim().toLocaleLowerCase("de")),
    );
    if (found) result[key] = found;
  }
  return result;
}
function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function mappedValue(
  row: Row,
  headers: string[],
  mapping: Record<string, string>,
  key: string,
) {
  const index = headers.indexOf(mapping[key]);
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}
function validateImportRow(
  row: Row,
  headers: string[],
  mapping: Record<string, string>,
) {
  if (
    !mappedValue(row, headers, mapping, "firstName") ||
    !mappedValue(row, headers, mapping, "lastName")
  )
    return "Vor- oder Nachname fehlt; Zeile wurde nicht importiert.";
  const email = mappedValue(row, headers, mapping, "email");
  if (email && !/^\S+@\S+\.\S+$/.test(email))
    return "Die E-Mail-Adresse ist ungültig.";
  const birthDate = mappedValue(row, headers, mapping, "birthDate");
  if (birthDate && !normalizeDate(birthDate))
    return "Das Geburtsdatum ist ungültig.";
  const appointmentDate = mappedValue(row, headers, mapping, "appointmentDate");
  const appointmentTime = mappedValue(row, headers, mapping, "appointmentTime");
  if (appointmentDate && !normalizeDate(appointmentDate))
    return "Das Termin-Datum ist ungültig.";
  if (appointmentDate && !normalizeTime(appointmentTime))
    return "Zu einem Termin-Datum ist eine gültige Uhrzeit erforderlich.";
  if (!appointmentDate && appointmentTime)
    return "Eine Termin-Uhrzeit ohne Termin-Datum kann nicht importiert werden.";
  return "";
}
function mapRow(
  row: Row,
  headers: string[],
  mapping: Record<string, string>,
): CustomerDraft | null {
  const value = (key: string) => {
    const header = mapping[key];
    const index = headers.indexOf(header);
    return index >= 0 ? String(row[index] ?? "").trim() : "";
  };
  const firstName = value("firstName");
  const lastName = value("lastName");
  if (!firstName || !lastName) return null;
  const statusValue = value("status").toLocaleLowerCase("de");
  const status: CustomerStatus = statusValue.includes("paus")
    ? "paused"
    : statusValue.includes("beend") || statusValue.includes("abgesch")
      ? "completed"
      : statusValue.includes("archiv")
        ? "archived"
        : "active";
  const appointmentDate = normalizeDate(value("appointmentDate"));
  return {
    firstName,
    lastName,
    email: value("email"),
    phone: value("phone"),
    birthDate: normalizeDate(value("birthDate")),
    street: value("street"),
    postalCode: value("postalCode"),
    city: value("city"),
    patientNumber: value("patientNumber"),
    status,
    reminderConsent: /^(ja|yes|1|x)$/i.test(value("reminderConsent")),
    salutation: "",
    mobile: "",
    insurer: "",
    insuranceType: "gesetzlich",
    notes: "",
    appointments: appointmentDate
      ? [
          {
            date: appointmentDate,
            time: normalizeTime(value("appointmentTime")),
            type: "Termin",
            note: "",
          },
        ]
      : [],
  };
}
function normalizeDate(value: string) {
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const german = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  const result = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : german
      ? `${german[3]}-${german[2].padStart(2, "0")}-${german[1].padStart(2, "0")}`
      : "";
  if (!result) return "";
  const parsed = new Date(`${result}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === result
    ? result
    : "";
}
function normalizeTime(value: string) {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

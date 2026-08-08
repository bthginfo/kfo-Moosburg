import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  FilterX,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type {
  AppointmentType,
  ScheduleAppointment,
  ScheduleAppointmentSource,
  ScheduleAppointmentStatus,
  ScheduleBundle,
} from "../types";

const statusLabels: Record<ScheduleAppointmentStatus, string> = {
  scheduled: "Geplant", confirmed: "Bestätigt", arrived: "Eingetroffen", completed: "Abgeschlossen",
  cancelled: "Abgesagt", no_show: "Nicht erschienen",
};
const sourceLabels: Record<ScheduleAppointmentSource, string> = { admin: "Admin", import: "Import", online: "Online", ivoris: "ivoris" };

type Props = {
  bundle: ScheduleBundle;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onNew: () => void;
  onEdit: (item: ScheduleAppointment) => void;
  onDelete: (item: ScheduleAppointment) => void;
};

export function SchedulePlanner({ bundle, selectedDate, setSelectedDate, onNew, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const weekDates = useMemo(() => {
    const start = startOfMondayWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [selectedDate]);
  const activeFilterCount = Number(Boolean(search)) + Number(status !== "all") + Number(typeId !== "all");
  const dayItems = bundle.appointments
    .filter((item) => item.date === selectedDate)
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => typeId === "all" || item.appointmentTypeId === typeId)
    .filter((item) => `${item.customerName} ${item.type} ${item.providerName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.time.localeCompare(b.time));
  const allDayCount = bundle.appointments.filter((item) => item.date === selectedDate).length;

  function clearFilters() { setSearch(""); setStatus("all"); setTypeId("all"); }
  const filterFields = (
    <div className="space-y-2.5">
      <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#738895]" /><input className="admin-field admin-field-leading w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name oder Terminart" aria-label="Termine durchsuchen" /></div>
      <select className="admin-field w-full" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Nach Terminstatus filtern"><option value="all">Alle Status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select className="admin-field w-full" value={typeId} onChange={(event) => setTypeId(event.target.value)} aria-label="Nach Terminart filtern"><option value="all">Alle Terminarten</option>{bundle.appointmentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {activeFilterCount > 0 && <button onClick={clearFilters} className="admin-quiet-button h-10 w-full text-[12px]"><FilterX className="h-4 w-4" />Filter löschen</button>}
    </div>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
      <section className="admin-surface overflow-hidden xl:hidden" aria-label="Datum und mobile Filter">
        <div className="flex items-center gap-2 border-b border-[#deebf2] px-3 py-3">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="admin-icon-button" aria-label="Vorheriger Tag" title="Vorheriger Tag"><ChevronLeft className="h-4 w-4" /></button>
          <label className="min-w-0 flex-1"><span className="sr-only">Ausgewähltes Datum</span><input type="date" className="admin-field w-full text-center font-semibold" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="admin-icon-button" aria-label="Nächster Tag" title="Nächster Tag"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="admin-scrollbar flex gap-1.5 overflow-x-auto px-3 py-3">
          {weekDates.map((date) => {
            const active = date === selectedDate;
            const count = bundle.appointments.filter((item) => item.date === date).length;
            return <button key={date} onClick={() => setSelectedDate(date)} aria-pressed={active} className={`flex min-w-[64px] flex-col items-center rounded-[10px] px-2 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07] ${active ? "bg-[#063255] text-white" : "bg-[#f3f8fb] text-[#45657a]"}`}><span className={`text-[11px] font-semibold ${active ? "text-[#b9d0dd]" : "text-[#718895]"}`}>{shortWeekday(date)}</span><span className="mt-0.5 text-[15px] font-semibold">{dayNumber(date)}</span><span className={`mt-0.5 text-[11px] ${active ? "text-[#ffc376]" : "text-[#7a8e9a]"}`}>{count} Term.</span></button>;
          })}
        </div>
        <div className="border-t border-[#e1ebf1] px-3 py-3">
          <button type="button" onClick={() => setMobileFiltersOpen((value) => !value)} aria-expanded={mobileFiltersOpen} aria-controls="mobile-schedule-filters" className={`admin-secondary-button h-11 w-full ${mobileFiltersOpen ? "border-[#7197ae] bg-[#eef7fc]" : ""}`}><Filter className="h-4 w-4" />Filter {activeFilterCount > 0 && <span className="rounded-[7px] bg-[#063255] px-2 py-0.5 text-[11px] text-white">{activeFilterCount}</span>}<span className="ml-auto text-[11px] text-[#718895]">{mobileFiltersOpen ? "Schließen" : "Öffnen"}</span></button>
          {mobileFiltersOpen && <div id="mobile-schedule-filters" className="admin-enter relative mt-3 rounded-[11px] bg-[#f7fafc] p-3"><button type="button" onClick={() => setMobileFiltersOpen(false)} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6d8290] hover:bg-[#e5eff5]" aria-label="Filter schließen" title="Filter schließen"><X className="h-4 w-4" /></button><div className="mb-3 pr-10 text-[12px] font-semibold text-[#35556b]">Termine filtern</div>{filterFields}</div>}
        </div>
      </section>

      <aside className="hidden space-y-4 xl:block">
        <section className="admin-surface p-4">
          <div className="mb-3 flex items-center justify-between"><div><div className="admin-kicker">Tagesauswahl</div><div className="mt-1 text-[13px] font-semibold text-[#29475d]">{monthYear(selectedDate)}</div></div><button onClick={() => setSelectedDate(todayBerlin())} className="admin-quiet-button h-10 text-[12px]">Heute</button></div>
          <input type="date" className="admin-field mb-3 w-full" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <div className="space-y-1.5">{weekDates.map((date) => { const count = bundle.appointments.filter((item) => item.date === date).length; const active = date === selectedDate; return <button key={date} onClick={() => setSelectedDate(date)} className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left transition ${active ? "bg-[#063255] text-white" : "hover:bg-[#eef6fa]"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-[12px] font-semibold ${active ? "bg-white/12 text-[#ffc376]" : "bg-[#e8f3f9] text-[#255c7d]"}`}>{dayNumber(date)}</span><span className="min-w-0 flex-1"><span className={`block text-[12px] font-semibold ${active ? "text-white" : "text-[#35556b]"}`}>{shortWeekday(date)}</span><span className={`block text-[11px] ${active ? "text-[#a9c3d2]" : "text-[#7a8e9a]"}`}>{shortDate(date)}</span></span><span className={`text-[11px] font-semibold ${active ? "text-white" : "text-[#668091]"}`}>{count}</span></button>; })}</div>
          <div className="mt-3 flex items-center gap-2 border-t border-[#e3edf3] pt-3"><button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="admin-icon-button" aria-label="Vorheriger Tag" title="Vorheriger Tag"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="admin-secondary-button h-10 flex-1 text-[12px]">Nächster Tag<ChevronRight className="h-4 w-4" /></button></div>
        </section>
        <section className="admin-surface p-4"><div className="admin-kicker mb-3">Filtern</div>{filterFields}</section>
      </aside>

      <section className="admin-surface overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-[#deebf2] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div><div className="flex items-center gap-2"><h2 className="!text-[17px] !font-semibold !text-[#203e55]">{longDate(selectedDate)}</h2>{selectedDate === todayBerlin() && <span className="rounded-[7px] bg-[#fff0dc] px-2 py-1 text-[11px] font-semibold text-[#995906]">Heute</span>}</div><p className="mt-1 !text-[12px] !font-normal !text-[#728895]">{allDayCount} Termin{allDayCount === 1 ? "" : "e"} · {dayItems.length} sichtbar</p></div>
          <button onClick={onNew} className="admin-secondary-button h-11"><Plus className="h-4 w-4" />Termin an diesem Tag</button>
        </div>
        {dayItems.length ? <div className="divide-y divide-[#e4edf3]">{dayItems.map((appointment) => <ResponsiveAppointmentRow key={appointment.id} appointment={appointment} appointmentType={bundle.appointmentTypes.find((item) => item.id === appointment.appointmentTypeId)} onEdit={() => onEdit(appointment)} onDelete={() => onDelete(appointment)} />)}</div> : <EmptyAgenda filtered={activeFilterCount > 0} onNew={onNew} />}
      </section>
    </div>
  );
}

function ResponsiveAppointmentRow({ appointment, appointmentType, onEdit, onDelete }: { appointment: ScheduleAppointment; appointmentType?: AppointmentType; onEdit: () => void; onDelete: () => void }) {
  return <article className={`relative grid gap-3 px-4 py-4 transition hover:bg-[#f8fbfd] sm:px-6 xl:grid-cols-[82px_minmax(210px,1.25fr)_minmax(170px,.85fr)_minmax(150px,.75fr)_auto] xl:items-center ${appointment.status === "cancelled" ? "opacity-60" : ""}`}><span className="absolute inset-y-3 left-0 w-[3px] rounded-r" style={{ backgroundColor: appointmentType?.color || "#467a96" }} /><div><div className="text-[17px] font-semibold tracking-[-.02em] text-[#16384f]">{appointment.time}</div><div className="text-[11px] text-[#778c99]">{appointment.durationMinutes} Min.</div></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><button onClick={onEdit} className="truncate text-left text-[13px] font-semibold text-[#203f57] hover:text-[#e47d00]">{appointment.customerName}</button><SourceBadge source={appointment.source} /></div><div className="mt-1 flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: appointmentType?.color || "#467a96" }} /><span className="truncate text-[12px] font-medium text-[#49677a]">{appointmentType?.name || appointment.type}</span></div></div><div className="min-w-0 space-y-1"><div className="flex items-center gap-1.5 truncate text-[12px] text-[#405f73]"><UserRound className="h-3.5 w-3.5 shrink-0 text-[#78909e]" />{appointment.providerName || "Nicht zugeordnet"}</div><div className="flex items-center gap-1.5 truncate text-[11px] text-[#718794]"><MapPin className="h-3.5 w-3.5 shrink-0" />{appointment.roomName || "Kein Raum"}</div></div><div><AppointmentStatusBadge status={appointment.status} />{appointment.syncStatus && <div className={`mt-1.5 text-[11px] ${appointment.syncStatus === "error" ? "text-[#a43f38]" : "text-[#7a8e9a]"}`}>{syncLabel(appointment.syncStatus)}</div>}</div><div className="flex gap-2 xl:justify-end"><button onClick={onEdit} className="admin-icon-button" aria-label={`Termin von ${appointment.customerName} bearbeiten`} title="Termin bearbeiten"><Edit3 className="h-4 w-4" /></button><button onClick={onDelete} className="admin-icon-button text-[#9a453f]" aria-label={`Termin von ${appointment.customerName} löschen`} title="Termin löschen"><Trash2 className="h-4 w-4" /></button></div></article>;
}

function SourceBadge({ source }: { source: ScheduleAppointmentSource }) { const styles = { admin: "bg-[#e7f1f7] text-[#315f7b]", import: "bg-[#eee9f7] text-[#654d8c]", online: "bg-[#fff0dc] text-[#945707]", ivoris: "bg-[#e5f5ec] text-[#2d7053]" }; return <span className={`rounded-[7px] px-2 py-1 text-[11px] font-semibold ${styles[source]}`}>{sourceLabels[source]}</span>; }
function AppointmentStatusBadge({ status }: { status: ScheduleAppointmentStatus }) { const styles: Record<ScheduleAppointmentStatus, string> = { scheduled: "bg-[#e7f1f7] text-[#315f7b]", confirmed: "bg-[#e5f5ec] text-[#287052]", arrived: "bg-[#fff0dc] text-[#945707]", completed: "bg-[#edf1f3] text-[#5f707b]", cancelled: "bg-[#fff0ef] text-[#9b403a]", no_show: "bg-[#f4e9e8] text-[#8e3934]" }; return <span className={`inline-flex rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold ${styles[status]}`}>{statusLabels[status]}</span>; }
function EmptyAgenda({ filtered, onNew }: { filtered: boolean; onNew: () => void }) { return <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e6f2f9] text-[#174e72]"><CalendarCheck2 className="h-7 w-7" /></span><h3 className="mt-4 !text-[15px] !font-semibold !text-[#29475d]">{filtered ? "Keine passenden Termine" : "An diesem Tag ist noch nichts geplant"}</h3><p className="mt-2 max-w-sm !text-[12px] !font-normal !leading-5 !text-[#718692]">{filtered ? "Öffnen Sie die Filter und passen Sie die Auswahl an." : "Legen Sie einen Patiententermin an. Konflikte werden automatisch geprüft."}</p>{!filtered && <button onClick={onNew} className="admin-primary-button mt-5 h-11"><Plus className="h-4 w-4" />Termin anlegen</button>}</div>; }
function todayBerlin() { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date()); }
function dateFromIso(value: string) { return new Date(`${value}T12:00:00`); }
function addDays(value: string, days: number) { const date = dateFromIso(value); date.setDate(date.getDate() + days); return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(date); }
function startOfMondayWeek(value: string) { const date = dateFromIso(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(date); }
function dayNumber(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit" }).format(dateFromIso(value)); }
function shortWeekday(value: string) { return new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(dateFromIso(value)); }
function shortDate(value: string) { return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(dateFromIso(value)); }
function longDate(value: string) { return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(dateFromIso(value)); }
function monthYear(value: string) { return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(dateFromIso(value)); }
function syncLabel(value: ScheduleAppointment["syncStatus"]) { return value === "synced" ? "Mit ivoris abgeglichen" : value === "pending" ? "Abgleich ausstehend" : value === "error" ? "Synchronisationsfehler" : "Lokal gespeichert"; }

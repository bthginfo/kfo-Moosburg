import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BellRing,
  CalendarDays,
  CalendarClock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { BrandMark } from "./AdminLogin";
import { adminApi } from "./api";
import { toast } from "sonner";
import { useAccessibleModal } from "../lib/useAccessibleModal";

const navigation = [
  { to: "/verwaltung", label: "Übersicht", mobileLabel: "Übersicht", icon: LayoutDashboard, exact: true },
  { to: "/verwaltung/termine", label: "Termine", mobileLabel: "Termine", icon: CalendarDays },
  { to: "/verwaltung/kunden", label: "Kund:innen", mobileLabel: "Kund:innen", icon: UsersRound },
  { to: "/verwaltung/kostenvoranschlaege", label: "Kostenvoranschläge", mobileLabel: "KV", icon: FileText },
  { to: "/verwaltung/erinnerungen", label: "Erinnerungen", mobileLabel: "Erinner.", icon: BellRing },
  { to: "/verwaltung/einstellungen", label: "Einstellungen", mobileLabel: "Einstell.", icon: Settings },
];

type Props = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  onLoggedOut: () => void;
};

export function AdminShell({ children, title, eyebrow, description, action, onLoggedOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => closeMenu(), [closeMenu, location.pathname]);
  useAccessibleModal({
    open: menuOpen,
    containerRef: menuDialogRef,
    initialFocusRef: menuCloseRef,
    returnFocusRef: menuButtonRef,
    onClose: closeMenu,
  });

  async function logout() {
    setLoggingOut(true);
    try {
      await adminApi.logout();
      onLoggedOut();
      navigate("/verwaltung", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Abmelden fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setLoggingOut(false);
    }
  }

  const navItems = (
    <nav className="mt-8 space-y-1.5" aria-label="Verwaltungsnavigation">
      {navigation.map((item) => {
        const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-[11px] px-3 text-[14px] font-medium transition ${
              active ? "bg-white text-[#063255] shadow-[0_5px_16px_rgba(0,20,40,0.15)]" : "text-[#cfe0eb] hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon className={`h-[19px] w-[19px] ${active ? "text-[#f58a07]" : "text-[#9ebaca] group-hover:text-white"}`} />
            <span>{item.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f58a07]" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-root min-h-screen bg-[#edf7ff] text-[#173249]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col bg-[#063255] px-4 py-5 lg:flex">
        <div className="px-2 py-1"><BrandMark light /></div>
        {navItems}
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-3 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#e2f1fa] text-[12px] font-bold text-[#063255]">KM</span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-white">Praxisteam</div>
              <div className="truncate text-[11px] text-[#96b4c7]">KFO Moosburg</div>
            </div>
          </div>
          <button onClick={logout} disabled={loggingOut} className="flex min-h-10 w-full items-center gap-3 rounded-[11px] px-3 text-[13px] font-medium text-[#b8cfdd] transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]">
            {loggingOut ? <span className="admin-spinner h-4 w-4" /> : <LogOut className="h-[17px] w-[17px]" />}
            Abmelden
          </button>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#d2e1eb] bg-[#edf7ff]/95 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
          <BrandMark />
          <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen(true)} className="admin-icon-button" aria-label="Menü öffnen" aria-expanded={menuOpen} aria-controls="admin-mobile-navigation"><Menu className="h-5 w-5" /></button>
        </header>

        <div className="mx-auto max-w-[1510px] px-4 pb-24 pt-6 sm:px-7 sm:pt-8 lg:px-9 lg:pb-12 lg:pt-9 xl:px-12">
          <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              {eyebrow && <div className="admin-kicker mb-2">{eyebrow}</div>}
              <h1 className="!text-[26px] !font-semibold !leading-[1.2] !tracking-[-0.025em] !text-[#102d44] sm:!text-[29px]">{title}</h1>
              {description && <p className="mt-2 max-w-2xl !text-[13px] !font-normal !leading-5 !text-[#607787] sm:!text-[14px]">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
          {children}
        </div>
      </div>

      {menuOpen && (
        <div ref={menuDialogRef} id="admin-mobile-navigation" className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Verwaltungsnavigation" tabIndex={-1}>
          <div className="absolute inset-0 bg-[#031d31]/55" aria-hidden="true" onMouseDown={closeMenu} />
          <aside className="admin-enter absolute inset-y-0 right-0 flex w-[min(88vw,350px)] flex-col bg-[#063255] px-5 py-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <BrandMark light />
              <button ref={menuCloseRef} type="button" onClick={closeMenu} className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]" aria-label="Menü schließen"><X className="h-5 w-5" /></button>
            </div>
            {navItems}
            <div className="mt-auto border-t border-white/10 pt-5">
              <button type="button" onClick={logout} disabled={loggingOut} className="flex min-h-11 w-full items-center gap-3 rounded-[11px] px-3 text-[14px] text-[#cfe0eb] hover:bg-white/8 hover:text-white disabled:opacity-60">{loggingOut ? <span className="admin-spinner h-4 w-4" /> : <LogOut className="h-[18px] w-[18px]" />}Abmelden</button>
            </div>
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-3 bottom-3 z-30 grid h-[70px] grid-cols-5 rounded-[17px] border border-[#c9d9e4] bg-white px-1.5 shadow-[0_12px_35px_rgba(6,50,85,.18)] lg:hidden" aria-label="Schnellnavigation">
        {navigation.filter((item) => item.to !== "/verwaltung/einstellungen").map((item) => {
          const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return <Link key={item.to} to={item.to} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[13px] text-[11px] font-medium ${active ? "text-[#063255]" : "text-[#6e8290]"}`}><Icon className={`h-5 w-5 ${active ? "text-[#f58a07]" : ""}`} /><span className="max-w-full truncate">{item.mobileLabel}</span></Link>;
        })}
      </nav>
    </div>
  );
}

export function InlineLink({ children, to }: { children: ReactNode; to: string }) {
  return <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#063255] hover:text-[#f58a07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]">{children}<ChevronRight className="h-4 w-4" /></Link>;
}

export function SetupState({ title = "Verwaltung noch nicht eingerichtet", message }: { title?: string; message?: string }) {
  return (
    <div className="admin-surface flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e8f3fa] text-[#063255]"><CalendarClock className="h-7 w-7" /></span>
      <h2 className="!text-[18px] !font-semibold !text-[#173249]">{title}</h2>
      <p className="mt-2 max-w-lg !text-[13px] !font-normal !leading-6 !text-[#607787]">{message ?? "Die sichere Datenverbindung ist noch nicht verfügbar. Sobald die Server-Konfiguration abgeschlossen ist, erscheinen die Praxisdaten automatisch hier."}</p>
      <div className="mt-5 rounded-[10px] bg-[#f3f8fb] px-4 py-2.5 text-xs text-[#547084]">Es werden keine Patientendaten lokal im Browser gespeichert.</div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { adminApi, AdminApiError } from "./api";
import { AdminLogin, BrandMark } from "./AdminLogin";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { RemindersPage } from "./pages/RemindersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { EstimatesPage } from "./pages/EstimatesPage";
import type { Customer, CustomerDraft, ReminderDelivery, ReminderDraft, ReminderRule, SmtpSettings } from "./types";
import "./admin.css";

type LoadState = "checking" | "signed-out" | "loading" | "ready" | "setup" | "error";

export function AdminApp() {
  const [state, setState] = useState<LoadState>("checking");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reminders, setReminders] = useState<ReminderRule[]>([]);
  const [deliveries, setDeliveries] = useState<ReminderDelivery[]>([]);
  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Verwaltung | KFO Moosburg";
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex, nofollow, noarchive";
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
    document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.remove();
  }, []);

  const loadData = useCallback(async () => {
    setState("loading");
    setLoadError("");
    try {
      const [customerResponse, reminderResponse, smtpSettings] = await Promise.all([adminApi.customers(), adminApi.reminders(), adminApi.settings()]);
      setCustomers(customerResponse.customers ?? []);
      setReminders(reminderResponse.reminders ?? []);
      setDeliveries(reminderResponse.recentDeliveries ?? []);
      setSettings(smtpSettings);
      setState("ready");
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) return setState("signed-out");
      if (error instanceof AdminApiError && (error.status === 503 || error.code === "setup_required")) return setState("setup");
      setLoadError(error instanceof Error ? error.message : "Praxisdaten konnten nicht geladen werden.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    adminApi.session().then((session) => {
      if (!mounted) return;
      if (session.setupRequired) setState("setup");
      else if (session.authenticated) loadData();
      else setState("signed-out");
    }).catch((error) => {
      if (!mounted) return;
      if (error instanceof AdminApiError && (error.status === 503 || error.code === "setup_required")) setState("setup");
      else { setLoadError(error instanceof Error ? error.message : "Die Verwaltung ist vorübergehend nicht erreichbar."); setState("error"); }
    });
    return () => { mounted = false; };
  }, [loadData]);

  useEffect(() => {
    const sessionExpired = () => {
      setCustomers([]);
      setReminders([]);
      setDeliveries([]);
      setSettings(null);
      setState("signed-out");
      toast.error("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
    };
    window.addEventListener("kfo:admin-session-expired", sessionExpired);
    return () => window.removeEventListener("kfo:admin-session-expired", sessionExpired);
  }, []);

  async function saveCustomer(draft: CustomerDraft) {
    const response = await adminApi.saveCustomer(draft);
    setCustomers((current) => draft.id ? current.map((item) => item.id === response.customer.id ? response.customer : item) : [response.customer, ...current]);
    toast.success(draft.id ? "Änderungen wurden gespeichert." : "Kund:in wurde angelegt.");
  }

  async function saveReminder(draft: ReminderDraft) {
    const response = await adminApi.saveReminder(draft);
    setReminders((current) => draft.id ? current.map((item) => item.id === response.reminder.id ? response.reminder : item) : [response.reminder, ...current]);
    toast.success(draft.id ? "Erinnerung wurde aktualisiert." : "Erinnerung wurde angelegt.");
  }

  async function saveSettings(next: SmtpSettings & { password?: string }) {
    const response = await adminApi.saveSettings(next);
    setSettings(response);
    toast.success("E-Mail-Einstellungen wurden sicher gespeichert.");
  }

  if (state === "checking" || state === "loading") return <LoadingScreen label={state === "checking" ? "Sichere Anmeldung wird geprüft …" : "Praxisdaten werden geladen …"} />;
  if (state === "signed-out") return <><AdminLogin onAuthenticated={loadData} /><AdminToaster /></>;
  if (state === "setup") {
    return <><AdminLogin onAuthenticated={loadData} setupUnavailable /><AdminToaster /></>;
  }
  if (state === "error") return <><ErrorScreen message={loadError} onRetry={() => window.location.reload()} /><AdminToaster /></>;

  const logout = () => { setCustomers([]); setReminders([]); setDeliveries([]); setSettings(null); setState("signed-out"); };
  let page: React.ReactNode;
  if (location.pathname === "/verwaltung" || location.pathname === "/verwaltung/") page = <DashboardPage customers={customers} reminders={reminders} deliveries={deliveries} smtpConfigured={Boolean(settings?.configured)} onLoggedOut={logout} onAddCustomer={() => navigate("/verwaltung/kunden?neu=1")} />;
  else if (location.pathname.startsWith("/verwaltung/kunden")) page = <CustomersPage customers={customers} onLoggedOut={logout} onSave={saveCustomer} onRefresh={loadData} />;
  else if (location.pathname.startsWith("/verwaltung/termine")) page = <SchedulePage customers={customers} onLoggedOut={logout} />;
  else if (location.pathname.startsWith("/verwaltung/kostenvoranschlaege")) page = <EstimatesPage customers={customers} onLoggedOut={logout} />;
  else if (location.pathname.startsWith("/verwaltung/erinnerungen")) page = <RemindersPage reminders={reminders} customers={customers} onLoggedOut={logout} onSave={saveReminder} />;
  else if (location.pathname.startsWith("/verwaltung/einstellungen")) page = <SettingsPage settings={settings} onLoggedOut={logout} onSave={saveSettings} onTest={adminApi.testConnection} />;
  else page = <Navigate to="/verwaltung" replace />;
  return <>{page}<AdminToaster /></>;
}

function LoadingScreen({ label }: { label: string }) {
  return <main className="admin-root flex min-h-screen flex-col items-center justify-center bg-[#edf7ff] px-6 text-center"><BrandMark /><LoaderCircle className="mt-10 h-7 w-7 animate-spin text-[#f58a07]" /><p className="mt-4 !text-[12px] !font-medium !text-[#60798a]">{label}</p></main>;
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className="admin-root flex min-h-screen flex-col items-center justify-center bg-[#edf7ff] px-6 text-center"><BrandMark /><h1 className="mt-10 !text-[20px] !font-semibold !text-[#173249]">Praxisdaten nicht erreichbar</h1><p className="mt-3 max-w-lg !text-[13px] !leading-6 !text-[#60798a]">{message || "Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut."}</p><button onClick={onRetry} className="admin-primary-button mt-6 h-11">Erneut versuchen</button></main>;
}

function AdminToaster() {
  return <Toaster position="top-right" richColors closeButton toastOptions={{ className: "admin-root !rounded-[12px] !border-[#c8dbe7] !text-[12px]" }} />;
}

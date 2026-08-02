import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { adminApi, AdminApiError } from "./api";

type Props = {
  onAuthenticated: () => void;
  setupUnavailable?: boolean;
};

export function AdminLogin({ onAuthenticated, setupUnavailable }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setError("Bitte geben Sie Ihr Passwort ein.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await adminApi.login(password);
      if (!session.authenticated) throw new AdminApiError("Das Passwort ist nicht korrekt.", 401);
      onAuthenticated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Die Anmeldung ist fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-root min-h-screen bg-[#edf7ff] text-[#173249]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.72fr)]">
        <section className="relative hidden overflow-hidden bg-[#063255] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full border-[48px] border-[#f58a07]/10" />
          <div>
            <BrandMark light />
          </div>
          <div className="relative max-w-xl pb-10">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/10 text-[#ffc376]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="!text-[40px] !font-semibold !leading-[1.15] !text-white">
              Der Praxisalltag.<br />Klar im Blick.
            </h1>
            <p className="mt-5 max-w-md !text-[16px] !font-normal !leading-7 !text-[#dceaf5]">
              Termine, Patient:innen und Erinnerungen an einem geschützten Ort – übersichtlich für das ganze Praxisteam.
            </p>
          </div>
          <p className="!text-xs !font-normal !text-white/45">Interne Praxisverwaltung · KFO Moosburg</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-12 lg:hidden"><BrandMark /></div>
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#063255] text-white shadow-[0_10px_28px_rgba(6,50,85,0.16)]">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <h1 className="!text-[28px] !font-semibold !leading-tight !text-[#102d44]">Willkommen zurück</h1>
              <p className="mt-2 !text-[14px] !font-normal !leading-6 !text-[#536b7d]">
                Melden Sie sich an, um die Praxisverwaltung zu öffnen.
              </p>
            </div>

            {setupUnavailable && (
              <div className="mb-5 rounded-[14px] border border-[#d7ad65] bg-[#fff8e8] px-4 py-3 text-sm leading-5 text-[#684713]" role="status">
                <strong className="block font-semibold">Verwaltung noch nicht verbunden</strong>
                Die sichere Server-Konfiguration fehlt oder ist noch nicht erreichbar. Es werden keine Patientendaten im Browser gespeichert.
              </div>
            )}

            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="admin-password" className="mb-2 block !text-sm !font-medium text-[#173249]">Passwort</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#647b8b]" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                    className="admin-field admin-field-leading admin-field-trailing h-12 w-full"
                    placeholder="Ihr Praxis-Passwort"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#536b7d] transition hover:bg-[#e4f1fa] hover:text-[#063255] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f58a07]"
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {error && <p id="login-error" className="mt-2 !text-[13px] !font-medium !text-[#b42318]" role="alert">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || setupUnavailable}
                className="admin-primary-button h-12 w-full"
              >
                {loading ? <span className="admin-spinner" aria-hidden="true" /> : <LockKeyhole className="h-[18px] w-[18px]" />}
                {loading ? "Anmeldung wird geprüft …" : "Sicher anmelden"}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 border-t border-[#cdddea] pt-6">
              <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#357156]" />
              <p className="!text-[12px] !font-normal !leading-5 !text-[#657b8a]">
                Diese Seite ist ausschließlich für autorisierte Mitarbeitende. Ihre Verbindung ist verschlüsselt; sensible Daten bleiben geschützt.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="KFO Moosburg">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${light ? "bg-white text-[#063255]" : "bg-[#063255] text-white"}`}>
        <span className="text-[13px] font-bold tracking-[-0.04em]">KFO</span>
      </div>
      <div className="leading-tight">
        <div className={`text-[17px] font-semibold tracking-[-0.02em] ${light ? "text-white" : "text-[#063255]"}`}>KFO Moosburg</div>
        <div className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${light ? "text-[#bdd1e0]" : "text-[#587185]"}`}>Praxisverwaltung</div>
      </div>
    </div>
  );
}

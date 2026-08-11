import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Info,
  Mail,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";
import { AdminShell } from "../AdminShell";
import type { SmtpSettings } from "../types";

type Props = {
  settings: SmtpSettings | null;
  onLoggedOut: () => void;
  onSave: (settings: SmtpSettings & { password?: string }) => Promise<void>;
  onTest: (
    recipient: string,
  ) => Promise<{ success: boolean; message?: string }>;
};

const defaults: SmtpSettings = {
  configured: false,
  hasPassword: false,
  host: "",
  port: 587,
  security: "starttls",
  username: "",
  senderName: "KFO Moosburg",
  senderEmail: "",
  replyToEmail: "",
  updatedAt: "",
};

export function SettingsPage({ settings, onLoggedOut, onSave, onTest }: Props) {
  const [draft, setDraft] = useState<SmtpSettings>(settings ?? defaults);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testRecipient, setTestRecipient] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);
  function set<K extends keyof SmtpSettings>(key: K, value: SmtpSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave({ ...draft, ...(password ? { password } : {}) });
      setPassword("");
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Einstellungen konnten nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function test() {
    if (!/^\S+@\S+\.\S+$/.test(testRecipient))
      return setTestResult({
        success: false,
        message: "Bitte geben Sie eine gültige Testadresse ein.",
      });
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(testRecipient);
      setTestResult({
        success: result.success,
        message:
          result.message ||
          (result.success
            ? "Die Test-E-Mail wurde erfolgreich versendet."
            : "Die Verbindung konnte nicht bestätigt werden."),
      });
    } catch (caught) {
      setTestResult({
        success: false,
        message:
          caught instanceof Error
            ? caught.message
            : "Der Verbindungstest ist fehlgeschlagen.",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AdminShell
      title="Einstellungen"
      eyebrow="Praxis & Versand"
      description="Verbinden Sie das Praxis-Postfach sicher und prüfen Sie den automatischen E-Mail-Versand."
      onLoggedOut={onLoggedOut}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <form onSubmit={submit} className="admin-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#deebf2] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e7f3fa] text-[#174d70]">
                <Server className="h-5 w-5" />
              </span>
              <div>
                <h2 className="!text-[16px] !font-semibold !text-[#244158]">
                  E-Mail-Ausgang (SMTP)
                </h2>
                <p className="mt-0.5 !text-[11px] !font-normal !text-[#728895]">
                  Zugangsdaten Ihres Praxis-Postfachs
                </p>
              </div>
            </div>
            <Status configured={Boolean(settings?.configured)} />
          </div>
          <div className="space-y-7 px-5 py-6 sm:px-6">
            <section>
              <div className="mb-4">
                <h3 className="!text-[14px] !font-semibold !text-[#29475d]">
                  Server-Verbindung
                </h3>
                <p className="mt-1 !text-[11px] !font-normal !text-[#718692]">
                  Diese Angaben erhalten Sie von Ihrem E-Mail-Anbieter.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <Field label="SMTP-Server" className="sm:col-span-4">
                  <input
                    required
                    className="admin-field w-full"
                    value={draft.host}
                    onChange={(e) => set("host", e.target.value)}
                    placeholder="smtp.ihre-domain.de"
                  />
                </Field>
                <Field label="Port" className="sm:col-span-2">
                  <input
                    required
                    type="number"
                    min="1"
                    max="65535"
                    className="admin-field w-full"
                    value={draft.port}
                    onChange={(e) => set("port", Number(e.target.value))}
                  />
                </Field>
                <Field label="Verschlüsselung" className="sm:col-span-3">
                  <select
                    className="admin-field w-full"
                    value={draft.security}
                    onChange={(e) =>
                      set(
                        "security",
                        e.target.value as SmtpSettings["security"],
                      )
                    }
                  >
                    <option value="starttls">STARTTLS (empfohlen)</option>
                    <option value="tls">TLS / SSL</option>
                  </select>
                </Field>
                <Field label="Benutzername" className="sm:col-span-3">
                  <input
                    required
                    className="admin-field w-full"
                    value={draft.username}
                    onChange={(e) => set("username", e.target.value)}
                    autoComplete="username"
                  />
                </Field>
                <Field
                  label={
                    draft.hasPassword ? "Neues Passwort (optional)" : "Passwort"
                  }
                  className="sm:col-span-6"
                >
                  <div className="relative">
                    <input
                      required={!draft.hasPassword}
                      type={showPassword ? "text" : "password"}
                      className="admin-field w-full pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder={
                        draft.hasPassword
                          ? "Gespeichertes Passwort beibehalten"
                          : "Passwort eingeben"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[9px] text-[#647c8c] hover:bg-[#e9f3f8]"
                      aria-label={
                        showPassword
                          ? "Passwort verbergen"
                          : "Passwort anzeigen"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="admin-help">
                    Das Passwort wird verschlüsselt gespeichert und später
                    niemals wieder angezeigt.
                  </p>
                </Field>
              </div>
            </section>
            <section className="border-t border-[#e3edf3] pt-6">
              <div className="mb-4">
                <h3 className="!text-[14px] !font-semibold !text-[#29475d]">
                  Absender
                </h3>
                <p className="mt-1 !text-[11px] !font-normal !text-[#718692]">
                  So erscheint die Erinnerung bei Ihren Patient:innen.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Absendername">
                  <input
                    required
                    className="admin-field w-full"
                    value={draft.senderName}
                    onChange={(e) => set("senderName", e.target.value)}
                  />
                </Field>
                <Field label="Absender-E-Mail">
                  <input
                    required
                    type="email"
                    className="admin-field w-full"
                    value={draft.senderEmail}
                    onChange={(e) => set("senderEmail", e.target.value)}
                    placeholder="praxis@kfo-moosburg.de"
                  />
                </Field>
                <Field
                  label="Antwortadresse (optional)"
                  className="sm:col-span-2"
                >
                  <input
                    type="email"
                    className="admin-field w-full"
                    value={draft.replyToEmail ?? ""}
                    onChange={(e) => set("replyToEmail", e.target.value)}
                    placeholder="Falls Antworten an eine andere Adresse gehen sollen"
                  />
                </Field>
              </div>
            </section>
            {error && (
              <div
                className="rounded-[11px] border border-[#e6aaa5] bg-[#fff2f1] px-4 py-3 text-[12px] font-medium text-[#9c302b]"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#dfeaf1] bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="min-h-5 text-[11px] font-medium text-[#39765a]">
              {saved && (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Einstellungen gespeichert
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="admin-primary-button h-10"
            >
              {saving ? (
                <span className="admin-spinner h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? "Wird gespeichert …" : "Sicher speichern"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="admin-surface p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fff0dd] text-[#a85d06]">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <h2 className="!text-[15px] !font-semibold !text-[#29475d]">
                  Verbindung testen
                </h2>
                <p className="mt-0.5 !text-[10px] !font-normal !text-[#758995]">
                  Eine Test-E-Mail versenden
                </p>
              </div>
            </div>
            <label>
              <span className="admin-label">Empfängeradresse</span>
              <input
                type="email"
                className="admin-field w-full"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="ihre-adresse@beispiel.de"
              />
            </label>
            <button
              type="button"
              onClick={test}
              disabled={testing || !settings?.configured}
              className="admin-secondary-button mt-3 h-10 w-full"
            >
              {testing ? (
                <span className="admin-spinner h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {testing ? "Verbindung wird geprüft …" : "Test-E-Mail senden"}
            </button>
            {!settings?.configured && (
              <p className="admin-help">
                Speichern Sie zuerst vollständige SMTP-Einstellungen.
              </p>
            )}
            {testResult && (
              <div
                className={`mt-4 rounded-[11px] border px-4 py-3 text-[11px] font-medium leading-5 ${testResult.success ? "border-[#a8d5bb] bg-[#eef9f2] text-[#286c4f]" : "border-[#e5aaa5] bg-[#fff3f2] text-[#96332e]"}`}
                role="status"
              >
                {testResult.message}
              </div>
            )}
          </section>
          <section className="overflow-hidden rounded-[16px] border border-[#174b70] bg-[#063255] p-5 text-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#ffc376]" />
              <h2 className="!text-[14px] !font-semibold !text-white">
                Sicherer Umgang
              </h2>
            </div>
            <p className="mt-3 !text-[11px] !font-normal !leading-5 !text-[#b9cedb]">
              SMTP-Passwörter werden ausschließlich verschlüsselt auf dem Server
              gespeichert. Sie landen weder im Browser noch in der
              Patientenliste.
            </p>
          </section>
          <section className="admin-surface p-5">
            <h2 className="!text-[14px] !font-semibold !text-[#29475d]">
              Praxis-Zeitplan
            </h2>
            <div className="mt-4 space-y-3">
              <InfoLine icon={Clock3} label="Zeitzone" value="Europe/Berlin" />
              <InfoLine
                icon={Mail}
                label="Automatische Prüfung"
                value="Täglich"
              />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#eef7fc] px-3 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#397093]" />
              <p className="!text-[10px] !font-normal !leading-5 !text-[#506d80]">
                Vor und nach Zeitumstellungen wird immer deutsche Ortszeit
                berücksichtigt.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}
function Status({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[9px] font-semibold ${configured ? "bg-[#e5f5ec] text-[#287052]" : "bg-[#fff1dc] text-[#925b0a]"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-[#3a8b66]" : "bg-[#dd8a13]"}`}
      />
      {configured ? "Verbunden" : "Nicht eingerichtet"}
    </span>
  );
}
function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#e9f3f9] text-[#426f8a]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-[9px] uppercase tracking-[.06em] text-[#81939e]">
          {label}
        </div>
        <div className="text-[11px] font-semibold text-[#35556b]">{value}</div>
      </div>
    </div>
  );
}

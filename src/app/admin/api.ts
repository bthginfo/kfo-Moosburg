import type {
  AdminSession,
  Customer,
  CustomerDraft,
  ReminderDraft,
  ReminderRule,
  SmtpSettings,
} from "./types";

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: "include" });
  } catch {
    throw new AdminApiError("Die Verwaltungs-Schnittstelle ist derzeit nicht erreichbar.", 0, "NETWORK");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(
      typeof data?.message === "string" ? data.message : "Die Anfrage konnte nicht verarbeitet werden.",
      response.status,
      data?.code,
    );
  }
  return data as T;
}

export const adminApi = {
  session: () => request<AdminSession>("/api/admin-session"),
  login: (password: string) =>
    request<AdminSession>("/api/admin-login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<{ success: boolean }>("/api/admin-logout", { method: "POST" }),
  customers: () => request<{ customers: Customer[] }>("/api/admin-customers"),
  saveCustomer: (customer: CustomerDraft) =>
    request<{ customer: Customer }>("/api/admin-customers", {
      method: customer.id ? "PATCH" : "POST",
      body: JSON.stringify(customer),
    }),
  importCustomers: (customers: CustomerDraft[]) =>
    request<{ imported: number; updated?: number; skipped: number; errors: Array<{ row: number; message: string }> }>(
      "/api/admin-import",
      { method: "POST", body: JSON.stringify({ customers, duplicateStrategy: "skip" }) },
    ),
  reminders: () => request<{ reminders: ReminderRule[] }>("/api/admin-reminders"),
  saveReminder: (reminder: ReminderDraft) =>
    request<{ reminder: ReminderRule }>("/api/admin-reminders", {
      method: reminder.id ? "PATCH" : "POST",
      body: JSON.stringify(reminder),
    }),
  settings: () => request<SmtpSettings>("/api/admin-settings"),
  saveSettings: (settings: SmtpSettings & { password?: string }) =>
    request<SmtpSettings>("/api/admin-settings", { method: "PATCH", body: JSON.stringify(settings) }),
  testConnection: (recipient: string) =>
    request<{ success: boolean; message?: string }>("/api/admin-settings/test", {
      method: "POST",
      body: JSON.stringify({ recipient }),
    }),
};

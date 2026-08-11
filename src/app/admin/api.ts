import type {
  AdminSession,
  Customer,
  CustomerDraft,
  EstimateBundle,
  EstimateCatalogItem,
  EstimateDraft,
  EstimateStatus,
  InvoiceBundle,
  ReminderDraft,
  ReminderRule,
  ScheduleBundle,
  ScheduleEntity,
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

  const controller = init?.signal ? null : new AbortController();
  const timeout = controller ? window.setTimeout(() => controller.abort(), 65_000) : 0;

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "include",
      signal: init?.signal || controller?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdminApiError("Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.", 0, "TIMEOUT");
    }
    throw new AdminApiError("Die Verwaltungs-Schnittstelle ist derzeit nicht erreichbar.", 0, "NETWORK");
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("kfo:admin-session-expired"));
    throw new AdminApiError(
      typeof data?.message === "string" ? data.message : "Die Anfrage konnte nicht verarbeitet werden.",
      response.status,
      data?.code || data?.error,
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
  archiveCustomer: (id: string, updatedAt: string) =>
    request<{ success: true; archived: true }>("/api/admin-customers", {
      method: "DELETE",
      body: JSON.stringify({ id, updatedAt }),
    }),
  importCustomers: (customers: CustomerDraft[]) =>
    request<{ imported: number; updated?: number; skipped: number; errors: Array<{ row: number; message: string }> }>(
      "/api/admin-import",
      { method: "POST", body: JSON.stringify({ customers, duplicateStrategy: "skip" }) },
    ),
  reminders: () => request<{ reminders: ReminderRule[]; recentDeliveries: import("./types").ReminderDelivery[] }>("/api/admin-reminders"),
  saveReminder: (reminder: ReminderDraft) =>
    request<{ reminder: ReminderRule }>("/api/admin-reminders", {
      method: reminder.id ? "PATCH" : "POST",
      body: JSON.stringify(reminder),
    }),
  deleteReminder: (id: string, updatedAt: string) =>
    request<{ success: true }>("/api/admin-reminders", {
      method: "DELETE",
      body: JSON.stringify({ id, updatedAt }),
    }),
  settings: () => request<SmtpSettings>("/api/admin-settings"),
  saveSettings: (settings: SmtpSettings & { password?: string }) =>
    request<SmtpSettings>("/api/admin-settings", {
      method: "PATCH",
      body: JSON.stringify({
        host: settings.host,
        port: settings.port,
        security: settings.security,
        username: settings.username,
        password: settings.password,
        fromName: settings.senderName,
        fromEmail: settings.senderEmail,
        replyTo: settings.replyToEmail || "",
        updatedAt: settings.updatedAt,
      }),
    }),
  testConnection: (recipient: string) =>
    request<{ success: boolean; message?: string }>("/api/admin-settings/test", {
      method: "POST",
      body: JSON.stringify({ recipient }),
    }),
  schedule: () => request<ScheduleBundle>("/api/admin-schedule"),
  saveScheduleEntity: (entity: ScheduleEntity, data: Record<string, unknown>) =>
    request<ScheduleBundle>("/api/admin-schedule", {
      method: data.id ? "PATCH" : "POST",
      body: JSON.stringify({ entity, data }),
    }),
  deleteScheduleEntity: (entity: ScheduleEntity, id: string, updatedAt?: string) =>
    request<ScheduleBundle>("/api/admin-schedule", {
      method: "DELETE",
      body: JSON.stringify({ entity, id, updatedAt }),
    }),
  estimates: () => request<EstimateBundle>("/api/admin-estimates"),
  saveEstimate: (data: EstimateDraft) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: data.id ? "PATCH" : "POST",
      body: JSON.stringify({ entity: "estimate", data }),
    }),
  saveEstimateCatalogItem: (data: Partial<EstimateCatalogItem>) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: data.id ? "PATCH" : "POST",
      body: JSON.stringify({ entity: "catalogItem", data }),
    }),
  updateEstimateStatus: (id: string, status: EstimateStatus) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "status", id, status }),
    }),
  duplicateEstimate: (id: string) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "duplicate", id }),
    }),
  sendEstimate: (id: string) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "send", id }),
    }),
  archiveEstimate: (id: string) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "DELETE",
      body: JSON.stringify({ entity: "estimate", id }),
    }),
  archiveEstimateCatalogItem: (id: string) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "DELETE",
      body: JSON.stringify({ entity: "catalogItem", id }),
    }),
  importOfficialBemaCatalog: () =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "importOfficialBema" }),
    }),
  importEstimateCatalog: (rows: Array<Record<string, unknown>>) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "importCatalog", rows }),
    }),
  syncKzvbPointValues: (quarter?: string) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "syncPointValues", quarter: quarter || undefined }),
    }),
  importEstimatePointValues: (rows: Array<Record<string, unknown>>) =>
    request<EstimateBundle>("/api/admin-estimates", {
      method: "POST",
      body: JSON.stringify({ action: "importPointValues", rows }),
    }),
  estimatePrintUrl: (id: string) => `/api/admin-estimates?action=print&id=${encodeURIComponent(id)}`,
  invoices: () => request<InvoiceBundle>("/api/admin-invoices"),
  sendInvoice: (data: {
    customerId: string; patientNumber: string; invoiceNumber?: string; issuedAt?: string;
    documentHash?: string; pdfBase64?: string; fileName?: string; kind: "invoice" | "reminder"; invoiceId?: string;
  }) => request<{ invoice: import("./types").InvoiceRecord; delivery: import("./types").InvoiceDelivery }>("/api/admin-invoices", {
    method: "POST", body: JSON.stringify(data),
  }),
};

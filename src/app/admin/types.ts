export type CustomerStatus = "active" | "paused" | "completed" | "archived";

export type Appointment = {
  id?: string;
  date: string;
  time: string;
  type: string;
  note?: string;
  status?: ScheduleAppointmentStatus;
};

export type ScheduleAppointmentStatus = "scheduled" | "confirmed" | "arrived" | "completed" | "cancelled" | "no_show";
export type ScheduleAppointmentSource = "admin" | "import" | "online" | "ivoris";
export type ScheduleSyncStatus = "local" | "pending" | "synced" | "error";

export type ScheduleAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  type: string;
  appointmentTypeId: string;
  providerId: string;
  providerName: string;
  roomId: string;
  roomName: string;
  durationMinutes: number;
  note: string;
  status: ScheduleAppointmentStatus;
  source: ScheduleAppointmentSource;
  externalId: string;
  syncStatus: ScheduleSyncStatus;
  lastSyncedAt: string;
  seriesId: string;
  seriesIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentType = {
  id: string;
  name: string;
  shortName: string;
  category: "consultation" | "diagnostics" | "treatment" | "control" | "retention" | "emergency" | "other";
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  color: string;
  publicBookable: boolean;
  newPatientOnly: boolean;
  active: boolean;
  description: string;
  preparation: string;
  sortOrder: number;
};

export type ScheduleResource = {
  id: string;
  name: string;
  kind: "practitioner" | "room" | "chair";
  color: string;
  active: boolean;
  sortOrder: number;
};

export type AvailabilityRule = {
  id: string;
  appointmentTypeId: string;
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  stepMinutes: number;
  active: boolean;
};

export type AvailabilityException = {
  id: string;
  kind: "closed" | "additional";
  date: string;
  startTime: string;
  endTime: string;
  appointmentTypeId: string;
  providerId: string;
  reason: string;
};

export type BookingSettings = {
  id: "booking";
  publicEnabled: false;
  publicationLocked: true;
  timezone: string;
  bookingHorizonDays: number;
  minNoticeHours: number;
  cancellationNoticeHours: number;
  slotIntervalMinutes: number;
  introText: string;
  integrationSystem: "ivoris";
  integrationStatus: "awaiting_access" | "ready" | "error";
  lastSyncAt: string;
};

export type PreviewSlot = {
  id: string;
  date: string;
  time: string;
  endTime: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  providerId: string;
  providerName: string;
};

export type ScheduleBundle = {
  appointments: ScheduleAppointment[];
  appointmentTypes: AppointmentType[];
  resources: ScheduleResource[];
  availabilityRules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  settings: BookingSettings;
  previewSlots: PreviewSlot[];
};

export type ScheduleEntity = "appointment" | "appointmentType" | "resource" | "availabilityRule" | "exception" | "settings";

export type EstimateStatus = "draft" | "in_review" | "sent" | "accepted" | "declined" | "expired" | "archived";

export type EstimateCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  calculationType: "fixed" | "points";
  points: number;
  pointValue: number;
  unitPriceCents: number;
  computedUnitPriceCents: number;
  unit: string;
  active: boolean;
  externalReference: string;
  feeSystem: "BEMA" | "GOZ" | "private";
  source: string;
  sourceVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type EstimateLineItem = {
  id: string;
  catalogItemId: string;
  position: number;
  code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  discountPercent: number;
  totalCents: number;
  note: string;
  feeSystem: "BEMA" | "GOZ" | "private";
  points: number;
  pointValue: number;
};

export type EstimatePointValue = {
  id: string;
  quarter: string;
  fundGroup: number;
  fundType: string;
  fundTypeLabel: string;
  fundNumber: string;
  pwKfo: number;
  source: string;
  sourceUrl: string;
  importedAt: string;
};

export type CostEstimate = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerBirthDate: string;
  customerEmail: string;
  customerAddress: string;
  title: string;
  diagnosis: string;
  insuranceType: string;
  insurer: string;
  kigLevel: string;
  pointValueQuarter: string;
  insurerGroup: string;
  status: EstimateStatus;
  validUntil: string;
  version: number;
  revisionOfId: string;
  internalNotes: string;
  patientNote: string;
  terms: string;
  subtotalCents: number;
  insuranceShareCents: number;
  patientShareCents: number;
  currency: "EUR";
  sentAt: string;
  acceptedAt: string;
  pickupNoticeSent: boolean;
  createdAt: string;
  updatedAt: string;
  items: EstimateLineItem[];
};

export type EstimateEvent = {
  id: number;
  estimateId: string;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  detail: string;
  createdAt: string;
};

export type EstimateBundle = {
  estimates: CostEstimate[];
  catalog: EstimateCatalogItem[];
  events: EstimateEvent[];
  pointValues: EstimatePointValue[];
};

export type EstimateDraft = Omit<CostEstimate, "id" | "number" | "customerName" | "customerBirthDate" | "customerEmail" | "customerAddress" | "subtotalCents" | "patientShareCents" | "currency" | "sentAt" | "acceptedAt" | "pickupNoticeSent" | "createdAt" | "updatedAt" | "version" | "revisionOfId"> & { id?: string; updatedAt?: string };

export type Customer = {
  id: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  email: string;
  phone?: string;
  mobile?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  insurer?: string;
  insuranceType?: "gesetzlich" | "privat" | "selbstzahler";
  patientNumber?: string;
  status: CustomerStatus;
  notes?: string;
  reminderConsent: boolean;
  invoiceEmailConsent: boolean;
  appointments: Appointment[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceStatus = "not_sent" | "sent" | "reminder_sent" | "paid";
export type InvoiceDeliveryStatus = "processing" | "sent" | "failed" | "uncertain";

export type InvoiceRecord = {
  id: string;
  customerId: string;
  invoiceNumber: string;
  externalId: string;
  documentHash: string;
  issuedAt: string;
  source: "upload" | "ivoris";
  status: InvoiceStatus;
  sentAt: string;
  reminderSentAt: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceDelivery = {
  id: string;
  invoiceId: string;
  customerId: string;
  kind: "invoice" | "reminder";
  status: InvoiceDeliveryStatus;
  sentAt: string;
  error: string;
  updatedAt: string;
};

export type InvoiceBundle = { invoices: InvoiceRecord[]; deliveries: InvoiceDelivery[] };

export type ReminderAudience = "all" | "selected";

export type ReminderRule = {
  id: string;
  name: string;
  subject: string;
  body: string;
  days: number;
  relation: "before" | "after";
  enabled: boolean;
  audience: ReminderAudience;
  customerIds: string[];
  nextRun?: string;
  sentCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ReminderDelivery = {
  id: string;
  reminderId: string;
  appointmentId: string;
  customerId: string;
  recipient: string;
  scheduledDate: string;
  status: "processing" | "sent" | "failed" | "uncertain";
  sentAt: string;
  error: string;
  updatedAt: string;
};

export type SmtpSettings = {
  configured: boolean;
  hasPassword?: boolean;
  host: string;
  port: number;
  security: "tls" | "starttls";
  username: string;
  senderName: string;
  senderEmail: string;
  replyToEmail?: string;
  updatedAt: string;
};

export type DashboardData = {
  activeCustomers: number;
  upcomingAppointments: number;
  dueToday: number;
  sentLast30Days: number;
  upcomingSends: Array<{
    id: string;
    customerName: string;
    email: string;
    appointment: string;
    scheduledFor: string;
    ruleName: string;
    status: "scheduled" | "sent" | "blocked";
  }>;
  recentActivity: Array<{
    id: string;
    text: string;
    occurredAt: string;
    type: "customer" | "reminder" | "import" | "settings";
  }>;
};

export type AdminSession = {
  authenticated: boolean;
  user?: { name: string; email?: string };
  setupRequired?: boolean;
};

export type CustomerDraft = Omit<Customer, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string; updatedAt?: string };
export type ReminderDraft = Omit<ReminderRule, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string; updatedAt?: string };

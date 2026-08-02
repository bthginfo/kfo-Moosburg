export type CustomerStatus = "active" | "paused" | "completed" | "archived";

export type Appointment = {
  id?: string;
  date: string;
  time: string;
  type: string;
  note?: string;
};

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
  appointments: Appointment[];
};

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
};

export type SmtpSettings = {
  configured: boolean;
  hasPassword?: boolean;
  host: string;
  port: number;
  security: "tls" | "starttls" | "none";
  username: string;
  senderName: string;
  senderEmail: string;
  replyToEmail?: string;
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

export type CustomerDraft = Omit<Customer, "id"> & { id?: string };
export type ReminderDraft = Omit<ReminderRule, "id"> & { id?: string };

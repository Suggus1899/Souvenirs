export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  durationMinutes: number;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Booking {
  id: string;
  clientId: string;
  serviceId: string | null;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}

export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  position: number;
}

export interface Invoice {
  id: string;
  number: number;
  publicToken: string;
  notes: string | null;
  sentAt: string | null;
  clientId: string;
  bookingId: string | null;
  totalAmount: string;
  currency: string;
  status: InvoiceStatus;
  dueDate: string | null;
  paymentLinkUrl: string | null;
  createdAt: string;
  /** Detail endpoint only. */
  payments?: Payment[];
  /** Detail endpoint only. */
  items?: InvoiceItem[];
  /** List endpoint only: sum of the payments received. */
  paidAmount?: string;
}

export type PaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "CARD"
  | "STRIPE"
  | "PAGO_MOVIL"
  | "ZELLE"
  | "BINANCE_USDT"
  | "CASH_VES"
  | "OTHER";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  method: PaymentMethod;
  notes: string | null;
  paidAt: string;
}

export type ReminderChannel = "PUSH" | "EMAIL";
export type ReminderStatus = "PENDING" | "SENT" | "DISMISSED";

export type ReminderRecipient = "OWNER" | "CLIENT";

export interface Reminder {
  id: string;
  relatedType: "BOOKING" | "INVOICE";
  relatedId: string;
  remindAt: string;
  channel: ReminderChannel;
  recipient: ReminderRecipient;
  recipientEmail: string | null;
  status: ReminderStatus;
  message: string;
}

export type Plan = "FREE" | "PRO";

export interface Tenant {
  id: string;
  name: string;
  plan: Plan;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  stripeCustomerId: string | null;
  reminderOffsetsDays: number[];
  clientRemindersEnabled: boolean;
}

export type Role = "OWNER" | "ASSISTANT";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface MoneyByCurrency {
  currency: string;
  amount: string;
}

export interface DashboardSummary {
  collectedThisMonth: MoneyByCurrency[];
  outstanding: MoneyByCurrency[];
  openInvoices: number;
  overdueInvoices: number;
  bookingsThisWeek: number;
  nextBookings: {
    id: string;
    title: string;
    scheduledAt: string;
    status: BookingStatus;
    clientName: string;
  }[];
}

/** What the client sees on the public payment page (/pay/:token). */
export interface PublicInvoice {
  number: number;
  studioName: string;
  clientName: string;
  status: InvoiceStatus;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  dueDate: string | null;
  sentAt: string | null;
  notes: string | null;
  items: { description: string; quantity: number; unitPrice: string }[];
  canPayOnline: boolean;
}

export type ExchangeRateSource = "BCV" | "PARALELO";

export interface ExchangeRate {
  source: ExchangeRateSource;
  rate: string;
  fetchedAt: string;
}

export interface ExchangeRates {
  oficial: ExchangeRate | null;
  paralelo: ExchangeRate | null;
}

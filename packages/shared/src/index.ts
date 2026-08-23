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

export interface Invoice {
  id: string;
  clientId: string;
  bookingId: string | null;
  totalAmount: string;
  currency: string;
  status: InvoiceStatus;
  dueDate: string | null;
  paymentLinkUrl: string | null;
  createdAt: string;
  payments?: Payment[];
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

export interface Reminder {
  id: string;
  relatedType: "BOOKING" | "INVOICE";
  relatedId: string;
  remindAt: string;
  channel: ReminderChannel;
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

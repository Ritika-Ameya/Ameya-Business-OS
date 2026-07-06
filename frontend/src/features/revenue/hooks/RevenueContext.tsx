import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedInvoices } from "@/features/revenue/data/seed-invoices";
import { seedPayments } from "@/features/revenue/data/seed-payments";
import type { DealComponent } from "@/features/deals/types/deal-component";
import type { FinanceSettings } from "@/features/settings/types/settings";
import {
  buildInvoiceFromInput,
  deriveInvoiceStatus,
  getNextInvoiceNumberValue,
  type CreateInvoiceInput,
} from "@/features/revenue/utils/invoice-utils";
import { formatPaymentCurrency } from "@/features/revenue/utils/payment-utils";
import { addActivity } from "@/shared/utils/activity-store";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentFormData } from "@/features/revenue/types/payment";

const INVOICES_KEY = "ameya-invoices";
const PAYMENTS_KEY = "ameya-payments";

interface RevenueContextValue {
  invoices: Invoice[];
  payments: Payment[];
  addInvoice: (
    input: CreateInvoiceInput,
    components: DealComponent[],
    finance: FinanceSettings,
    onFinanceUpdate: (finance: FinanceSettings) => void
  ) => Invoice;
  getInvoice: (id: string) => Invoice | undefined;
  recordPayment: (invoiceId: string, data: PaymentFormData) => Payment | null;
  getPaymentsByInvoiceId: (invoiceId: string) => Payment[];
}

const RevenueContext = createContext<RevenueContextValue | null>(null);

export { RevenueContext };

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // fall through
  }
  return fallback;
}

function persistJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parsePaymentAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadJson(INVOICES_KEY, seedInvoices)
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadJson(PAYMENTS_KEY, seedPayments)
  );

  const addInvoice = useCallback(
    (
      input: CreateInvoiceInput,
      components: DealComponent[],
      finance: FinanceSettings,
      onFinanceUpdate: (finance: FinanceSettings) => void
    ): Invoice => {
      const invoice = buildInvoiceFromInput(input, components, finance);

      setInvoices((prev) => {
        const next = [invoice, ...prev];
        persistJson(INVOICES_KEY, next);
        return next;
      });

      onFinanceUpdate({
        ...finance,
        nextInvoiceNumber: getNextInvoiceNumberValue(finance.nextInvoiceNumber),
      });

      addActivity({
        entityType: "invoice",
        entityId: invoice.id,
        action: "invoice_generated",
        title: "Invoice generated",
        description: `${invoice.invoiceNo} for ${formatPaymentCurrency(invoice.amount)}`,
        relatedRecord: invoice.invoiceNo,
        customerId: invoice.customerId,
        dealId: invoice.dealId,
        invoiceId: invoice.id,
      });

      addActivity({
        entityType: "deal",
        entityId: invoice.dealId,
        action: "invoice_generated",
        title: "Invoice generated",
        description: `${invoice.invoiceNo} — ${formatPaymentCurrency(invoice.amount)}`,
        relatedRecord: invoice.invoiceNo,
        customerId: invoice.customerId,
        dealId: invoice.dealId,
        invoiceId: invoice.id,
      });

      addActivity({
        entityType: "customer",
        entityId: invoice.customerId,
        action: "invoice_generated",
        title: "Invoice generated",
        description: `${invoice.invoiceNo} for ${invoice.dealTitle}`,
        relatedRecord: invoice.invoiceNo,
        customerId: invoice.customerId,
        dealId: invoice.dealId,
        invoiceId: invoice.id,
      });

      return invoice;
    },
    []
  );

  const recordPayment = useCallback((invoiceId: string, data: PaymentFormData): Payment | null => {
    const amount = parsePaymentAmount(data.amount);
    if (amount <= 0) return null;

    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice || amount > invoice.outstanding) return null;

    const payment: Payment = {
      id: `pay-${crypto.randomUUID().slice(0, 8)}`,
      invoiceId,
      paymentDate: data.paymentDate,
      amount,
      mode: data.mode,
      referenceNumber: data.referenceNumber.trim() || undefined,
      receivedBy: data.receivedBy.trim() || undefined,
      transactionId: data.transactionId.trim() || undefined,
      status: amount < invoice.outstanding ? "pending" : "received",
      notes: data.notes.trim() || undefined,
    };

    setInvoices((prevInvoices) => {
      const next = prevInvoices.map((item) => {
        if (item.id !== invoiceId) return item;
        const received = item.received + amount;
        const outstanding = Math.max(0, item.amount - received);
        const status = deriveInvoiceStatus(item.amount, received, item.dueDate, item.status);
        return { ...item, received, outstanding, status };
      });
      persistJson(INVOICES_KEY, next);
      return next;
    });

    setPayments((prev) => {
      const next = [payment, ...prev];
      persistJson(PAYMENTS_KEY, next);
      return next;
    });

    addActivity({
      entityType: "invoice",
      entityId: invoiceId,
      action: "payment_recorded",
      title: "Payment recorded",
      description: `${formatPaymentCurrency(payment.amount)} via ${data.mode}`,
      notes: data.notes.trim() || undefined,
      relatedRecord: invoice.invoiceNo,
      customerId: invoice.customerId,
      dealId: invoice.dealId,
      invoiceId,
    });

    addActivity({
      entityType: "deal",
      entityId: invoice.dealId,
      action: "payment_recorded",
      title: "Payment recorded",
      description: `${formatPaymentCurrency(payment.amount)} for ${invoice.invoiceNo}`,
      relatedRecord: invoice.invoiceNo,
      customerId: invoice.customerId,
      dealId: invoice.dealId,
      invoiceId,
    });

    addActivity({
      entityType: "customer",
      entityId: invoice.customerId,
      action: "payment_recorded",
      title: "Payment recorded",
      description: `${formatPaymentCurrency(payment.amount)} for ${invoice.invoiceNo}`,
      relatedRecord: invoice.invoiceNo,
      customerId: invoice.customerId,
      dealId: invoice.dealId,
      invoiceId,
    });

    return payment;
  }, [invoices]);

  const getInvoice = useCallback(
    (id: string) => invoices.find((invoice) => invoice.id === id),
    [invoices]
  );

  const getPaymentsByInvoiceId = useCallback(
    (invoiceId: string) =>
      payments
        .filter((payment) => payment.invoiceId === invoiceId)
        .sort(
          (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        ),
    [payments]
  );

  const value = useMemo(
    () => ({
      invoices,
      payments,
      addInvoice,
      getInvoice,
      recordPayment,
      getPaymentsByInvoiceId,
    }),
    [invoices, payments, addInvoice, getInvoice, recordPayment, getPaymentsByInvoiceId]
  );

  return <RevenueContext.Provider value={value}>{children}</RevenueContext.Provider>;
}

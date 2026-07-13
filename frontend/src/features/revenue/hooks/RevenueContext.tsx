import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { invoicesApi } from "@/features/revenue/api/invoices.api";
import {
  mapInvoiceFromDto,
  mapPaymentFormToBody,
  mapPaymentFromDto,
} from "@/features/revenue/api/revenue.mappers";
import type { InvoiceCreateBody } from "@/features/revenue/api/revenue.dto";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentFormData } from "@/features/revenue/types/payment";

interface RevenueContextValue {
  invoices: Invoice[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  refreshInvoices: () => Promise<void>;
  fetchInvoice: (id: string) => Promise<Invoice>;
  loadPaymentsForInvoice: (invoiceId: string) => Promise<Payment[]>;
  createInvoice: (body: InvoiceCreateBody) => Promise<Invoice>;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getInvoicesByDealId: (dealId: string) => Invoice[];
  getPaymentsByInvoiceId: (invoiceId: string) => Payment[];
  recordPayment: (invoiceId: string, data: PaymentFormData) => Promise<Payment>;
}

const RevenueContext = createContext<RevenueContextValue | null>(null);

export { RevenueContext };

function upsertInvoice(list: Invoice[], invoice: Invoice): Invoice[] {
  const index = list.findIndex((item) => item.id === invoice.id);
  if (index === -1) return [invoice, ...list];
  const next = [...list];
  next[index] = invoice;
  return next;
}

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await invoicesApi.list();
      const mapped = items.map(mapInvoiceFromDto);
      setInvoices(mapped);
      const paymentLists = await Promise.all(
        mapped.map(async (invoice) => {
          try {
            return await invoicesApi.listPayments(invoice.id);
          } catch {
            return [];
          }
        })
      );
      setPayments(paymentLists.flat().map(mapPaymentFromDto));
    } catch (err) {
      setError(getErrorMessage(err));
      setInvoices([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoice = useCallback(async (id: string) => {
    const dto = await invoicesApi.getById(id);
    const invoice = mapInvoiceFromDto(dto);
    setInvoices((prev) => upsertInvoice(prev, invoice));
    return invoice;
  }, []);

  useEffect(() => {
    // Initial load from backend on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshInvoices();
  }, [refreshInvoices]);

  const loadPaymentsForInvoice = useCallback(async (invoiceId: string) => {
    const items = await invoicesApi.listPayments(invoiceId);
    const mapped = items.map(mapPaymentFromDto);
    setPayments((prev) => {
      const others = prev.filter((payment) => payment.invoiceId !== invoiceId);
      return [...mapped, ...others];
    });
    return mapped;
  }, []);

  const createInvoice = useCallback(async (body: InvoiceCreateBody) => {
    const created = await invoicesApi.create(body);
    const invoice = mapInvoiceFromDto(created);
    setInvoices((prev) => [invoice, ...prev]);
    return invoice;
  }, []);

  const recordPayment = useCallback(
    async (invoiceId: string, data: PaymentFormData) => {
      const result = await invoicesApi.addPayment(invoiceId, mapPaymentFormToBody(data));
      const payment = mapPaymentFromDto(result.payment);
      const invoice = mapInvoiceFromDto(result.invoice);
      setPayments((prev) => [payment, ...prev.filter((item) => item.id !== payment.id)]);
      setInvoices((prev) => upsertInvoice(prev, invoice));
      return payment;
    },
    []
  );

  const getInvoice = useCallback(
    (id: string) => invoices.find((invoice) => invoice.id === id),
    [invoices]
  );

  const getInvoicesByCustomerId = useCallback(
    (customerId: string) => invoices.filter((invoice) => invoice.customerId === customerId),
    [invoices]
  );

  const getInvoicesByDealId = useCallback(
    (dealId: string) => invoices.filter((invoice) => invoice.dealId === dealId),
    [invoices]
  );

  const getPaymentsByInvoiceId = useCallback(
    (invoiceId: string) => payments.filter((payment) => payment.invoiceId === invoiceId),
    [payments]
  );

  const value = useMemo(
    () => ({
      invoices,
      payments,
      loading,
      error,
      refreshInvoices,
      fetchInvoice,
      loadPaymentsForInvoice,
      createInvoice,
      getInvoice,
      getInvoicesByCustomerId,
      getInvoicesByDealId,
      getPaymentsByInvoiceId,
      recordPayment,
    }),
    [
      invoices,
      payments,
      loading,
      error,
      refreshInvoices,
      fetchInvoice,
      loadPaymentsForInvoice,
      createInvoice,
      getInvoice,
      getInvoicesByCustomerId,
      getInvoicesByDealId,
      getPaymentsByInvoiceId,
      recordPayment,
    ]
  );

  return <RevenueContext.Provider value={value}>{children}</RevenueContext.Provider>;
}

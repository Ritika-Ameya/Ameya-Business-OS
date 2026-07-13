import { getDealsByCustomerId } from "@/features/deals/utils/deal-utils";
import { getInvoicesByCustomerId } from "@/features/revenue/utils/invoice-utils";
import type { Deal } from "@/features/deals/types/deal";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentMode, PaymentStatus } from "@/features/revenue/types/payment";

export interface CustomerPaymentHistoryItem {
  paymentId: string;
  invoiceId: string;
  invoiceNo: string;
  dealTitle: string;
  paymentDate: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
}

export type CustomerRenewalStatus = "upcoming" | "overdue" | "scheduled";

export interface CustomerRenewalItem {
  id: string;
  dealId: string;
  renewalLabel: string;
  dealTitle: string;
  dueDate: string;
  amount: string;
  status: CustomerRenewalStatus;
}

export function getCustomerPaymentHistory(
  customerId: string,
  invoices: Invoice[],
  payments: Payment[]
): CustomerPaymentHistoryItem[] {
  const customerInvoices = getInvoicesByCustomerId(invoices, customerId);
  const invoiceMap = new Map(customerInvoices.map((invoice) => [invoice.id, invoice]));

  return payments
    .filter((payment) => invoiceMap.has(payment.invoiceId))
    .map((payment) => {
      const invoice = invoiceMap.get(payment.invoiceId)!;
      return {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        invoiceNo: invoice.invoiceNo,
        dealTitle: invoice.dealTitle,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        mode: payment.mode,
        status: payment.status,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
}

export function getCustomerRenewals(
  customerId: string,
  deals: Deal[]
): CustomerRenewalItem[] {
  const customerDeals = getDealsByCustomerId(deals, customerId);
  const now = new Date();

  return customerDeals
    .filter((deal) => deal.nextRenewal)
    .map((deal) => {
      const dueDate = new Date(deal.nextRenewal!);
      const status: CustomerRenewalStatus =
        dueDate < now ? "overdue" : "upcoming";

      return {
        id: `renewal-${deal.id}`,
        dealId: deal.id,
        renewalLabel: `${deal.title} Renewal`,
        dealTitle: deal.title,
        dueDate: deal.nextRenewal!,
        amount: "—",
        status,
      };
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
}

export const customerRenewalStatusLabels: Record<CustomerRenewalStatus, string> = {
  upcoming: "Upcoming",
  overdue: "Overdue",
  scheduled: "Scheduled",
};

export const customerRenewalStatusStyles: Record<CustomerRenewalStatus, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  scheduled: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

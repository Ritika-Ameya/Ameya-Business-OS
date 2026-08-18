import { getDealsByCustomerId } from "@/features/deals/utils/deal-utils";
import {
  computeComponentLineTotal,
  formatComponentCurrency,
  getComponentCurrentDueDate,
  hasComponentRenewal,
} from "@/features/deals/utils/deal-component-utils";
import { getInvoicesByCustomerId } from "@/features/revenue/utils/invoice-utils";
import type { Deal } from "@/features/deals/types/deal";
import type {
  ComponentRenewalFrequency,
  DealComponent,
} from "@/features/deals/types/deal-component";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentMode, PaymentStatus } from "@/features/revenue/types/payment";

export interface CustomerPaymentHistoryItem {
  paymentId: string;
  invoiceId: string;
  invoiceNo: string;
  dealId: string;
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
  componentName: string;
  renewalLabel: string;
  dealTitle: string;
  dueDate: string;
  lastPaidDate: string;
  amount: string;
  status: CustomerRenewalStatus;
  renewalFrequency: ComponentRenewalFrequency;
  renewalStartDate: string;
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
        dealId: invoice.dealId,
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
  deals: Deal[],
  components: DealComponent[] = []
): CustomerRenewalItem[] {
  const customerDeals = getDealsByCustomerId(deals, customerId);
  const dealById = new Map(customerDeals.map((deal) => [deal.id, deal]));
  const now = new Date();

  return components
    .filter(
      (component) =>
        dealById.has(component.dealId) &&
        hasComponentRenewal(component.renewalFrequency) &&
        Boolean(getComponentCurrentDueDate(component))
    )
    .map((component) => {
      const deal = dealById.get(component.dealId)!;
      const dueIso = getComponentCurrentDueDate(component);
      const dueDate = new Date(dueIso);
      const status: CustomerRenewalStatus =
        dueDate < now ? "overdue" : "upcoming";

      return {
        id: `renewal-${component.id}`,
        dealId: deal.id,
        componentName: component.name,
        renewalLabel: component.name,
        dealTitle: deal.title,
        dueDate: dueIso,
        lastPaidDate: component.lastRenewedDate?.trim() || "",
        amount: formatComponentCurrency(computeComponentLineTotal(component)),
        status,
        renewalFrequency: component.renewalFrequency,
        renewalStartDate: component.renewalStartDate || dueIso,
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

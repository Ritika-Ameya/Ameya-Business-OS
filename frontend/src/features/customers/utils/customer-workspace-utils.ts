import { getDealsByCustomerId } from "@/features/deals/utils/deal-utils";
import {
  computeComponentLineTotal,
  computeComponentTaxable,
  getComponentCurrentDueDate,
  hasComponentRenewal,
  isRecordedRenewal,
} from "@/features/deals/utils/deal-component-utils";
import {
  formatBaseWithGst,
  getInvoicesByCustomerId,
} from "@/features/revenue/utils/invoice-utils";
import type { Deal } from "@/features/deals/types/deal";
import type {
  ComponentRenewalFrequency,
  DealComponent,
} from "@/features/deals/types/deal-component";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentMode, PaymentStatus } from "@/features/revenue/types/payment";
import type { Customer } from "@/features/customers/types/customer";

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
  /** Cash recorded on a forecast, not against an invoice. */
  source: "invoice" | "expected_receipt";
  /** What this invoice still has left after every payment on it. */
  invoiceOutstanding?: number;
  receiptId?: string;
  receiptPaymentIndex?: number;
  reason?: string;
  tdsAmount?: number;
  tdsSettles?: boolean;
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
        source: "invoice" as const,
        invoiceOutstanding: invoice.outstanding,
        tdsAmount: payment.tdsAmount,
        tdsSettles: payment.tdsSettles,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
}

export interface CustomerBillingDue {
  id: string;
  dealId: string;
  dealTitle: string;
  componentName: string;
  dueDate: string;
  /** No payment recorded yet, so this date is the first bill, not a renewal. */
  firstPayment: boolean;
}

/** Every dated component on this customer's deals, including a one-time first bill. */
export function getCustomerBillingSchedule(
  customerId: string,
  deals: Deal[],
  components: DealComponent[] = []
): CustomerBillingDue[] {
  const customerDeals = getDealsByCustomerId(deals, customerId);
  const dealById = new Map(customerDeals.map((deal) => [deal.id, deal]));

  return components
    .filter(
      (component) =>
        dealById.has(component.dealId) &&
        Boolean(getComponentCurrentDueDate(component))
    )
    .map((component) => {
      const deal = dealById.get(component.dealId)!;
      return {
        id: component.id,
        dealId: deal.id,
        dealTitle: deal.title,
        componentName: component.name,
        dueDate: getComponentCurrentDueDate(component),
        firstPayment: !component.lastRenewedDate?.trim(),
      };
    })
    .filter((item) => Boolean(item.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
        amount: formatBaseWithGst(
          computeComponentTaxable(component),
          computeComponentLineTotal(component) - computeComponentTaxable(component)
        ),
        status,
        renewalFrequency: component.renewalFrequency,
        renewalStartDate: component.renewalStartDate || dueIso,
      };
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
}

export function enrichCustomersListMetrics(
  customers: Customer[],
  deals: Deal[],
  components: DealComponent[] = [],
  outstandingByCustomer?: Map<string, number>
): Customer[] {
  const activeDealCount = new Map<string, number>();
  const dealCustomerId = new Map<string, string>();

  for (const deal of deals) {
    dealCustomerId.set(deal.id, deal.customerId);
    if (deal.status === "completed") continue;
    activeDealCount.set(
      deal.customerId,
      (activeDealCount.get(deal.customerId) ?? 0) + 1
    );
  }

  const nextRenewalByCustomer = new Map<string, string>();
  const nextDueByCustomer = new Map<
    string,
    { date: string; kind: "first" | "renewal"; name: string; count: number }
  >();
  for (const component of components) {
    const dueDate = getComponentCurrentDueDate(component);
    if (!dueDate) continue;
    const customerId = dealCustomerId.get(component.dealId);
    if (!customerId) continue;
    const recorded = isRecordedRenewal(component);
    if (recorded) {
      const existingRenewal = nextRenewalByCustomer.get(customerId);
      if (!existingRenewal || dueDate < existingRenewal) {
        nextRenewalByCustomer.set(customerId, dueDate);
      }
    }
    const existingDue = nextDueByCustomer.get(customerId);
    if (!existingDue) {
      nextDueByCustomer.set(customerId, {
        date: dueDate,
        kind: recorded ? "renewal" : "first",
        name: component.name,
        count: 1,
      });
    } else {
      existingDue.count += 1;
      if (dueDate < existingDue.date) {
        existingDue.date = dueDate;
        existingDue.kind = recorded ? "renewal" : "first";
        existingDue.name = component.name;
      }
    }
  }

  return customers.map((customer) => {
    const due = nextDueByCustomer.get(customer.id);
    return {
      ...customer,
      outstanding: outstandingByCustomer?.get(customer.id) ?? customer.outstanding,
      activeDeals: activeDealCount.get(customer.id) ?? 0,
      nextRenewal: nextRenewalByCustomer.get(customer.id),
      nextDueDate: due?.date,
      nextDueKind: due?.kind,
      nextDueName: due?.name,
      dueCount: due?.count ?? 0,
    };
  });
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

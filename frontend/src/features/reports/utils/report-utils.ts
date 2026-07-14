import type { ReportFilters } from "@/features/reports/types/reports";
import type { Customer } from "@/features/customers/types/customer";
import type { Deal } from "@/features/deals/types/deal";
import type { Invoice } from "@/features/revenue/types/invoice";

export const reportQuickDatePresets = [
  "today",
  "this-week",
  "this-month",
  "last-month",
  "this-quarter",
  "this-year",
] as const;

export const reportQuickDateLabels: Record<
  (typeof reportQuickDatePresets)[number],
  string
> = {
  today: "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "this-year": "This Year",
};

export const defaultReportFilters = (): ReportFilters => ({
  datePreset: "this-month",
  dateFrom: "",
  dateTo: "",
  customer: "all",
  deal: "all",
  status: "all",
  category: "all",
  employee: "all",
  vendor: "all",
  search: "",
});

export function getReportDeals(deals: Deal[], invoices: Invoice[] = []) {
  const map = new Map<string, string>();
  for (const deal of deals) {
    map.set(deal.id, deal.title);
  }
  for (const invoice of invoices) {
    map.set(invoice.dealId, invoice.dealTitle);
  }
  return Array.from(map.entries())
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getReportCustomers(
  customers: Customer[],
  invoices: Invoice[] = []
) {
  const map = new Map<string, string>();
  for (const customer of customers) {
    map.set(customer.id, customer.name);
  }
  for (const invoice of invoices) {
    map.set(invoice.customerId, invoice.customerName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

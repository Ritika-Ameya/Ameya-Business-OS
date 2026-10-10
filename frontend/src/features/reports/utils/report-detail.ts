import type { StatDetailRow } from "@/shared/components/StatDetailDialog";
import type { Invoice } from "@/features/revenue/types/invoice";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";

export interface ReportDetail {
  title: string;
  description: string;
  rows: StatDetailRow[];
  empty: string;
  nameLabel?: string;
  valueLabel?: string;
}

export const sumBy = <T>(items: T[], pick: (item: T) => number): number =>
  Math.round(items.reduce((sum, item) => sum + (Number(pick(item)) || 0), 0) * 100) / 100;

export const countLabel = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export function invoiceRow(
  invoice: Invoice,
  value: number,
  detail?: string
): StatDetailRow {
  return {
    id: invoice.id,
    title: `${invoice.invoiceNo} · ${invoice.customerName}`,
    subtitle: [invoice.dealTitle, `Invoice ${formatInvoiceDate(invoice.invoiceDate)}`, `Due ${formatInvoiceDate(invoice.dueDate)}`]
      .filter(Boolean)
      .join(" · "),
    detail,
    value: formatInvoiceCurrency(value),
    to: `/invoices/${invoice.id}`,
  };
}

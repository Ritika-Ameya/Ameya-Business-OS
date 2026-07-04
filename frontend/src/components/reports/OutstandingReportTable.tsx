import { useNavigate } from "react-router-dom";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInvoiceCurrency, formatInvoiceDate } from "@/lib/invoice-utils";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";

interface OutstandingReportTableProps {
  rows: { invoice: Invoice; daysOverdue: number }[];
}

export function OutstandingReportTable({ rows }: OutstandingReportTableProps) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No outstanding invoices found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All invoices are fully collected for the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
            <TableHead className="hidden lg:table-cell">Days Overdue</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ invoice, daysOverdue }) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer"
              onClick={() =>
                navigate(`/invoices/${invoice.id}`, { state: { tab: "payments" } })
              }
            >
              <TableCell className="pl-4 text-muted-foreground">
                {invoice.customerName}
              </TableCell>
              <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
              <TableCell>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {formatInvoiceCurrency(invoice.outstanding)}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatInvoiceDate(invoice.dueDate)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span
                  className={cn(
                    daysOverdue > 0
                      ? "font-medium text-red-700 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {daysOverdue > 0 ? `${daysOverdue} days` : "—"}
                </span>
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

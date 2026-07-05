import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatInvoiceCurrency, formatInvoiceDate } from "@/lib/invoice-utils";
import { cn } from "@/shared/utils";
import type { Invoice } from "@/types/invoice";

interface OutstandingReportTableProps {
  rows: { invoice: Invoice; daysOverdue: number }[];
}

export function OutstandingReportTable({ rows }: OutstandingReportTableProps) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No outstanding invoices found"
        description="All invoices are fully collected for the selected period."
      />
    );
  }

  return (
    <ResponsiveTableFrame>
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
              title="Open invoice workspace"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
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
    </ResponsiveTableFrame>
  );
}

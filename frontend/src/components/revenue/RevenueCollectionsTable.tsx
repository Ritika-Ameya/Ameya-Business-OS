import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/lib/invoice-utils";
import { formatPaymentDate } from "@/lib/payment-utils";
import type { CollectionRow } from "@/lib/revenue-utils";
import { cn } from "@/lib/utils";

interface RevenueCollectionsTableProps {
  rows: CollectionRow[];
}

export function RevenueCollectionsTable({ rows }: RevenueCollectionsTableProps) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No pending collections</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All invoices are fully collected.
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
            <TableHead className="hidden lg:table-cell">Last Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ invoice, daysOverdue, lastPaymentDate }) => (
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
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {lastPaymentDate ? formatPaymentDate(lastPaymentDate) : "—"}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View invoice payments"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/invoices/${invoice.id}`, {
                      state: { tab: "payments" },
                    });
                  }}
                >
                  <Eye />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

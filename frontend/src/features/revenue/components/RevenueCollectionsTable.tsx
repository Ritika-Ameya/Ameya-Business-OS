import { Eye, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { InvoiceStatusBadge } from "@/features/revenue/components/invoices/InvoiceStatusBadge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";
import { formatPaymentDate } from "@/features/revenue/utils/payment-utils";
import type { CollectionRow } from "@/features/revenue/utils/revenue-utils";
import { cn } from "@/shared/utils";

interface RevenueCollectionsTableProps {
  rows: CollectionRow[];
}

export function RevenueCollectionsTable({ rows }: RevenueCollectionsTableProps) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={IndianRupee}
        title="No pending collections"
        description="All invoices are fully collected for the current view."
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
                navigate(`/invoices/${invoice.id}?tab=payments`)
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
                    navigate(`/invoices/${invoice.id}?tab=payments`);
                  }}
                >
                  <Eye />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

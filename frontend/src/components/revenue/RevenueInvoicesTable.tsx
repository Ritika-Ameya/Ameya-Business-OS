import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";

interface RevenueInvoicesTableProps {
  invoices: Invoice[];
}

export function RevenueInvoicesTable({ invoices }: RevenueInvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No invoices found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead className="hidden lg:table-cell">Invoice Date</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="pl-4">
                <Link
                  to={`/invoices/${invoice.id}`}
                  className="font-medium transition-colors hover:text-primary"
                >
                  {invoice.invoiceNo}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.customerName}
              </TableCell>
              <TableCell className="hidden max-w-[160px] truncate text-muted-foreground md:table-cell">
                {invoice.dealTitle}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatInvoiceDate(invoice.invoiceDate)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatInvoiceDate(invoice.dueDate)}
              </TableCell>
              <TableCell className="font-medium">
                {formatInvoiceCurrency(invoice.amount)}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-medium",
                    invoice.outstanding > 0
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {formatInvoiceCurrency(invoice.outstanding)}
                </span>
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link to={`/invoices/${invoice.id}`} aria-label="View invoice">
                    <Eye />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

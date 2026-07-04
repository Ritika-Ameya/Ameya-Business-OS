import { IndianRupee } from "lucide-react";
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
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/lib/invoice-utils";
import { cn } from "@/shared/utils";
import type { Invoice } from "@/types/invoice";

interface RevenueReportTableProps {
  invoices: Invoice[];
}

export function RevenueReportTable({ invoices }: RevenueReportTableProps) {
  const navigate = useNavigate();

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={IndianRupee}
        title="No revenue records found"
        description="Try adjusting your date range or filters."
      />
    );
  }

  return (
    <ResponsiveTableFrame>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead className="hidden lg:table-cell">Invoice Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Collected</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer"
              title="Open invoice workspace"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <TableCell className="pl-4 font-medium">{invoice.invoiceNo}</TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.customerName}
              </TableCell>
              <TableCell className="hidden max-w-[160px] truncate text-muted-foreground md:table-cell">
                {invoice.dealTitle}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatInvoiceDate(invoice.invoiceDate)}
              </TableCell>
              <TableCell className="font-medium">
                {formatInvoiceCurrency(invoice.amount)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatInvoiceCurrency(invoice.received)}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

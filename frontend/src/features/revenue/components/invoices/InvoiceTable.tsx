import { Edit, Eye, MoreHorizontal, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { InvoiceStatusBadge } from "@/features/revenue/components/invoices/InvoiceStatusBadge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
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
import { cn } from "@/shared/utils";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceTableProps {
  invoices: Invoice[];
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function InvoiceTable({
  invoices,
  isFiltered = false,
  onResetFilters,
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No invoices found"
        description="Try a different search term or adjust your filters."
        secondaryActionLabel={isFiltered ? "Reset filters" : undefined}
        onSecondaryAction={isFiltered ? onResetFilters : undefined}
      />
    );
  }

  return (
    <ResponsiveTableFrame>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Invoice No</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Received</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
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
              <TableCell className="hidden max-w-[180px] truncate text-muted-foreground md:table-cell">
                {invoice.dealTitle}
              </TableCell>
              <TableCell className="font-medium">
                {formatInvoiceCurrency(invoice.amount)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
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
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatInvoiceDate(invoice.dueDate)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      aria-label={`View invoice ${invoice.invoiceNo}`}
                    >
                      <Eye />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit invoice" disabled>
                    <Edit />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More actions for ${invoice.invoiceNo}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/invoices/${invoice.id}`}>View workspace</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>Download PDF</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Send reminder</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

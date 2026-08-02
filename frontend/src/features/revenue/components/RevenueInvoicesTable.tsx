import { ArrowDownAZ, ArrowUpAZ, Edit, Eye, MoreHorizontal, Receipt } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { EditInvoiceDialog } from "@/features/revenue/components/invoices/EditInvoiceDialog";
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
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import type { Invoice, InvoiceNumberSort } from "@/features/revenue/types/invoice";

interface RevenueInvoicesTableProps {
  invoices: Invoice[];
  isFiltered?: boolean;
  onResetFilters?: () => void;
  numberSort: InvoiceNumberSort;
  onNumberSortChange: (sort: InvoiceNumberSort) => void;
}

export function RevenueInvoicesTable({
  invoices,
  isFiltered = false,
  onResetFilters,
  numberSort,
  onNumberSortChange,
}: RevenueInvoicesTableProps) {
  const { removeInvoice } = useRevenue();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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

  const toggleSort = () => {
    onNumberSortChange(numberSort === "asc" ? "desc" : "asc");
  };

  const handleDelete = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Delete invoice "${invoice.invoiceNo}"?\n\nRelated payments will also be removed.`
    );
    if (!confirmed) return;
    await removeInvoice(invoice.id);
  };

  return (
    <>
      <ResponsiveTableFrame>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">
                <button
                  type="button"
                  onClick={toggleSort}
                  className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                  aria-label={`Sort by invoice number ${numberSort === "asc" ? "descending" : "ascending"}`}
                >
                  Invoice Number
                  {numberSort === "asc" ? (
                    <ArrowUpAZ className="size-3.5" />
                  ) : (
                    <ArrowDownAZ className="size-3.5" />
                  )}
                </button>
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Deal</TableHead>
              <TableHead className="hidden lg:table-cell">Invoice Date</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Outstanding</TableHead>
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
                  <div>
                    <span>{formatInvoiceCurrency(invoice.amount)}</span>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      Due {formatInvoiceCurrency(invoice.outstanding)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span
                    className={cn(
                      "font-medium",
                      invoice.outstanding > 0 && invoice.status !== "cancelled"
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
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" asChild>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        aria-label={`View invoice ${invoice.invoiceNo}`}
                      >
                        <Eye />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hidden sm:inline-flex"
                      aria-label="Edit invoice"
                      disabled={invoice.status === "cancelled"}
                      onClick={() => setEditingInvoice(invoice)}
                    >
                      <Edit />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for invoice ${invoice.invoiceNo}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}`}>View invoice</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={invoice.status === "cancelled"}
                          onClick={() => setEditingInvoice(invoice)}
                        >
                          Edit invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => void handleDelete(invoice)}
                        >
                          Delete invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableFrame>
      <EditInvoiceDialog
        invoice={editingInvoice}
        open={Boolean(editingInvoice)}
        onOpenChange={(open) => {
          if (!open) setEditingInvoice(null);
        }}
      />
    </>
  );
}

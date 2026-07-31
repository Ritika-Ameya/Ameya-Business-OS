import { Eye, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
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
} from "@/features/revenue/utils/invoice-utils";
import { formatPaymentDate } from "@/features/revenue/utils/payment-utils";
import type { CollectionRow } from "@/features/revenue/utils/revenue-utils";

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
            <TableHead>Invoice No</TableHead>
            <TableHead>Invoice Amount</TableHead>
            <TableHead>Collected Amount</TableHead>
            <TableHead>Balance Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Payment Mode</TableHead>
            <TableHead className="hidden md:table-cell">Payment Date</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const { invoice, payments, invoiceAmount, collectedAmount, balanceAmount } =
              row;

            return (
              <TableRow
                key={invoice.id}
                className="cursor-pointer align-top"
                onClick={() => navigate(`/invoices/${invoice.id}?tab=payments`)}
              >
                <TableCell className="pl-4 text-muted-foreground">
                  {invoice.customerName}
                </TableCell>
                <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                <TableCell className="font-medium">
                  {formatInvoiceCurrency(invoiceAmount)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {payments.length === 0 ? (
                      <span className="text-muted-foreground">
                        {formatInvoiceCurrency(collectedAmount)}
                      </span>
                    ) : (
                      <>
                        {payments.map((payment, index) => (
                          <p key={payment.id} className="text-sm">
                            Payment {index + 1}: {formatInvoiceCurrency(payment.amount)}
                          </p>
                        ))}
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          Total Paid: {formatInvoiceCurrency(collectedAmount)}
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {formatInvoiceCurrency(balanceAmount)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {payments.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-1">
                      {payments.map((payment) => (
                        <p key={`${payment.id}-mode`} className="text-sm text-muted-foreground">
                          {payment.mode || "—"}
                        </p>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {payments.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-1">
                      {payments.map((payment) => (
                        <p key={`${payment.id}-date`} className="text-sm text-muted-foreground">
                          {formatPaymentDate(payment.paymentDate)}
                        </p>
                      ))}
                    </div>
                  )}
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
            );
          })}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

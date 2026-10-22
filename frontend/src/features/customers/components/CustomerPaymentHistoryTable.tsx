import { Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  PaymentModeBadge,
  PaymentStatusBadge,
} from "@/features/revenue/components/invoices/payments/PaymentBadges";
import { Button } from "@/shared/ui/button";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  formatPaymentCurrency,
  formatPaymentDate,
  formatTdsDeductionNote,
} from "@/features/revenue/utils/payment-utils";
import type { CustomerPaymentHistoryItem } from "@/features/customers/utils/customer-workspace-utils";

interface CustomerPaymentHistoryTableProps {
  payments: CustomerPaymentHistoryItem[];
  onDeleteReceiptPayment?: (payment: CustomerPaymentHistoryItem) => void;
  deletingId?: string | null;
}

export function CustomerPaymentHistoryTable({
  payments,
  onDeleteReceiptPayment,
  deletingId = null,
}: CustomerPaymentHistoryTableProps) {
  const navigate = useNavigate();

  return (
    <ResponsiveTableFrame>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Payment Date</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Payment Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const fromReceipt = payment.source === "expected_receipt";
            return (
            <TableRow
              key={payment.paymentId}
              className={fromReceipt ? undefined : "cursor-pointer"}
              onClick={() => {
                if (fromReceipt) return;
                navigate(`/invoices/${payment.invoiceId}?tab=payments`);
              }}
            >
              <TableCell className="pl-4 text-muted-foreground">
                {formatPaymentDate(payment.paymentDate)}
              </TableCell>
              <TableCell className="font-medium">
                {fromReceipt ? "Expected receipt" : payment.invoiceNo}
                {fromReceipt ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {payment.reason || "Marked from the forecast, not against an invoice"}
                  </p>
                ) : null}
                {!fromReceipt && (payment.invoiceOutstanding ?? 0) > 0.009 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Partially received against this invoice · {formatPaymentCurrency(payment.invoiceOutstanding ?? 0)} still due
                  </p>
                ) : null}
                <p className="truncate text-xs text-muted-foreground md:hidden">
                  {payment.dealTitle || "—"}
                </p>
              </TableCell>
              <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                {payment.dealId ? (
                  <Link
                    to={`/deals/${payment.dealId}`}
                    className="font-medium transition-colors hover:text-primary"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {payment.dealTitle || "—"}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {payment.dealTitle || "—"}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {formatPaymentCurrency(payment.amount)}
                {formatTdsDeductionNote(payment.tdsAmount, payment.tdsSettles) ? (
                  <p className="text-xs font-normal text-muted-foreground">
                    {formatTdsDeductionNote(payment.tdsAmount, payment.tdsSettles)}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {payment.mode ? <PaymentModeBadge mode={payment.mode} /> : "—"}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
                {!fromReceipt && (payment.invoiceOutstanding ?? 0) > 0.009 ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Partial</p>
                ) : null}
              </TableCell>
              <TableCell className="pr-4 text-right">
                {fromReceipt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === payment.paymentId}
                    aria-label="Delete expected receipt payment"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteReceiptPayment?.(payment);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

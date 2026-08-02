import { Link, useNavigate } from "react-router-dom";
import {
  PaymentModeBadge,
  PaymentStatusBadge,
} from "@/features/revenue/components/invoices/payments/PaymentBadges";
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
} from "@/features/revenue/utils/payment-utils";
import type { CustomerPaymentHistoryItem } from "@/features/customers/utils/customer-workspace-utils";

interface CustomerPaymentHistoryTableProps {
  payments: CustomerPaymentHistoryItem[];
}

export function CustomerPaymentHistoryTable({
  payments,
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
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow
              key={payment.paymentId}
              className="cursor-pointer"
              onClick={() =>
                navigate(`/invoices/${payment.invoiceId}?tab=payments`)
              }
            >
              <TableCell className="pl-4 text-muted-foreground">
                {formatPaymentDate(payment.paymentDate)}
              </TableCell>
              <TableCell className="font-medium">
                {payment.invoiceNo}
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
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <PaymentModeBadge mode={payment.mode} />
              </TableCell>
              <TableCell className="pr-4">
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

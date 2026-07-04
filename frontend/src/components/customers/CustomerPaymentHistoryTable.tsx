import { useNavigate } from "react-router-dom";
import {
  PaymentModeBadge,
  PaymentStatusBadge,
} from "@/components/invoices/payments/PaymentBadges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPaymentCurrency,
  formatPaymentDate,
} from "@/lib/payment-utils";
import type { CustomerPaymentHistoryItem } from "@/lib/customer-workspace-utils";

interface CustomerPaymentHistoryTableProps {
  payments: CustomerPaymentHistoryItem[];
}

export function CustomerPaymentHistoryTable({
  payments,
}: CustomerPaymentHistoryTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Payment Date</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Mode</TableHead>
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
              <TableCell className="font-medium">{payment.invoiceNo}</TableCell>
              <TableCell className="hidden max-w-[180px] truncate text-muted-foreground md:table-cell">
                {payment.dealTitle}
              </TableCell>
              <TableCell className="font-medium">
                {formatPaymentCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <PaymentModeBadge mode={payment.mode} />
              </TableCell>
              <TableCell className="pr-4">
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

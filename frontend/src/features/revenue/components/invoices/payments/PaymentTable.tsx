import { Edit, Eye, MoreHorizontal } from "lucide-react";
import { PaymentModeBadge, PaymentStatusBadge } from "@/features/revenue/components/invoices/payments/PaymentBadges";
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
  formatPaymentCurrency,
  formatPaymentDate,
} from "@/features/revenue/utils/payment-utils";
import type { Payment } from "@/features/revenue/types/payment";

interface PaymentTableProps {
  payments: Payment[];
}

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Payment Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead className="hidden md:table-cell">Reference Number</TableHead>
            <TableHead className="hidden lg:table-cell">Received By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="pl-4 text-muted-foreground">
                {formatPaymentDate(payment.paymentDate)}
              </TableCell>
              <TableCell className="font-medium">
                {formatPaymentCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <PaymentModeBadge mode={payment.mode} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {payment.referenceNumber ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {payment.receivedBy ?? "—"}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="View payment">
                    <Eye />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit payment" disabled>
                    <Edit />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>View details</DropdownMenuItem>
                      <DropdownMenuItem disabled>Download receipt</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Void payment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

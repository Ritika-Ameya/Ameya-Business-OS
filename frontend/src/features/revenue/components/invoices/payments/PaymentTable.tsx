import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { PaymentModeBadge, PaymentStatusBadge } from "@/features/revenue/components/invoices/payments/PaymentBadges";
import { RecordPaymentDialog } from "@/features/revenue/components/invoices/payments/RecordPaymentDialog";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
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
  formatPaymentCurrency,
  formatPaymentDate,
} from "@/features/revenue/utils/payment-utils";
import type { Payment } from "@/features/revenue/types/payment";

interface PaymentTableProps {
  payments: Payment[];
  invoiceId: string;
  canModify?: boolean;
}

export function PaymentTable({
  payments,
  invoiceId,
  canModify = true,
}: PaymentTableProps) {
  const { removePayment } = useRevenue();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const handleDelete = async (payment: Payment) => {
    const confirmed = window.confirm(
      `Delete payment of ${formatPaymentCurrency(payment.amount)}?`
    );
    if (!confirmed) return;
    await removePayment(invoiceId, payment.id);
  };

  return (
    <>
      <ResponsiveTableFrame>
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit payment"
                      disabled={!canModify}
                      onClick={() => setEditingPayment(payment)}
                    >
                      <Edit />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="More actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canModify && (
                          <DropdownMenuItem onClick={() => setEditingPayment(payment)}>
                            Edit payment
                          </DropdownMenuItem>
                        )}
                        {canModify && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => void handleDelete(payment)}
                            >
                              <Trash2 />
                              Delete payment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableFrame>

      <RecordPaymentDialog
        open={Boolean(editingPayment)}
        onOpenChange={(open) => {
          if (!open) setEditingPayment(null);
        }}
        invoiceId={invoiceId}
        initialPayment={editingPayment}
      />
    </>
  );
}

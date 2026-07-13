import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { CustomerPaymentHistoryTable } from "@/features/customers/components/CustomerPaymentHistoryTable";
import { getCustomerPaymentHistory } from "@/features/customers/utils/customer-workspace-utils";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerPaymentsTabProps {
  customer: Customer;
}

export function CustomerPaymentsTab({ customer }: CustomerPaymentsTabProps) {
  const { invoices, payments, loading } = useRevenue();

  const paymentHistory = useMemo(
    () => getCustomerPaymentHistory(customer.id, invoices, payments),
    [customer.id, invoices, payments]
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading payments…</p>;
  }

  if (paymentHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Wallet className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">No payment history</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Payment records will be displayed here once recorded.
        </p>
      </div>
    );
  }

  return <CustomerPaymentHistoryTable payments={paymentHistory} />;
}

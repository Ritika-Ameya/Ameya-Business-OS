import { Wallet } from "lucide-react";
import { CustomerPaymentHistoryTable } from "@/components/customers/CustomerPaymentHistoryTable";
import { getCustomerPaymentHistory } from "@/lib/customer-workspace-utils";
import type { Customer } from "@/types/customer";

interface CustomerPaymentsTabProps {
  customer: Customer;
}

export function CustomerPaymentsTab({ customer }: CustomerPaymentsTabProps) {
  const payments = getCustomerPaymentHistory(customer.id);

  if (payments.length === 0) {
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

  return <CustomerPaymentHistoryTable payments={payments} />;
}

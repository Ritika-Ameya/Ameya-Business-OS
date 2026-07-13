import { RefreshCw } from "lucide-react";
import { CustomerRenewalsTable } from "@/features/customers/components/CustomerRenewalsTable";
import { getCustomerRenewals } from "@/features/customers/utils/customer-workspace-utils";
import { useDeals } from "@/features/deals/hooks/use-deals";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerRenewalsTabProps {
  customer: Customer;
}

export function CustomerRenewalsTab({ customer }: CustomerRenewalsTabProps) {
  const { deals } = useDeals();
  const renewals = getCustomerRenewals(customer.id, deals);

  if (renewals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <RefreshCw className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">No renewals available</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Renewal schedules and history will appear here.
        </p>
      </div>
    );
  }

  return <CustomerRenewalsTable renewals={renewals} />;
}

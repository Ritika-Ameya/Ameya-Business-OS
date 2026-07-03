import { Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { DealTable } from "@/components/deals/DealTable";
import { Button } from "@/components/ui/button";
import { seedDeals } from "@/data/seed-deals";
import { getDealsByCustomerId } from "@/lib/deal-utils";
import type { Customer } from "@/types/customer";

interface CustomerDealsTabProps {
  customer: Customer;
}

export function CustomerDealsTab({ customer }: CustomerDealsTabProps) {
  const customerDeals = getDealsByCustomerId(seedDeals, customer.id);
  const createDealPath = `/customers/${customer.id}/deals/new`;

  if (customerDeals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Handshake className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">No Deals Yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first deal to start tracking revenue for this customer.
        </p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link to={createDealPath}>
            <Handshake />
            Create Deal
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="rounded-xl" asChild>
          <Link to={createDealPath}>
            <Handshake />
            Create Deal
          </Link>
        </Button>
      </div>
      <DealTable deals={customerDeals} />
    </div>
  );
}

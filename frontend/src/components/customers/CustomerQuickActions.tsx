import { Handshake, History, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types/customer";

interface CustomerQuickActionsProps {
  customer: Customer;
  onOpenTimeline: () => void;
}

export function CustomerQuickActions({
  customer,
  onOpenTimeline,
}: CustomerQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="rounded-xl" asChild>
        <Link to={`/customers/${customer.id}/deals/new`}>
          <Handshake />
          Create Deal
        </Link>
      </Button>
      <Button variant="outline" className="rounded-xl" asChild>
        <a href={`tel:${customer.phone.replace(/\s/g, "")}`}>
          <Phone />
          Call
        </a>
      </Button>
      {customer.email && (
        <Button variant="outline" className="rounded-xl" asChild>
          <a href={`mailto:${customer.email}`}>
            <Mail />
            Email
          </a>
        </Button>
      )}
      <Button variant="outline" className="rounded-xl" onClick={onOpenTimeline}>
        <History />
        Open Timeline
      </Button>
    </div>
  );
}

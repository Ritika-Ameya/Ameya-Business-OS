import { useMemo } from "react";
import { ActivityTimeline } from "@/shared/components/ActivityTimeline";
import type { ActivityEntry } from "@/shared/types/activity";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerTimelineTabProps {
  customer: Customer;
}

function legacyTimelineToActivities(customer: Customer): ActivityEntry[] {
  return customer.timeline.map((entry) => ({
    id: entry.id,
    entityType: "customer",
    entityId: customer.id,
    customerId: customer.id,
    action: "stage_changed",
    title: `Stage changed to ${entry.stageName}`,
    notes: entry.notes,
    description: entry.nextActionDate
      ? `Follow-up scheduled for ${entry.nextActionDate}`
      : undefined,
    relatedRecord: entry.stageName,
    user: "Abhay",
    timestamp: entry.timestamp,
  }));
}

export function CustomerTimelineTab({ customer }: CustomerTimelineTabProps) {
  const legacyEntries = useMemo(
    () => legacyTimelineToActivities(customer),
    [customer]
  );

  return (
    <ActivityTimeline
      entityType="customer"
      entityId={customer.id}
      additionalEntries={legacyEntries}
      emptyMessage="Stage changes, invoices, payments, and other activity will appear here."
    />
  );
}

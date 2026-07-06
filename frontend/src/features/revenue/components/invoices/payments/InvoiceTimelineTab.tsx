import { ActivityTimeline } from "@/shared/components/ActivityTimeline";

interface InvoiceTimelineTabProps {
  invoiceId: string;
}

export function InvoiceTimelineTab({ invoiceId }: InvoiceTimelineTabProps) {
  return (
    <ActivityTimeline
      entityType="invoice"
      entityId={invoiceId}
      emptyMessage="Payment activity will appear here once recorded."
    />
  );
}

export type ActivityEntityType = "customer" | "deal" | "invoice";

export type ActivityAction =
  | "stage_changed"
  | "notes_added"
  | "follow_up_set"
  | "invoice_generated"
  | "payment_recorded"
  | "renewal_updated"
  | "document_uploaded"
  | "deal_created"
  | "deal_updated"
  | "component_added"
  | "component_updated"
  | "component_removed"
  | "record_created";

export interface ActivityEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  customerId?: string;
  dealId?: string;
  invoiceId?: string;
  action: ActivityAction;
  title: string;
  description?: string;
  notes?: string;
  relatedRecord?: string;
  user: string;
  timestamp: string;
}

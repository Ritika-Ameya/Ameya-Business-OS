import { generateId } from '../../../utils/id.util';
import type { InvoiceTimelineEntry } from '../types/revenue.entities';
import {
  INVOICE_TIMELINE_LABELS,
  type InvoiceTimelineAction,
} from '../types/revenue.entities';

export const createInvoiceTimelineEntry = (input: {
  action: InvoiceTimelineAction;
  stageName?: string;
  notes?: string;
}): InvoiceTimelineEntry => ({
  id: generateId(),
  action: input.action,
  stageName: input.stageName?.trim() || INVOICE_TIMELINE_LABELS[input.action],
  notes: input.notes?.trim() || undefined,
  timestamp: new Date().toISOString(),
});

export const prependInvoiceTimeline = (
  timeline: InvoiceTimelineEntry[],
  entry: InvoiceTimelineEntry,
): InvoiceTimelineEntry[] => [entry, ...timeline];

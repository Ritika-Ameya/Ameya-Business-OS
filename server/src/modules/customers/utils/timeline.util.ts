import { generateId } from '../../../utils/id.util';
import type { CustomerTimelineEntry } from '../types/customer.entities';
import { TIMELINE_ACTION_LABELS, type TimelineAction } from '../types/customer.entities';

export interface CreateTimelineEntryInput {
  action: TimelineAction;
  stageId?: string;
  stageName?: string;
  notes?: string;
  nextActionDate?: string;
  timestamp?: string;
}

/** Reusable timeline entry factory for Customer & future linked modules. */
export const createTimelineEntry = (
  input: CreateTimelineEntryInput,
): CustomerTimelineEntry => ({
  id: generateId(),
  action: input.action,
  stageId: input.stageId,
  stageName: input.stageName?.trim() || TIMELINE_ACTION_LABELS[input.action],
  notes: input.notes?.trim() || undefined,
  nextActionDate: input.nextActionDate || undefined,
  timestamp: input.timestamp ?? new Date().toISOString(),
});

export const prependTimelineEntry = (
  timeline: CustomerTimelineEntry[],
  entry: CustomerTimelineEntry,
): CustomerTimelineEntry[] => [entry, ...timeline];

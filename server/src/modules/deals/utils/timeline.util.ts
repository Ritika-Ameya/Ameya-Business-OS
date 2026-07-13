import { generateId } from '../../../utils/id.util';
import type { DealTimelineEntry } from '../types/deal.entities';
import {
  DEAL_TIMELINE_ACTION_LABELS,
  type DealTimelineAction,
} from '../types/deal.entities';

export interface CreateDealTimelineEntryInput {
  action: DealTimelineAction;
  stageId?: string;
  stageName?: string;
  notes?: string;
  nextActionDate?: string;
  timestamp?: string;
}

export const createDealTimelineEntry = (
  input: CreateDealTimelineEntryInput,
): DealTimelineEntry => ({
  id: generateId(),
  action: input.action,
  stageId: input.stageId,
  stageName: input.stageName?.trim() || DEAL_TIMELINE_ACTION_LABELS[input.action],
  notes: input.notes?.trim() || undefined,
  nextActionDate: input.nextActionDate || undefined,
  timestamp: input.timestamp ?? new Date().toISOString(),
});

export const prependDealTimelineEntry = (
  timeline: DealTimelineEntry[],
  entry: DealTimelineEntry,
): DealTimelineEntry[] => [entry, ...timeline];

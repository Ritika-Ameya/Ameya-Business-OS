import type { RecordType } from "@/features/customers/types/customer";
import type {
  SettingsStage,
  StageApplicableFor,
  StageReminderOffset,
} from "@/features/settings/types/settings";

export const stageApplicableForLabels: Record<StageApplicableFor, string> = {
  opportunity: "Opportunity",
  customer: "Customer",
  both: "Both",
};

export const stageReminderOffsetLabels: Record<StageReminderOffset, string> = {
  "same-day": "Same Day",
  "1-day-before": "1 Day Before",
  "3-days-before": "3 Days Before",
  "7-days-before": "7 Days Before",
};

export const stageColorOptions = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#f97316", label: "Orange" },
  { value: "#10b981", label: "Emerald" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#22c55e", label: "Green" },
  { value: "#ef4444", label: "Red" },
  { value: "#64748b", label: "Slate" },
];

export const recordTypeLabels: Record<RecordType, string> = {
  opportunity: "Opportunity",
  customer: "Customer",
};

export function getActiveStages(stages: SettingsStage[]): SettingsStage[] {
  return stages
    .filter((stage) => stage.status === "active")
    .sort((a, b) => a.sequence - b.sequence);
}

export function getStageById(
  stages: SettingsStage[],
  stageId?: string
): SettingsStage | undefined {
  if (!stageId) return undefined;
  return stages.find((stage) => stage.id === stageId);
}

export function isStageApplicableForRecordType(
  stage: SettingsStage,
  recordType: RecordType
): boolean {
  if (stage.applicableFor === "both") return true;
  return stage.applicableFor === recordType;
}

export function getStagesForRecordType(
  stages: SettingsStage[],
  recordType: RecordType
): SettingsStage[] {
  return getActiveStages(stages).filter((stage) =>
    isStageApplicableForRecordType(stage, recordType)
  );
}

export function getDefaultStageForRecordType(
  stages: SettingsStage[],
  recordType: RecordType
): SettingsStage | undefined {
  return getStagesForRecordType(stages, recordType)[0];
}

export function stageRepresentsCustomer(stage: SettingsStage): boolean {
  return stage.applicableFor === "customer";
}

export function resolveRecordTypeFromStage(
  currentRecordType: RecordType,
  stage: SettingsStage
): RecordType {
  if (stageRepresentsCustomer(stage)) {
    return "customer";
  }
  return currentRecordType;
}

export function getReminderOffsetDays(offset: StageReminderOffset): number {
  switch (offset) {
    case "same-day":
      return 0;
    case "1-day-before":
      return 1;
    case "3-days-before":
      return 3;
    case "7-days-before":
      return 7;
  }
}

export function getReminderDate(
  nextActionDate: string,
  offset: StageReminderOffset
): string {
  const date = new Date(nextActionDate);
  date.setDate(date.getDate() - getReminderOffsetDays(offset));
  return date.toISOString().split("T")[0];
}

export function toDateOnly(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function getStageColorStyle(color: string): {
  backgroundColor: string;
  color: string;
} {
  return { backgroundColor: `${color}1a`, color };
}

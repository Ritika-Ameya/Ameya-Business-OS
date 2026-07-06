import type { ActivityEntry, ActivityEntityType } from "@/shared/types/activity";

const STORAGE_KEY = "ameya-activities";
const PLACEHOLDER_USER = "Abhay";

const activityListeners = new Set<() => void>();

export function subscribeActivities(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

function notifyActivityListeners() {
  activityListeners.forEach((listener) => listener());
}

function loadActivities(): ActivityEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ActivityEntry[];
  } catch {
    // fall through
  }
  return [];
}

function persistActivities(activities: ActivityEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

export function getAllActivities(): ActivityEntry[] {
  return loadActivities();
}

export function getRecentActivities(limit = 10): ActivityEntry[] {
  return [...loadActivities()]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getActivitiesForCustomer(customerId: string): ActivityEntry[] {
  return loadActivities()
    .filter(
      (entry) =>
        entry.customerId === customerId ||
        (entry.entityType === "customer" && entry.entityId === customerId)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getActivitiesForDeal(dealId: string): ActivityEntry[] {
  return loadActivities()
    .filter(
      (entry) =>
        entry.dealId === dealId ||
        (entry.entityType === "deal" && entry.entityId === dealId)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getActivitiesForInvoice(invoiceId: string): ActivityEntry[] {
  return loadActivities()
    .filter(
      (entry) =>
        entry.invoiceId === invoiceId ||
        (entry.entityType === "invoice" && entry.entityId === invoiceId)
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getActivitiesForEntity(
  entityType: ActivityEntityType,
  entityId: string
): ActivityEntry[] {
  if (entityType === "customer") return getActivitiesForCustomer(entityId);
  if (entityType === "deal") return getActivitiesForDeal(entityId);
  return getActivitiesForInvoice(entityId);
}

interface AddActivityInput {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityEntry["action"];
  title: string;
  description?: string;
  notes?: string;
  relatedRecord?: string;
  customerId?: string;
  dealId?: string;
  invoiceId?: string;
  user?: string;
}

export function addActivity(input: AddActivityInput): ActivityEntry {
  const entry: ActivityEntry = {
    id: `act-${crypto.randomUUID().slice(0, 8)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    customerId: input.customerId,
    dealId: input.dealId,
    invoiceId: input.invoiceId,
    action: input.action,
    title: input.title,
    description: input.description,
    notes: input.notes,
    relatedRecord: input.relatedRecord,
    user: input.user ?? PLACEHOLDER_USER,
    timestamp: new Date().toISOString(),
  };

  const next = [entry, ...loadActivities()];
  persistActivities(next);
  notifyActivityListeners();
  return entry;
}

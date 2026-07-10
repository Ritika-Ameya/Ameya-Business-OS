import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedDealComponents } from "@/features/deals/data/seed-deal-components";
import { seedDeals } from "@/features/deals/data/seed-deals";
import { seedSettingsStages } from "@/features/settings/data/seed-settings";
import {
  getDefaultStageForRecordType,
  getStageById,
} from "@/features/customers/utils/stage-utils";
import { computeNextRenewal } from "@/features/deals/utils/deal-utils";
import { addActivity } from "@/shared/utils/activity-store";
import type { RecordType } from "@/features/customers/types/customer";
import type { Deal, DealFormData, DealTimelineEntry } from "@/features/deals/types/deal";
import type { ComponentFormData, DealComponent } from "@/features/deals/types/deal-component";
import type { SettingsStage } from "@/features/settings/types/settings";

const DEALS_KEY = "ameya-deals";
const COMPONENTS_KEY = "ameya-deal-components";

interface CreateDealInput extends DealFormData {
  customerId: string;
  customerName: string;
  customerRecordType?: RecordType;
}

export interface DealStageChangePayload {
  stageId: string;
  nextActionDate?: string;
  notes?: string;
}

interface DealsContextValue {
  deals: Deal[];
  components: DealComponent[];
  addDeal: (input: CreateDealInput, stages?: SettingsStage[]) => Deal;
  updateDeal: (id: string, data: DealFormData) => void;
  updateDealNotes: (id: string, notes: string) => void;
  deleteDeal: (id: string) => void;
  getDeal: (id: string) => Deal | undefined;
  changeDealStage: (
    id: string,
    payload: DealStageChangePayload,
    stages: SettingsStage[]
  ) => void;
  addComponent: (dealId: string, data: ComponentFormData) => DealComponent;
  updateComponent: (componentId: string, data: ComponentFormData) => void;
  removeComponent: (componentId: string) => void;
  duplicateComponent: (componentId: string) => DealComponent | undefined;
  getComponentsByDeal: (dealId: string) => DealComponent[];
}

const DealsContext = createContext<DealsContextValue | null>(null);

export { DealsContext };

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // fall through
  }
  return fallback;
}

function persistJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeDeal(deal: Deal, stages = seedSettingsStages): Deal {
  const defaultStage = getDefaultStageForRecordType(stages, "customer");

  return {
    ...deal,
    timeline: deal.timeline ?? [],
    currentStageId: deal.currentStageId ?? defaultStage?.id,
  };
}

function formToComponent(
  dealId: string,
  data: ComponentFormData
): Omit<DealComponent, "id"> {
  return {
    dealId,
    name: data.name.trim(),
    category: data.category.trim(),
    description: data.description.trim(),
    amount: parseAmount(data.amount),
    quantity: Number.parseInt(data.quantity, 10) || 1,
    gstPercent: parseAmount(data.gstPercent) || undefined,
    discount: parseAmount(data.discount) || undefined,
    billingType: data.billingType,
    status: data.status,
    renewalDate: data.renewalApplicable ? data.renewalDate || undefined : undefined,
  };
}

function createTimelineEntry(
  stage: SettingsStage,
  notes?: string,
  nextActionDate?: string
): DealTimelineEntry {
  return {
    id: `dtl-${crypto.randomUUID().slice(0, 8)}`,
    stageId: stage.id,
    stageName: stage.name,
    notes: notes?.trim() || undefined,
    nextActionDate,
    timestamp: new Date().toISOString(),
  };
}

function syncDealComponentCount(deals: Deal[], components: DealComponent[]): Deal[] {
  return deals.map((deal) => ({
    ...deal,
    componentsCount: components.filter((component) => component.dealId === deal.id).length,
  }));
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<DealComponent[]>(() =>
    loadJson(COMPONENTS_KEY, seedDealComponents)
  );
  const [deals, setDeals] = useState<Deal[]>(() => {
    const loaded = loadJson(DEALS_KEY, seedDeals).map((deal) => normalizeDeal(deal));
    const loadedComponents = loadJson(COMPONENTS_KEY, seedDealComponents);
    return syncDealComponentCount(loaded, loadedComponents);
  });

  const persistComponents = useCallback(
    (next: DealComponent[]) => {
      setComponents(next);
      persistJson(COMPONENTS_KEY, next);
      setDeals((prev) => {
        const synced = syncDealComponentCount(prev, next);
        persistJson(DEALS_KEY, synced);
        return synced;
      });
    },
    []
  );

  const addDeal = useCallback(
    (input: CreateDealInput, stages: SettingsStage[] = seedSettingsStages): Deal => {
      const contractValue = Number.parseFloat(input.contractValue.replace(/,/g, ""));
      const recordType = input.customerRecordType ?? "customer";
      const defaultStage = getDefaultStageForRecordType(stages, recordType);

      const deal: Deal = {
        id: `deal-${crypto.randomUUID().slice(0, 8)}`,
        title: input.title.trim(),
        customerId: input.customerId,
        customerName: input.customerName,
        status: "draft",
        startDate: input.startDate,
        nextRenewal: computeNextRenewal(
          input.startDate,
          input.renewalFrequency as NonNullable<Deal["renewalFrequency"]>
        ),
        currentStageId: defaultStage?.id,
        timeline: defaultStage ? [createTimelineEntry(defaultStage)] : [],
        componentsCount: 0,
        dealType: input.dealType as NonNullable<Deal["dealType"]>,
        contractValue,
        renewalFrequency: input.renewalFrequency as NonNullable<Deal["renewalFrequency"]>,
        description: input.description.trim() || undefined,
      };

      setDeals((prev) => {
        const next = [deal, ...prev];
        persistJson(DEALS_KEY, next);
        return next;
      });

      addActivity({
        entityType: "deal",
        entityId: deal.id,
        action: "deal_created",
        title: "Deal created",
        description: deal.title,
        customerId: deal.customerId,
        dealId: deal.id,
      });

      addActivity({
        entityType: "customer",
        entityId: deal.customerId,
        action: "deal_created",
        title: "Deal created",
        description: deal.title,
        relatedRecord: deal.title,
        customerId: deal.customerId,
        dealId: deal.id,
      });

      return deal;
    },
    []
  );

  const updateDeal = useCallback((id: string, data: DealFormData) => {
    const contractValue = Number.parseFloat(data.contractValue.replace(/,/g, ""));

    setDeals((prev) => {
      const next = prev.map((deal) =>
        deal.id === id
          ? {
              ...deal,
              title: data.title.trim(),
              dealType: data.dealType as NonNullable<Deal["dealType"]>,
              contractValue,
              startDate: data.startDate,
              nextRenewal: computeNextRenewal(
                data.startDate,
                data.renewalFrequency as NonNullable<Deal["renewalFrequency"]>
              ),
              renewalFrequency: data.renewalFrequency as NonNullable<Deal["renewalFrequency"]>,
              description: data.description.trim() || undefined,
            }
          : deal
      );
      persistJson(DEALS_KEY, next);
      return next;
    });

    const deal = deals.find((item) => item.id === id);
    if (deal) {
      addActivity({
        entityType: "deal",
        entityId: id,
        action: "deal_updated",
        title: "Deal updated",
        description: data.title.trim(),
        customerId: deal.customerId,
        dealId: id,
      });
    }
  }, [deals]);

  const updateDealNotes = useCallback((id: string, notes: string) => {
    setDeals((prev) => {
      const next = prev.map((deal) =>
        deal.id === id ? { ...deal, notes: notes.trim() || undefined } : deal
      );
      persistJson(DEALS_KEY, next);
      return next;
    });

    const deal = deals.find((item) => item.id === id);
    if (deal && notes.trim()) {
      addActivity({
        entityType: "deal",
        entityId: id,
        action: "notes_added",
        title: "Notes updated",
        notes: notes.trim(),
        customerId: deal.customerId,
        dealId: id,
      });
    }
  }, [deals]);

  const deleteDeal = useCallback((id: string) => {
    setDeals((prev) => {
      const next = prev.filter((deal) => deal.id !== id);
      persistJson(DEALS_KEY, next);
      return next;
    });
    persistComponents(components.filter((component) => component.dealId !== id));
  }, [components, persistComponents]);

  const changeDealStage = useCallback(
    (id: string, payload: DealStageChangePayload, stages: SettingsStage[]) => {
      const stage = getStageById(stages, payload.stageId);
      if (!stage) return;

      setDeals((prev) => {
        const next = prev.map((deal) => {
          if (deal.id !== id) return deal;

          const timelineEntry = createTimelineEntry(
            stage,
            payload.notes,
            payload.nextActionDate
          );

          return {
            ...deal,
            currentStageId: stage.id,
            nextActionDate:
              payload.nextActionDate !== undefined
                ? payload.nextActionDate
                : deal.nextActionDate,
            timeline: [timelineEntry, ...deal.timeline],
          };
        });
        persistJson(DEALS_KEY, next);
        return next;
      });

      const deal = deals.find((item) => item.id === id);
      if (deal) {
        addActivity({
          entityType: "deal",
          entityId: id,
          action: "stage_changed",
          title: `Stage changed to ${stage.name}`,
          notes: payload.notes,
          relatedRecord: stage.name,
          customerId: deal.customerId,
          dealId: id,
        });

        if (payload.nextActionDate) {
          addActivity({
            entityType: "deal",
            entityId: id,
            action: "follow_up_set",
            title: "Follow-up date set",
            description: payload.nextActionDate,
            customerId: deal.customerId,
            dealId: id,
          });
        }
      }
    },
    [deals]
  );

  const addComponent = useCallback(
    (dealId: string, data: ComponentFormData): DealComponent => {
      const component: DealComponent = {
        id: `comp-${crypto.randomUUID().slice(0, 8)}`,
        ...formToComponent(dealId, data),
      };

      const next = [component, ...components];
      persistComponents(next);

      const deal = deals.find((item) => item.id === dealId);
      if (deal) {
        addActivity({
          entityType: "deal",
          entityId: dealId,
          action: "component_added",
          title: "Component added",
          description: component.name,
          relatedRecord: component.name,
          customerId: deal.customerId,
          dealId,
        });
      }

      return component;
    },
    [components, deals, persistComponents]
  );

  const updateComponent = useCallback(
    (componentId: string, data: ComponentFormData) => {
      const existing = components.find((item) => item.id === componentId);
      if (!existing) return;

      const next = components.map((component) =>
        component.id === componentId
          ? { ...component, ...formToComponent(existing.dealId, data) }
          : component
      );
      persistComponents(next);

      const deal = deals.find((item) => item.id === existing.dealId);
      if (deal) {
        addActivity({
          entityType: "deal",
          entityId: existing.dealId,
          action: "component_updated",
          title: "Component updated",
          description: data.name.trim(),
          relatedRecord: data.name.trim(),
          customerId: deal.customerId,
          dealId: existing.dealId,
        });
      }
    },
    [components, deals, persistComponents]
  );

  const removeComponent = useCallback(
    (componentId: string) => {
      const existing = components.find((item) => item.id === componentId);
      if (!existing) return;

      persistComponents(components.filter((component) => component.id !== componentId));

      const deal = deals.find((item) => item.id === existing.dealId);
      if (deal) {
        addActivity({
          entityType: "deal",
          entityId: existing.dealId,
          action: "component_removed",
          title: "Component removed",
          description: existing.name,
          relatedRecord: existing.name,
          customerId: deal.customerId,
          dealId: existing.dealId,
        });
      }
    },
    [components, deals, persistComponents]
  );

  const duplicateComponent = useCallback(
    (componentId: string): DealComponent | undefined => {
      const existing = components.find((item) => item.id === componentId);
      if (!existing) return undefined;

      const duplicate: DealComponent = {
        ...existing,
        id: `comp-${crypto.randomUUID().slice(0, 8)}`,
        name: `${existing.name} (Copy)`,
      };

      persistComponents([duplicate, ...components]);

      const deal = deals.find((item) => item.id === existing.dealId);
      if (deal) {
        addActivity({
          entityType: "deal",
          entityId: existing.dealId,
          action: "component_added",
          title: "Component duplicated",
          description: duplicate.name,
          relatedRecord: duplicate.name,
          customerId: deal.customerId,
          dealId: existing.dealId,
        });
      }

      return duplicate;
    },
    [components, deals, persistComponents]
  );

  const getDeal = useCallback(
    (id: string) => deals.find((deal) => deal.id === id),
    [deals]
  );

  const getComponentsByDeal = useCallback(
    (dealId: string) => components.filter((component) => component.dealId === dealId),
    [components]
  );

  const value = useMemo(
    () => ({
      deals,
      components,
      addDeal,
      updateDeal,
      updateDealNotes,
      deleteDeal,
      getDeal,
      changeDealStage,
      addComponent,
      updateComponent,
      removeComponent,
      duplicateComponent,
      getComponentsByDeal,
    }),
    [
      deals,
      components,
      addDeal,
      updateDeal,
      updateDealNotes,
      deleteDeal,
      getDeal,
      changeDealStage,
      addComponent,
      updateComponent,
      removeComponent,
      duplicateComponent,
      getComponentsByDeal,
    ]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dealsApi } from "@/features/deals/api/deals.api";
import {
  mapComponentFormToBody,
  mapComponentFromDto,
  mapDealFromDto,
  mapFormToCreateBody,
} from "@/features/deals/api/deal.mappers";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { RecordType } from "@/features/customers/types/customer";
import type { Deal, DealFormData } from "@/features/deals/types/deal";
import type { ComponentFormData, DealComponent } from "@/features/deals/types/deal-component";
import type { SettingsStage } from "@/features/settings/types/settings";

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
  loading: boolean;
  error: string | null;
  refreshDeals: () => Promise<void>;
  loadComponentsForDeal: (dealId: string) => Promise<DealComponent[]>;
  addDeal: (input: CreateDealInput, stages?: SettingsStage[]) => Promise<Deal>;
  getDeal: (id: string) => Deal | undefined;
  changeDealStage: (
    id: string,
    payload: DealStageChangePayload,
    stages: SettingsStage[]
  ) => Promise<void>;
  updateDealFollowUp: (
    id: string,
    data: { nextActionDate: string; notes?: string }
  ) => Promise<void>;
  updateDeal: (id: string, data: DealFormData) => Promise<Deal>;
  removeDeal: (id: string) => Promise<void>;
  addComponent: (dealId: string, data: ComponentFormData) => Promise<DealComponent>;
  updateComponent: (
    dealId: string,
    componentId: string,
    data: ComponentFormData
  ) => Promise<DealComponent>;
  undoComponentRenewal: (dealId: string, componentId: string) => Promise<DealComponent>;
  removeComponent: (dealId: string, componentId: string) => Promise<void>;
  getComponentsByDeal: (dealId: string) => DealComponent[];
}

const DealsContext = createContext<DealsContextValue | null>(null);

export { DealsContext };

function upsertDeal(list: Deal[], deal: Deal): Deal[] {
  const index = list.findIndex((item) => item.id === deal.id);
  if (index === -1) return [deal, ...list];
  const next = [...list];
  next[index] = deal;
  return next;
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [components, setComponents] = useState<DealComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealItems, componentItems] = await Promise.all([
        dealsApi.list(),
        dealsApi.listAllComponents(),
      ]);
      setDeals(dealItems.map(mapDealFromDto));
      setComponents(componentItems.map(mapComponentFromDto));
    } catch (err) {
      setError(getErrorMessage(err));
      setDeals([]);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComponentsForDeal = useCallback(async (dealId: string) => {
    const items = await dealsApi.listComponents(dealId);
    const mapped = items.map(mapComponentFromDto);
    setComponents((prev) => {
      const others = prev.filter((component) => component.dealId !== dealId);
      return [...mapped, ...others];
    });
    return mapped;
  }, []);

  useEffect(() => {
    // Initial load from backend on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshDeals();
  }, [refreshDeals]);

  const addDeal = useCallback(
    async (input: CreateDealInput, _stages?: SettingsStage[]): Promise<Deal> => {
      void _stages;
      const created = await dealsApi.create(mapFormToCreateBody(input));
      const deal = mapDealFromDto(created);
      setDeals((prev) => [deal, ...prev]);
      return deal;
    },
    []
  );

  const changeDealStage = useCallback(
    async (id: string, payload: DealStageChangePayload, _stages: SettingsStage[]) => {
      void _stages;
      const updated = await dealsApi.changeStage(id, payload);
      setDeals((prev) => upsertDeal(prev, mapDealFromDto(updated)));
    },
    []
  );

  const updateDealFollowUp = useCallback(
    async (id: string, data: { nextActionDate: string; notes?: string }) => {
      const notes =
        data.notes?.trim() ||
        `Follow-up date updated to ${data.nextActionDate}`;
      const updated = await dealsApi.addTimelineNote(id, {
        notes,
        nextActionDate: data.nextActionDate,
      });
      setDeals((prev) => upsertDeal(prev, mapDealFromDto(updated)));
    },
    []
  );

  const addComponent = useCallback(
    async (dealId: string, data: ComponentFormData): Promise<DealComponent> => {
      const result = await dealsApi.addComponent(dealId, mapComponentFormToBody(data));
      const component = mapComponentFromDto(result.component);
      setComponents((prev) => [component, ...prev]);
      setDeals((prev) => upsertDeal(prev, mapDealFromDto(result.deal)));
      return component;
    },
    []
  );

  const updateDeal = useCallback(async (id: string, data: DealFormData): Promise<Deal> => {
    const updated = await dealsApi.update(id, {
      title: data.title.trim(),
      dealType: data.dealType,
      contractValue: Number.parseFloat(data.contractValue.replace(/,/g, "")) || 0,
      startDate: data.startDate,
      description: data.description.trim(),
    });
    const deal = mapDealFromDto(updated);
    setDeals((prev) => upsertDeal(prev, deal));
    return deal;
  }, []);

  const removeDeal = useCallback(async (id: string) => {
    await dealsApi.remove(id);
    setDeals((prev) => prev.filter((deal) => deal.id !== id));
    setComponents((prev) => prev.filter((component) => component.dealId !== id));
  }, []);

  const updateComponent = useCallback(
    async (
      dealId: string,
      componentId: string,
      data: ComponentFormData
    ): Promise<DealComponent> => {
      const updated = await dealsApi.updateComponent(
        dealId,
        componentId,
        mapComponentFormToBody(data)
      );
      const component = mapComponentFromDto(updated);
      setComponents((prev) => {
        const index = prev.findIndex((item) => item.id === componentId);
        if (index === -1) return [component, ...prev];
        const next = [...prev];
        next[index] = component;
        return next;
      });
      return component;
    },
    []
  );

  const undoComponentRenewal = useCallback(
    async (dealId: string, componentId: string): Promise<DealComponent> => {
      const updated = await dealsApi.undoComponentRenewal(dealId, componentId);
      const component = mapComponentFromDto(updated);
      setComponents((prev) => {
        const index = prev.findIndex((item) => item.id === componentId);
        if (index === -1) return [component, ...prev];
        const next = [...prev];
        next[index] = component;
        return next;
      });
      return component;
    },
    []
  );

  const removeComponent = useCallback(async (dealId: string, componentId: string) => {
    const deal = await dealsApi.removeComponent(dealId, componentId);
    setComponents((prev) => prev.filter((component) => component.id !== componentId));
    setDeals((prev) => upsertDeal(prev, mapDealFromDto(deal)));
  }, []);

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
      loading,
      error,
      refreshDeals,
      loadComponentsForDeal,
      addDeal,
      updateDeal,
      removeDeal,
      getDeal,
      changeDealStage,
      updateDealFollowUp,
      addComponent,
      updateComponent,
      undoComponentRenewal,
      removeComponent,
      getComponentsByDeal,
    }),
    [
      deals,
      components,
      loading,
      error,
      refreshDeals,
      loadComponentsForDeal,
      addDeal,
      updateDeal,
      removeDeal,
      getDeal,
      changeDealStage,
      updateDealFollowUp,
      addComponent,
      updateComponent,
      undoComponentRenewal,
      removeComponent,
      getComponentsByDeal,
    ]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

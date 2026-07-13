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
  addComponent: (dealId: string, data: ComponentFormData) => Promise<DealComponent>;
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
      const items = await dealsApi.list();
      setDeals(items.map(mapDealFromDto));
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
      getDeal,
      changeDealStage,
      addComponent,
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
      getDeal,
      changeDealStage,
      addComponent,
      getComponentsByDeal,
    ]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

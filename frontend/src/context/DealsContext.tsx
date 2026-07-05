import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedDealComponents } from "@/data/seed-deal-components";
import { seedDeals } from "@/data/seed-deals";
import { computeNextRenewal } from "@/lib/deal-utils";
import type { Deal, DealFormData } from "@/types/deal";
import type { ComponentFormData, DealComponent } from "@/types/deal-component";

const DEALS_KEY = "ameya-deals";
const COMPONENTS_KEY = "ameya-deal-components";

interface CreateDealInput extends DealFormData {
  customerId: string;
  customerName: string;
}

interface DealsContextValue {
  deals: Deal[];
  components: DealComponent[];
  addDeal: (input: CreateDealInput) => Deal;
  getDeal: (id: string) => Deal | undefined;
  addComponent: (dealId: string, data: ComponentFormData) => DealComponent;
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
    billingType: data.billingType,
    status: data.status,
    renewalDate: data.renewalApplicable ? data.renewalDate || undefined : undefined,
  };
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(() => loadJson(DEALS_KEY, seedDeals));
  const [components, setComponents] = useState<DealComponent[]>(() =>
    loadJson(COMPONENTS_KEY, seedDealComponents)
  );

  const addDeal = useCallback((input: CreateDealInput): Deal => {
    const contractValue = Number.parseFloat(input.contractValue.replace(/,/g, ""));

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

    return deal;
  }, []);

  const addComponent = useCallback(
    (dealId: string, data: ComponentFormData): DealComponent => {
      const component: DealComponent = {
        id: `comp-${crypto.randomUUID().slice(0, 8)}`,
        ...formToComponent(dealId, data),
      };

      setComponents((prev) => {
        const next = [component, ...prev];
        persistJson(COMPONENTS_KEY, next);
        return next;
      });

      setDeals((prev) => {
        const next = prev.map((deal) =>
          deal.id === dealId
            ? { ...deal, componentsCount: deal.componentsCount + 1 }
            : deal
        );
        persistJson(DEALS_KEY, next);
        return next;
      });

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
      addDeal,
      getDeal,
      addComponent,
      getComponentsByDeal,
    }),
    [deals, components, addDeal, getDeal, addComponent, getComponentsByDeal]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

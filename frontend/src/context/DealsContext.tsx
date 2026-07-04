import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedDeals } from "@/data/seed-deals";
import { computeNextRenewal } from "@/lib/deal-utils";
import type { Deal, DealFormData } from "@/types/deal";

const STORAGE_KEY = "ameya-deals";

interface CreateDealInput extends DealFormData {
  customerId: string;
  customerName: string;
}

interface DealsContextValue {
  deals: Deal[];
  addDeal: (input: CreateDealInput) => Deal;
  getDeal: (id: string) => Deal | undefined;
}

const DealsContext = createContext<DealsContextValue | null>(null);

export { DealsContext };

function loadDeals(): Deal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Deal[];
    }
  } catch {
    // fall through to seed data
  }
  return seedDeals;
}

function persistDeals(deals: Deal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(loadDeals);

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
      persistDeals(next);
      return next;
    });

    return deal;
  }, []);

  const getDeal = useCallback(
    (id: string) => deals.find((deal) => deal.id === id),
    [deals]
  );

  const value = useMemo(
    () => ({ deals, addDeal, getDeal }),
    [deals, addDeal, getDeal]
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

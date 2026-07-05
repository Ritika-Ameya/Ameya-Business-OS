import type { Customer } from "@/features/customers/types/customer";
import type { Deal } from "@/features/deals/types/deal";
import type { SettingsStage } from "@/features/settings/types/settings";
import { getReminderDate, getStageById, toDateOnly } from "@/features/customers/utils/stage-utils";

export type FollowUpEntityType = "customer" | "deal";

export interface FollowUpItem {
  id: string;
  entityType: FollowUpEntityType;
  customerId: string;
  dealId?: string;
  company: string;
  contactPerson: string;
  dealTitle?: string;
  currentStage: string;
  nextActionDate: string;
}

function buildCustomerFollowUpItem(
  customer: Customer,
  stages: SettingsStage[]
): FollowUpItem | null {
  if (!customer.nextActionDate) return null;

  const stage = getStageById(stages, customer.currentStageId);
  if (!stage) return null;

  return {
    id: `customer-${customer.id}`,
    entityType: "customer",
    customerId: customer.id,
    company: customer.company || "—",
    contactPerson: customer.name,
    currentStage: stage.name,
    nextActionDate: customer.nextActionDate,
  };
}

function buildDealFollowUpItem(
  deal: Deal,
  customer: Customer | undefined,
  stages: SettingsStage[]
): FollowUpItem | null {
  if (!deal.nextActionDate) return null;

  const stage = getStageById(stages, deal.currentStageId);
  if (!stage) return null;

  return {
    id: `deal-${deal.id}`,
    entityType: "deal",
    customerId: deal.customerId,
    dealId: deal.id,
    company: customer?.company || deal.customerName,
    contactPerson: customer?.name || deal.customerName,
    dealTitle: deal.title,
    currentStage: stage.name,
    nextActionDate: deal.nextActionDate,
  };
}

function getReminderDateForRecord(
  nextActionDate: string | undefined,
  currentStageId: string | undefined,
  stages: SettingsStage[]
): string | null {
  if (!nextActionDate) return null;

  const stage = getStageById(stages, currentStageId);
  if (!stage) return null;

  return getReminderDate(nextActionDate, stage.reminderOffset);
}

function mergeFollowUpItems(items: FollowUpItem[]): FollowUpItem[] {
  return items.sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));
}

export function getTodaysFollowUps(
  customers: Customer[],
  deals: Deal[],
  stages: SettingsStage[]
): FollowUpItem[] {
  const today = toDateOnly();

  const customerItems = customers
    .map((customer) => {
      const reminderDate = getReminderDateForRecord(
        customer.nextActionDate,
        customer.currentStageId,
        stages
      );
      if (reminderDate !== today) return null;
      return buildCustomerFollowUpItem(customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  const dealItems = deals
    .map((deal) => {
      const reminderDate = getReminderDateForRecord(
        deal.nextActionDate,
        deal.currentStageId,
        stages
      );
      if (reminderDate !== today) return null;
      const customer = customers.find((c) => c.id === deal.customerId);
      return buildDealFollowUpItem(deal, customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  return mergeFollowUpItems([...customerItems, ...dealItems]);
}

export function getTomorrowsFollowUps(
  customers: Customer[],
  deals: Deal[],
  stages: SettingsStage[]
): FollowUpItem[] {
  const tomorrow = toDateOnly(new Date(Date.now() + 86400000));

  const customerItems = customers
    .map((customer) => {
      const reminderDate = getReminderDateForRecord(
        customer.nextActionDate,
        customer.currentStageId,
        stages
      );
      if (reminderDate !== tomorrow) return null;
      return buildCustomerFollowUpItem(customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  const dealItems = deals
    .map((deal) => {
      const reminderDate = getReminderDateForRecord(
        deal.nextActionDate,
        deal.currentStageId,
        stages
      );
      if (reminderDate !== tomorrow) return null;
      const customer = customers.find((c) => c.id === deal.customerId);
      return buildDealFollowUpItem(deal, customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  return mergeFollowUpItems([...customerItems, ...dealItems]);
}

export function getOverdueFollowUps(
  customers: Customer[],
  deals: Deal[],
  stages: SettingsStage[]
): FollowUpItem[] {
  const today = toDateOnly();

  const customerItems = customers
    .map((customer) => {
      if (!customer.nextActionDate || customer.nextActionDate >= today) return null;
      return buildCustomerFollowUpItem(customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  const dealItems = deals
    .map((deal) => {
      if (!deal.nextActionDate || deal.nextActionDate >= today) return null;
      const customer = customers.find((c) => c.id === deal.customerId);
      return buildDealFollowUpItem(deal, customer, stages);
    })
    .filter((item): item is FollowUpItem => item !== null);

  return mergeFollowUpItems([...customerItems, ...dealItems]);
}

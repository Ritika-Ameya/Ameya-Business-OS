import { BaseService } from '../../../services/base.service';
import { formatCurrency } from '../../../utils/number.util';
import { customerRepository } from '../../customers';
import type { CustomerEntity } from '../../customers/types/customer.entities';
import { dealRepository } from '../../deals';
import type { DealEntity } from '../../deals/types/deal.entities';
import { expenseRepository } from '../../expenses';
import { roundMoney } from '../../expenses/utils/expenseCalculation.util';
import type { StageMasterEntity } from '../../masters/types/master.entities';
import { stageMasterRepository } from '../../masters/services/master.services';
import { invoiceRepository, paymentRepository } from '../../revenue';
import type { InvoiceEntity } from '../../revenue/types/revenue.entities';
import type {
  DashboardSummary,
  FollowUpItem,
} from '../types/analytics.types';
import { buildRecentActivity } from '../utils/activityAggregation.util';
import {
  buildRevenueExpenseChart,
  getDashboardExpenseStats,
} from '../utils/chartAggregation.util';
import {
  getCollectionInvoices,
  getPendingCollectionsTopN,
} from '../utils/collectionAggregation.util';
import { addLocalDays, isInCalendarMonth, toLocalDateOnly } from '../utils/dateRange.util';
import { loadCompanyRenewals } from '../utils/renewalAggregation.util';
import { buildUpcomingRevenue } from '../utils/upcomingRevenueAggregation.util';

/** Bucket by the actual next-action date so tomorrow never appears under today. */
const getActionDateKey = (nextActionDate: string): string =>
  nextActionDate.trim().slice(0, 10);

const resolveStageName = (
  stageId: string,
  stagesById: Map<string, StageMasterEntity>,
): string => stagesById.get(stageId)?.name || stageId || '—';

const buildCustomerFollowUp = (
  customer: CustomerEntity,
  stagesById: Map<string, StageMasterEntity>,
): FollowUpItem | null => {
  if (!customer.nextActionDate) return null;
  return {
    id: `customer-${customer.id}`,
    entityType: 'customer',
    customerId: customer.id,
    company: customer.companyName || '—',
    contactPerson: customer.contactPerson || customer.companyName,
    currentStage: resolveStageName(customer.currentStageId, stagesById),
    nextActionDate: customer.nextActionDate,
  };
};

const buildDealFollowUp = (
  deal: DealEntity,
  customer: CustomerEntity | undefined,
  stagesById: Map<string, StageMasterEntity>,
): FollowUpItem | null => {
  if (!deal.nextActionDate) return null;
  return {
    id: `deal-${deal.id}`,
    entityType: 'deal',
    customerId: deal.customerId,
    dealId: deal.id,
    company: customer?.companyName || deal.customerName || '—',
    contactPerson: customer?.contactPerson || deal.customerName,
    dealTitle: deal.title,
    currentStage: resolveStageName(deal.currentStageId, stagesById),
    nextActionDate: deal.nextActionDate,
  };
};

const sortFollowUps = (items: FollowUpItem[]): FollowUpItem[] =>
  items.sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));

const buildFollowUps = (
  customers: CustomerEntity[],
  deals: DealEntity[],
  stages: StageMasterEntity[],
): DashboardSummary['followUps'] => {
  const stagesById = new Map(stages.map((stage) => [stage.id, stage]));
  const customersById = new Map(customers.map((c) => [c.id, c]));
  const today = toLocalDateOnly();
  const tomorrow = addLocalDays(1);

  const todayItems: FollowUpItem[] = [];
  const tomorrowItems: FollowUpItem[] = [];
  const overdueItems: FollowUpItem[] = [];

  for (const customer of customers) {
    if (!customer.nextActionDate) continue;
    const actionDate = getActionDateKey(customer.nextActionDate);
    const item = buildCustomerFollowUp(customer, stagesById);
    if (!item) continue;
    if (actionDate === today) todayItems.push(item);
    else if (actionDate === tomorrow) tomorrowItems.push(item);
    else if (actionDate < today) overdueItems.push(item);
  }

  for (const deal of deals) {
    if (!deal.nextActionDate) continue;
    const actionDate = getActionDateKey(deal.nextActionDate);
    const item = buildDealFollowUp(deal, customersById.get(deal.customerId), stagesById);
    if (!item) continue;
    if (actionDate === today) todayItems.push(item);
    else if (actionDate === tomorrow) tomorrowItems.push(item);
    else if (actionDate < today) overdueItems.push(item);
  }

  return {
    today: sortFollowUps(todayItems),
    tomorrow: sortFollowUps(tomorrowItems),
    overdue: sortFollowUps(overdueItems),
  };
};

const sumReceivedInMonth = (invoices: InvoiceEntity[], year: number, month: number): number =>
  roundMoney(
    invoices
      .filter((invoice) => isInCalendarMonth(invoice.issueDate, year, month))
      .reduce((sum, invoice) => sum + Number(invoice.received || 0), 0),
  );

const buildInsightMessage = async (
  invoices: InvoiceEntity[],
  deals: DealEntity[],
  revenueThisMonth: number,
  expensesThisMonth: number,
): Promise<string> => {
  const outstanding = getCollectionInvoices(invoices).reduce(
    (sum, invoice) => sum + Number(invoice.outstanding || 0),
    0,
  );

  if (outstanding > 0) {
    return `You have ${formatCurrency(outstanding)} pending collections due in the next 7 days.`;
  }

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(now.getDate() + 7);

  const renewalsThisWeek = (await loadCompanyRenewals(deals)).filter((renewal) => {
    const date = new Date(renewal.renewalDate);
    return date >= now && date <= weekFromNow;
  });

  if (renewalsThisWeek.length > 0) {
    return `You have ${renewalsThisWeek.length} renewal${renewalsThisWeek.length === 1 ? '' : 's'} due in the next 7 days.`;
  }

  if (revenueThisMonth > expensesThisMonth) {
    return 'Revenue is higher than expenses this month.';
  }
  if (expensesThisMonth > revenueThisMonth) {
    return 'Expenses are higher than revenue this month.';
  }
  return 'No renewals are due this week.';
};

const countByKey = <T>(items: T[], keyFn: (item: T) => string): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item) || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
};

export class DashboardService extends BaseService {
  constructor() {
    super('DashboardService');
  }

  async getSummary(): Promise<DashboardSummary> {
    this.logInfo('Building dashboard summary');

    const [customersWithDeleted, dealsWithDeleted, invoicesWithDeleted, payments, expenses] =
      await Promise.all([
        customerRepository.findAll({ includeDeleted: true }),
        dealRepository.findAll({ includeDeleted: true }),
        invoiceRepository.findAll({ includeDeleted: true }),
        paymentRepository.findAll(),
        expenseRepository.findAll(),
      ]);

    const customers = customersWithDeleted.filter((customer) => !customer.isDeleted);
    const deals = dealsWithDeleted.filter((deal) => !deal.isDeleted);
    const invoices = invoicesWithDeleted.filter((invoice) => !invoice.isDeleted);

    let stages: StageMasterEntity[] = [];
    try {
      stages = await stageMasterRepository.findAll();
    } catch (error) {
      this.logWarn('Stage master load failed; using stage ids as names', error);
    }

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    const revenueThisMonth = sumReceivedInMonth(invoices, thisYear, thisMonth);
    const revenueLastMonth = sumReceivedInMonth(invoices, lastYear, lastMonth);
    const revenueTrendPct =
      revenueLastMonth === 0
        ? 0
        : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);

    const collectionInvoices = getCollectionInvoices(invoices);
    const outstandingCollections = roundMoney(
      collectionInvoices.reduce((sum, invoice) => sum + Number(invoice.outstanding || 0), 0),
    );
    const pendingInvoiceCount = collectionInvoices.filter(
      (invoice) => invoice.outstanding > 0,
    ).length;

    const renewals = await loadCompanyRenewals(deals);
    const upcomingRenewals = renewals.filter((r) => r.status === 'upcoming').length;

    const totalReceived = roundMoney(
      invoices.reduce((sum, invoice) => sum + Number(invoice.received || 0), 0),
    );
    const paidExpenses = roundMoney(
      expenses
        .filter((expense) => expense.status === 'paid')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    );
    const cashPosition = roundMoney(totalReceived - paidExpenses);

    const expenseStats = getDashboardExpenseStats(expenses);
    const insight = {
      message: await buildInsightMessage(
        invoices,
        deals,
        revenueThisMonth,
        expenseStats.monthlyExpense,
      ),
    };

    const openDeals = deals.filter((deal) => deal.status !== 'completed');
    const pipelineValue = roundMoney(
      openDeals.reduce((sum, deal) => sum + Number(deal.contractValue || 0), 0),
    );
    const byStatus = countByKey(deals, (deal) => deal.status);
    const averageDealSize =
      deals.length > 0
        ? roundMoney(
            deals.reduce((sum, deal) => sum + Number(deal.contractValue || 0), 0) /
              deals.length,
          )
        : 0;

    return {
      revenueThisMonth,
      revenueLastMonth,
      revenueTrendPct,
      outstandingCollections,
      pendingInvoiceCount,
      upcomingRenewals,
      cashPosition,
      insight,
      pendingCollections: getPendingCollectionsTopN(invoices, 5),
      upcomingRenewalsList: renewals
        .filter((renewal) => renewal.status === 'upcoming')
        .slice(0, 5)
        .map((renewal) => ({
          id: renewal.id,
          customer: renewal.customerName,
          renewal: renewal.componentName || renewal.renewalLabel,
          dueDate: renewal.renewalDate,
          amount: renewal.amount,
        })),
      upcomingRevenue: buildUpcomingRevenue(invoices, now),
      chart: {
        points: buildRevenueExpenseChart(invoices, expenses),
        expenseStats,
      },
      followUps: buildFollowUps(customers, deals, stages),
      activity: buildRecentActivity(
        customersWithDeleted,
        dealsWithDeleted,
        invoicesWithDeleted,
        payments,
        20,
      ),
      pipeline: {
        totalValue: pipelineValue,
        byStatus,
        openDeals: openDeals.length,
      },
      customerAnalytics: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c) => c.isActive || c.status === 'active').length,
        withNextAction: customers.filter((c) => Boolean(c.nextActionDate)).length,
      },
      dealAnalytics: {
        totalDeals: deals.length,
        byStatus,
        pipelineValue,
        averageDealSize,
      },
      opportunityFunnel: countByKey(deals, (deal) => deal.currentStageId || 'unknown'),
    };
  }
}

export const dashboardService = new DashboardService();

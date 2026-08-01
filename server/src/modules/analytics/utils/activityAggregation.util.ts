import type { CustomerEntity } from '../../customers/types/customer.entities';
import type { DealEntity } from '../../deals/types/deal.entities';
import type { InvoiceEntity, PaymentEntity } from '../../revenue/types/revenue.entities';
import type { ActivityItem } from '../types/analytics.types';

const timestampsDiffer = (createdAt?: string, updatedAt?: string): boolean => {
  if (!createdAt || !updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
};

/** Build recent dashboard actions from live domain entities (newest first). */
export const buildRecentActivity = (
  customers: CustomerEntity[],
  deals: DealEntity[],
  invoices: InvoiceEntity[],
  payments: PaymentEntity[],
  limit = 20,
): ActivityItem[] => {
  const items: ActivityItem[] = [];

  for (const customer of customers) {
    const name = customer.companyName || 'Unknown';

    if (customer.isDeleted) {
      items.push({
        id: `delete-customer-${customer.id}`,
        type: 'entity_deleted',
        title: 'Delete Activities',
        description: `${customer.recordType === 'opportunity' ? 'Opportunity' : 'Customer'} deleted · ${name}`,
        timestamp: customer.deletedAt || customer.updatedAt || customer.createdAt,
      });
      continue;
    }

    if (customer.recordType === 'opportunity') {
      items.push({
        id: `opportunity-created-${customer.id}`,
        type: 'opportunity_created',
        title: 'Opportunity Created',
        description: name,
        timestamp: customer.createdAt,
      });
    } else {
      const converted = customer.timeline?.find((entry) => entry.action === 'converted_to_customer');
      items.push({
        id: `customer-created-${customer.id}`,
        type: 'customer_created',
        title: 'Customer Created',
        description: name,
        timestamp: converted?.timestamp || customer.createdAt,
      });
    }

    for (const entry of customer.timeline ?? []) {
      if (entry.action === 'edited') {
        items.push({
          id: `customer-updated-${customer.id}-${entry.id}`,
          type: 'customer_updated',
          title: 'Customer Updated',
          description: name,
          timestamp: entry.timestamp,
        });
      }
    }

    // Fallback when timeline edits are missing but the row was clearly updated.
    if (
      !(customer.timeline ?? []).some((entry) => entry.action === 'edited') &&
      timestampsDiffer(customer.createdAt, customer.updatedAt)
    ) {
      items.push({
        id: `customer-updated-${customer.id}`,
        type: 'customer_updated',
        title: 'Customer Updated',
        description: name,
        timestamp: customer.updatedAt,
      });
    }
  }

  for (const deal of deals) {
    if (deal.isDeleted) {
      items.push({
        id: `delete-deal-${deal.id}`,
        type: 'entity_deleted',
        title: 'Delete Activities',
        description: `Deal deleted · ${deal.title || deal.dealNumber} · ${deal.customerName || ''}`.trim(),
        timestamp: deal.deletedAt || deal.updatedAt || deal.createdAt,
      });
      continue;
    }

    const renewalEntries = (deal.timeline ?? []).filter(
      (entry) => entry.action === 'renewal_updated',
    );
    for (const entry of renewalEntries) {
      items.push({
        id: `renewal-added-${deal.id}-${entry.id}`,
        type: 'renewal_added',
        title: 'Renewal Added',
        description: `${deal.title || deal.dealNumber} · ${deal.customerName || ''}`.trim(),
        timestamp: entry.timestamp,
      });
    }
  }

  for (const invoice of invoices) {
    if (invoice.isDeleted) {
      items.push({
        id: `delete-invoice-${invoice.id}`,
        type: 'entity_deleted',
        title: 'Delete Activities',
        description: `Invoice deleted · ${invoice.invoiceNumber} · ${invoice.customerName}`.trim(),
        timestamp: invoice.deletedAt || invoice.updatedAt || invoice.createdAt,
      });
      continue;
    }

    items.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice_generated',
      title: 'Invoice Generated',
      description: `${invoice.invoiceNumber} · ${invoice.customerName}`.trim(),
      timestamp: invoice.createdAt,
    });
  }

  for (const payment of payments) {
    if (payment.isDeleted || payment.status !== 'received') continue;
    items.push({
      id: `payment-${payment.id}`,
      type: 'payment_received',
      title: 'Payment Received',
      description: `${payment.amount} received${payment.reference ? ` · ${payment.reference}` : ''}`.trim(),
      timestamp: payment.paidAt || payment.createdAt,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

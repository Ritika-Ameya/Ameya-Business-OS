import type { DealComponentEntity } from '../../deals/types/deal.entities';
import { computeComponentLineTotal } from '../../deals/utils/componentAmount.util';
import { expectedReceiptRepository } from '../services/canvas.repository';
import type { ExpectedReceiptEntity, ReceiptSourceType } from '../types/canvas.entities';
import {
  formatReceivedLog,
  parseReceivedLog,
  settledByEntry,
  settledFromLog,
} from './receivedLog.util';

/** Cash recorded by "mark this cycle paid" on a component. Undo removes only these lines. */
const CYCLE_MODE = 'component';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const sourceTypeFor = (component: DealComponentEntity): ReceiptSourceType => {
  if (component.billingType === 'monthly' || component.billingType === 'half-yearly') {
    return 'subscription';
  }
  if (component.billingType === 'yearly') return 'license';
  return 'renewal';
};

const sameCycle = (receipt: ExpectedReceiptEntity, componentId: string, paidForDate: string) =>
  !receipt.isDeleted &&
  !receipt.invoiceId &&
  receipt.componentId === componentId &&
  receipt.expectedDate.slice(0, 10) === paidForDate &&
  receipt.status !== 'cancelled' &&
  receipt.status !== 'superseded';

/**
 * Records the component cycle as cash in Business Canvas Received.
 * No invoice is required. Cash already recorded for this cycle is not added again.
 */
export async function recordComponentCycleCash(input: {
  component: DealComponentEntity;
  customerId: string;
  currency: string;
  paidForDate: string;
  paymentDate: string;
}): Promise<void> {
  const paidFor = input.paidForDate.slice(0, 10);
  const paymentDate = input.paymentDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidFor) || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return;
  if (!input.customerId) return;

  const amount = computeComponentLineTotal(input.component);
  if (amount <= 0) return;

  const receipts = (await expectedReceiptRepository.findAll()).filter((receipt) =>
    sameCycle(receipt, input.component.id, paidFor),
  );
  const already = roundMoney(
    receipts.reduce((sum, receipt) => sum + settledFromLog(receipt.receivedLog), 0),
  );
  if (already >= amount - 0.001) return;

  const cash = roundMoney(amount - already);
  const account = Number(input.component.gstPercent) > 0 ? 'gst' : 'other';
  const line = {
    date: paymentDate,
    amount: cash,
    account: account as 'gst' | 'other',
    tdsAmount: 0,
    tdsSettles: false,
    mode: CYCLE_MODE,
  };
  const open =
    receipts.find((receipt) => receipt.status === 'expected') ??
    receipts.find((receipt) => receipt.status === 'received');

  if (open) {
    const nextLog = formatReceivedLog([...parseReceivedLog(open.receivedLog), line]);
    const settled = settledFromLog(nextLog);
    const expected = roundMoney(Number(open.expectedAmount) || amount);
    await expectedReceiptRepository.update(open.id, {
      receivedLog: nextLog,
      ...(settled >= expected - 0.001 ? { status: 'received' as const } : {}),
    });
    return;
  }

  const name = input.component.name?.trim() || 'Component';
  await expectedReceiptRepository.create({
    origin: 'override',
    sourceType: sourceTypeFor(input.component),
    sourceRefType: 'component',
    sourceRefId: input.component.id,
    customerId: input.customerId,
    dealId: input.component.dealId,
    invoiceId: '',
    componentId: input.component.id,
    installmentIndex: 1,
    expectedAmount: amount,
    gstPercent: Number(input.component.gstPercent) || 0,
    currency: input.currency || 'INR',
    expectedDate: paidFor,
    reason: `${name} · paid ${paidFor}`,
    status: 'received',
    receivedLog: formatReceivedLog([line]),
    suppressInvoice: false,
  } as Omit<ExpectedReceiptEntity, 'id'>);
}

/** Removes cash that "mark this cycle paid" recorded, and puts any balance back on To collect. */
export async function reverseComponentCycleCash(
  componentId: string,
  paidForDate: string,
): Promise<void> {
  const paidFor = paidForDate.slice(0, 10);
  if (!componentId || !/^\d{4}-\d{2}-\d{2}$/.test(paidFor)) return;

  const receipts = (await expectedReceiptRepository.findAll()).filter((receipt) =>
    sameCycle(receipt, componentId, paidFor),
  );
  for (const receipt of receipts) {
    const entries = parseReceivedLog(receipt.receivedLog);
    const next = entries.filter((entry) => entry.mode !== CYCLE_MODE);
    if (next.length === entries.length) continue;
    const settled = roundMoney(next.reduce((sum, entry) => sum + settledByEntry(entry), 0));
    const expected = roundMoney(Number(receipt.expectedAmount) || 0);
    await expectedReceiptRepository.update(receipt.id, {
      receivedLog: formatReceivedLog(next),
      ...(settled < expected - 0.001 ? { status: 'expected' as const } : {}),
    });
  }
}

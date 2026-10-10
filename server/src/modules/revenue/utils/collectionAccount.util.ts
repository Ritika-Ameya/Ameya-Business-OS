import type { InvoiceBillingType, PaymentAccount } from '../types/revenue.entities';

/** Ameya Innovex (company / GST account) vs Ritika (domestic non-GST). Display only. */
export type CollectionAccount = 'innovex' | 'ritika';

/**
 * Actual money received. International clients always land in the company account,
 * even when the invoice has no GST. Domestic clients follow the payment account,
 * then the invoice billing type for older payments that did not store an account.
 */
export const collectionAccountForPayment = (input: {
  internationalClient: boolean;
  receivedAccount: PaymentAccount | '';
  billingType: InvoiceBillingType;
}): CollectionAccount => {
  if (input.internationalClient) return 'innovex';
  if (input.receivedAccount === 'gst') return 'innovex';
  if (input.receivedAccount === 'other') return 'ritika';
  return input.billingType === 'gst' ? 'innovex' : 'ritika';
};

/**
 * Expected collection, before a payment exists. International clients are expected
 * in the company account. Domestic clients follow the linked invoice, then whether
 * the expected amount itself includes GST.
 */
export const collectionAccountForExpected = (input: {
  internationalClient: boolean;
  gstPercent: number | null;
  billingType?: InvoiceBillingType | '';
}): CollectionAccount => {
  if (input.internationalClient) return 'innovex';
  if (input.billingType === 'gst') return 'innovex';
  if (input.billingType === 'non_gst') return 'ritika';
  return (Number(input.gstPercent) || 0) > 0 ? 'innovex' : 'ritika';
};

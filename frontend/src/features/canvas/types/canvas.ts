export type LeadTemperature = "hot" | "warm" | "cold" | "";

export type CanvasRowKey = "unclassified" | "hot" | "warm" | "cold" | "customer";

export type ReceiptSourceType =
  | "invoice_balance"
  | "invoice_installment"
  | "renewal"
  | "license"
  | "subscription"
  | "deal_advance"
  | "deal_expected"
  | "opportunity_conversion"
  | "other";

export type CanvasDisplayStatus =
  | "expected"
  | "overdue"
  | "received"
  | "cancelled"
  | "superseded";

export interface CanvasCard {
  id: string;
  persistedId: string | null;
  kind: "receipt" | "account";
  customerId: string;
  companyName: string;
  recordType: "opportunity" | "customer";
  temperature: LeadTemperature;
  rowKey: CanvasRowKey;
  monthKey: string;
  expectedAmount: number | null;
  amountExGst: number | null;
  gstAmount: number | null;
  gstPercent: number | null;
  expectedDate: string;
  sourceType: ReceiptSourceType | "";
  reason: string;
  dealId: string;
  dealTitle: string;
  invoiceId: string;
  invoiceNumber: string;
  componentId: string;
  status: CanvasDisplayStatus;
  liveBalance: number | null;
  amountOverridden: boolean;
  origin: "override" | "manual" | "installment" | "dismissed" | "suggestion" | "account";
  installmentIndex: number;
  currency: string;
}

export interface CanvasAccountOption {
  id: string;
  companyName: string;
  recordType: "opportunity" | "customer";
  temperature: LeadTemperature;
}

export interface CanvasDealOption {
  id: string;
  title: string;
  customerId: string;
  probability: number;
  contractValue: number;
  expectedCloseDate: string;
}

export interface CanvasBoard {
  today: string;
  dragHint: string;
  cards: CanvasCard[];
  accounts: CanvasAccountOption[];
  deals: CanvasDealOption[];
}

export type RangePreset =
  | "rolling-3"
  | "this-month"
  | "last-month"
  | "next-month"
  | "month-after"
  | "this-quarter"
  | "next-quarter"
  | "all"
  | "custom";

export interface CanvasFilters {
  q: string;
  temperature: "all" | "hot" | "warm" | "cold" | "unclassified";
  recordType: "all" | "opportunity" | "customer";
  source: "all" | ReceiptSourceType;
  status: "all" | "expected" | "overdue" | "received" | "cancelled";
  dealId: string;
  amountMin: string;
  amountMax: string;
}

export const defaultCanvasFilters = (): CanvasFilters => ({
  q: "",
  temperature: "all",
  recordType: "all",
  source: "all",
  status: "all",
  dealId: "",
  amountMin: "",
  amountMax: "",
});

export const SOURCE_LABELS: Record<ReceiptSourceType, string> = {
  invoice_balance: "Invoice balance",
  invoice_installment: "Installment",
  renewal: "Renewal",
  license: "License",
  subscription: "Subscription",
  deal_advance: "Deal advance",
  deal_expected: "Expected closure",
  opportunity_conversion: "Opportunity conversion",
  other: "Other",
};

export const ROW_LABELS: Record<CanvasRowKey, string> = {
  unclassified: "Unclassified",
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  customer: "Customers",
};

export const CANVAS_ROWS: CanvasRowKey[] = [
  "unclassified",
  "hot",
  "warm",
  "cold",
  "customer",
];

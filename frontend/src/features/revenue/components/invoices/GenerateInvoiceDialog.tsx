import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import {
  getDefaultTaxPercentage,
  resolveCustomerAddress,
  type InvoiceAddressType,
} from "@/features/settings/utils/app-config-utils";
import { computeComponentLineTotal, computeComponentTaxable, formatComponentDate, getComponentCurrentDueDate, hasComponentRenewal, previewRenewalCyclePayment } from "@/features/deals/utils/deal-component-utils";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { SOURCE_LABELS, type ReceiptSourceType } from "@/features/canvas/types/canvas";
import { composeInvoiceNumber, formatBaseWithGst, formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { addLocalDaysIso, cn, toLocalIsoDate } from "@/shared/utils";
import { BillingTypeToggle } from "@/features/revenue/components/invoices/BillingTypeToggle";
import type {
  GenerateInvoiceContext,
  Invoice,
  InvoiceBillingType,
} from "@/features/revenue/types/invoice";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: GenerateInvoiceContext;
  onGenerate?: (invoice: Invoice) => void;
}

function todayIsoDate(): string {
  return toLocalIsoDate();
}

function addDaysIso(days: number): string {
  return addLocalDaysIso(days);
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  context,
  onGenerate,
}: GenerateInvoiceDialogProps) {
  const { finance } = useAppConfig();
  const { customers } = useCustomers();
  const { deals, getComponentsByDeal } = useDeals();
  const { createInvoice, invoices } = useRevenue();
  const { refreshDashboard } = useDashboard();
  const defaultTax = getDefaultTaxPercentage(finance);
  const customerLocked = Boolean(context?.customerId);
  const dealLocked = Boolean(context?.dealId);

  const firstDealForCustomer = (forCustomerId: string) =>
    deals.find((deal) => deal.customerId === forCustomerId)?.id ?? "";

  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    () => context?.customerId ?? customers[0]?.id ?? ""
  );
  const [selectedDealId, setSelectedDealId] = useState(() => {
    if (context?.dealId) return context.dealId;
    const forCustomerId = context?.customerId ?? customers[0]?.id ?? "";
    return deals.find((deal) => deal.customerId === forCustomerId)?.id ?? "";
  });
  const [addressType, setAddressType] = useState<InvoiceAddressType>("billing");
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate);
  const [dueDate, setDueDate] = useState(() => addDaysIso(30));
  const [nextActionDate, setNextActionDate] = useState(() => addDaysIso(7));
  const [gstPercent, setGstPercent] = useState(String(defaultTax));
  const [billingType, setBillingType] = useState<InvoiceBillingType>("gst");
  const [invoiceNumberRest, setInvoiceNumberRest] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<
    Array<{
      id: string;
      reason: string;
      expectedAmount: number;
      expectedDate: string;
      sourceType: ReceiptSourceType;
    }>
  >([]);
  const [selectedForecastIds, setSelectedForecastIds] = useState<string[]>([]);
  const [forecastOpen, setForecastOpen] = useState(false);

  const customerId = context?.customerId ?? selectedCustomerId;
  const dealId = context?.dealId ?? selectedDealId;

  const dealComponents = useMemo(
    () => (dealId ? getComponentsByDeal(dealId) : []),
    [dealId, getComponentsByDeal]
  );

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId]
  );

  const selectedDeal = useMemo(
    () => deals.find((deal) => deal.id === dealId),
    [deals, dealId]
  );

  const invoiceAddress = selectedCustomer
    ? resolveCustomerAddress(selectedCustomer, addressType)
    : "";

  const lastBillingType = useMemo(() => {
    const latest = invoices
      .filter((invoice) => invoice.customerId === customerId && invoice.status !== "cancelled")
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))[0];
    return latest?.billingType ?? null;
  }, [invoices, customerId]);

  const billingDefaultKey = open ? `${customerId}:${lastBillingType ?? "gst"}` : "";
  const [appliedBillingDefaultKey, setAppliedBillingDefaultKey] = useState("");
  if (billingDefaultKey !== appliedBillingDefaultKey) {
    setAppliedBillingDefaultKey(billingDefaultKey);
    if (open) setBillingType(lastBillingType ?? "gst");
  }

  const isNonGst = billingType === "non_gst";

  const summary = useMemo(() => {
    const selected = dealComponents.filter((component) =>
      selectedComponents.includes(component.id)
    );
    const subtotal = selected.reduce(
      (sum, component) => sum + computeComponentTaxable(component),
      0
    );
    if (isNonGst) {
      const base = Math.round(subtotal * 100) / 100;
      return { subtotal: base, tax: 0, total: base, taxRate: 0 };
    }
    const taxRate = Number.parseFloat(gstPercent) || 0;
    const uniqueRates = [
      ...new Set(selected.map((component) => Number(component.gstPercent || 0))),
    ];
    const tax =
      uniqueRates.length > 1
        ? selected.reduce(
            (sum, component) =>
              sum +
              (computeComponentLineTotal(component) - computeComponentTaxable(component)),
            0
          )
        : Math.round(((subtotal * taxRate) / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return {
      subtotal,
      tax: Math.round(tax * 100) / 100,
      total,
      taxRate: uniqueRates.length > 1 && subtotal > 0
        ? Math.round((tax / subtotal) * 10000) / 100
        : taxRate,
    };
  }, [dealComponents, selectedComponents, gstPercent, isNonGst]);

  const selectedGstKey = useMemo(() => {
    const selected = dealComponents.filter((component) =>
      selectedComponents.includes(component.id)
    );
    if (selected.length === 0) return `empty:${defaultTax}`;
    const rates = [
      ...new Set(selected.map((component) => Number(component.gstPercent || 0))),
    ];
    return rates.length === 1 ? String(rates[0]) : "mixed";
  }, [dealComponents, selectedComponents, defaultTax]);

  useEffect(() => {
    if (!open) return;
    if (context?.dealId) {
      if (selectedDealId !== context.dealId) setSelectedDealId(context.dealId);
      return;
    }
    const forCustomerId = context?.customerId ?? selectedCustomerId;
    if (!forCustomerId) return;
    const current = deals.find((deal) => deal.id === selectedDealId);
    if (current?.customerId === forCustomerId) return;
    const nextId = deals.find((deal) => deal.customerId === forCustomerId)?.id ?? "";
    if (nextId !== selectedDealId) setSelectedDealId(nextId);
  }, [open, context?.dealId, context?.customerId, selectedCustomerId, selectedDealId, deals]);

  useEffect(() => {
    if (!open) return;
    if (selectedGstKey.startsWith("empty:")) {
      setGstPercent(String(defaultTax));
      return;
    }
    if (selectedGstKey !== "mixed") {
      setGstPercent(selectedGstKey);
    }
  }, [open, selectedGstKey, defaultTax]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedComponents([]);
      setAddressType("billing");
      setInvoiceDate(todayIsoDate());
      setDueDate(addDaysIso(30));
      setNextActionDate(addDaysIso(7));
      setGstPercent(String(defaultTax));
      setInvoiceNumberRest("");
      setNotes("");
      setError(null);
      const nextCustomerId = context?.customerId ?? customers[0]?.id ?? "";
      setSelectedCustomerId(nextCustomerId);
      setSelectedDealId(context?.dealId || firstDealForCustomer(nextCustomerId));
    }
    onOpenChange(nextOpen);
  };

  const toggleComponent = (id: string) => {
    setSelectedComponents((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !dealId) {
      setError("Customer and deal are required.");
      return;
    }
    if (!invoiceDate || !dueDate) {
      setError("Invoice date and due date are required.");
      return;
    }
    if (!nextActionDate) {
      setError("Next follow-up date is required.");
      return;
    }
    if (selectedComponents.length === 0) {
      setError("Select at least one component.");
      return;
    }
    const invoiceNumber = composeInvoiceNumber(
      finance.invoicePrefix,
      invoiceNumberRest
    );
    if (!invoiceNumberRest.trim()) {
      setError("Enter the invoice number after the prefix.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const openForecasts = await canvasApi.listDealForecasts(dealId);
      if (openForecasts.length > 0) {
        setForecasts(openForecasts);
        setSelectedForecastIds([]);
        setForecastOpen(true);
        return;
      }
      const invoice = await createInvoice({
        customerId,
        customerName: context?.customerName ?? selectedCustomer?.name,
        dealId,
        dealTitle: context?.dealTitle ?? selectedDeal?.title,
        status: "due",
        issueDate: invoiceDate,
        dueDate,
        subtotal: summary.subtotal,
        taxPercent: summary.taxRate,
        tax: summary.tax,
        total: summary.total,
        componentIds: selectedComponents,
        notes: notes.trim(),
        nextActionDate,
        invoiceNumber,
        billingType,
      });
      onOpenChange(false);
      setSelectedComponents([]);
      onGenerate?.(invoice);
      void refreshDashboard({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice from selected deal components.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  {customerLocked ? (
                    <Input
                      id="customer"
                      value={context?.customerName ?? ""}
                      readOnly
                      className="rounded-xl bg-muted/50"
                    />
                  ) : (
                    <Select
                      value={selectedCustomerId}
                      onValueChange={(value) => {
                        setSelectedCustomerId(value);
                        const firstDeal = deals.find((deal) => deal.customerId === value);
                        if (firstDeal) setSelectedDealId(firstDeal.id);
                      }}
                    >
                      <SelectTrigger id="customer" className="w-full rounded-xl">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal">Deal</Label>
                  {dealLocked ? (
                    <Input
                      id="deal"
                      value={context?.dealTitle ?? ""}
                      readOnly
                      className="rounded-xl bg-muted/50"
                    />
                  ) : (
                    <Select
                      value={selectedDealId}
                      onValueChange={(value) => {
                        setSelectedDealId(value);
                        setSelectedComponents([]);
                      }}
                    >
                      <SelectTrigger id="deal" className="w-full rounded-xl">
                        <SelectValue placeholder="Select deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {deals
                          .filter((deal) => !selectedCustomerId || deal.customerId === selectedCustomerId)
                          .map((deal) => (
                            <SelectItem key={deal.id} value={deal.id}>
                              {deal.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address-type">Invoice Address</Label>
                  <Select
                    value={addressType}
                    onValueChange={(value) =>
                      setAddressType(value as InvoiceAddressType)
                    }
                  >
                    <SelectTrigger id="address-type" className="w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing Address</SelectItem>
                      <SelectItem value="service">Service Address</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label>Selected Address</Label>
                  <Input
                    value={invoiceAddress || "No address on file"}
                    readOnly
                    className="rounded-xl bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Components</Label>
                <div className="space-y-2 rounded-xl border border-border/70 p-2">
                  {dealComponents.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No billable components available for this deal.
                    </p>
                  ) : (
                    dealComponents.map((component) => {
                      const isSelected = selectedComponents.includes(component.id);
                      const dueIso = getComponentCurrentDueDate(component);
                      const paymentPreview = previewRenewalCyclePayment(component);
                      return (
                        <button
                          key={component.id}
                          type="button"
                          onClick={() => toggleComponent(component.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {component.category}
                              {hasComponentRenewal(component.renewalFrequency) && dueIso
                                ? ` · Invoice for cycle ${formatComponentDate(dueIso)}`
                                : ""}
                            </p>
                            {isSelected && paymentPreview ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                When this invoice is fully paid, that cycle is marked paid
                                and next due becomes {formatComponentDate(paymentPreview.nextDueDate)}.
                              </p>
                            ) : null}
                          </div>
                          <span className="max-w-[14rem] shrink-0 text-right text-sm font-medium leading-snug">
                            {formatBaseWithGst(
                              computeComponentTaxable(component),
                              isNonGst
                                ? 0
                                : computeComponentLineTotal(component) -
                                    computeComponentTaxable(component),
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-number">
                  Invoice Number <span className="text-destructive">*</span>
                </Label>
                <div className="flex overflow-hidden rounded-xl border border-input/90 bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-ring/30">
                  <span className="flex items-center border-r border-border/70 bg-muted/50 px-3 text-sm font-medium text-muted-foreground">
                    {finance.invoicePrefix.trim() || "INV"}
                  </span>
                  <Input
                    id="invoice-number"
                    value={invoiceNumberRest}
                    onChange={(e) => setInvoiceNumberRest(e.target.value)}
                    placeholder="0001 or 2026/27-A"
                    className="rounded-none border-0 shadow-none focus-visible:ring-0"
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Prefix comes from Settings. Type the rest of this invoice number
                  yourself — it is not auto-incremented.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-follow-up-date">Next Follow-up Date</Label>
                <Input
                  id="next-follow-up-date"
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  required
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  This date appears on the dashboard so you know when to follow up for
                  this invoice collection.
                </p>
              </div>

              <div className="space-y-2">
                <Label>GST on this invoice</Label>
                <BillingTypeToggle value={billingType} onChange={setBillingType} />
                <p className="text-xs text-muted-foreground">
                  {lastBillingType
                    ? `Suggested from this customer's last invoice (${
                        lastBillingType === "gst" ? "with GST" : "without GST"
                      }). Change it if this bill is different.`
                    : "Choose per invoice. The same customer can be billed with or without GST."}
                </p>
              </div>

              {!isNonGst && (
                <div className="space-y-2">
                  <Label htmlFor="gst">GST %</Label>
                  <Input
                    id="gst"
                    type="number"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for this invoice..."
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <h3 className="text-sm font-semibold">Invoice Summary</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calculated from selected components
                </p>
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatInvoiceCurrency(summary.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isNonGst ? "GST (not charged)" : `GST (${summary.taxRate}%)`}
                    </span>
                    <span className="font-medium">
                      {formatInvoiceCurrency(summary.tax)}
                    </span>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {isNonGst ? "Grand Total (without GST)" : "Grand Total (incl. GST)"}
                      </span>
                      <span className="text-lg font-semibold">
                        {formatInvoiceCurrency(summary.total)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {selectedComponents.length > 0
                    ? `${selectedComponents.length} component(s) selected`
                    : "Select components to include"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Generating…" : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={forecastOpen} onOpenChange={setForecastOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Remove the old forecast</DialogTitle>
          <DialogDescription>
            This started as one forecast for the whole deal. The invoice uses the components you
            selected. Select each old forecast. It is deleted only after you select it, then the
            invoice is created. Cancel deletes nothing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {forecasts.map((forecast) => {
            const selected = selectedForecastIds.includes(forecast.id);
            return (
              <button
                key={forecast.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setSelectedForecastIds((current) =>
                    selected
                      ? current.filter((id) => id !== forecast.id)
                      : [...current, forecast.id]
                  )
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left",
                  selected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {selected ? <Check className="size-3" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium tabular-nums">
                    {formatInvoiceCurrency(forecast.expectedAmount)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {SOURCE_LABELS[forecast.sourceType] || "Forecast"}
                    {forecast.expectedDate ? ` · ${formatInvoiceDate(forecast.expectedDate)}` : ""}
                    {forecast.reason ? ` · ${forecast.reason}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedForecastIds.length === forecasts.length
            ? "Selected. These forecasts will be deleted and the invoice will be created."
            : "Select each forecast. The invoice stays on hold until every old amount is selected."}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setForecastOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || selectedForecastIds.length !== forecasts.length || forecasts.length === 0}
            onClick={() => {
              void (async () => {
                setSaving(true);
                setError(null);
                try {
                  for (const id of selectedForecastIds) {
                    await canvasApi.dismiss(id);
                  }
                  setForecastOpen(false);
                  const invoice = await createInvoice({
                    customerId,
                    customerName: context?.customerName ?? selectedCustomer?.name,
                    dealId,
                    dealTitle: context?.dealTitle ?? selectedDeal?.title,
                    status: "due",
                    issueDate: invoiceDate,
                    dueDate,
                    subtotal: summary.subtotal,
                    taxPercent: summary.taxRate,
                    tax: summary.tax,
                    total: summary.total,
                    componentIds: selectedComponents,
                    notes: notes.trim(),
                    nextActionDate,
                    invoiceNumber: composeInvoiceNumber(finance.invoicePrefix, invoiceNumberRest),
                    billingType,
                  });
                  onOpenChange(false);
                  setSelectedComponents([]);
                  onGenerate?.(invoice);
                  void refreshDashboard({ silent: true });
                } catch (err) {
                  setError(getErrorMessage(err));
                  setForecastOpen(false);
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            {saving ? "Removing…" : "Delete selected and create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

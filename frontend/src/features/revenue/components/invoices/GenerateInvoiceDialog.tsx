import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
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
import { composeInvoiceNumber, formatBaseWithGst, formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { addLocalDaysIso, cn, formatCurrency, formatDate, toLocalIsoDate } from "@/shared/utils";
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
  const { createInvoice, invoices, loadPaymentsForInvoice } = useRevenue();
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
  const [cycleByComponent, setCycleByComponent] = useState<Record<string, string>>({});
  const [taggedPayments, setTaggedPayments] = useState<string[]>([]);
  const [receiptPayments, setReceiptPayments] = useState<
    Array<{
      key: string;
      receiptId: string;
      index: number;
      dealId: string;
      componentId: string;
      reason: string;
      paymentDate: string;
      amount: number;
      tdsAmount: number;
      tdsSettles: boolean;
    }>
  >([]);

  const customerId = context?.customerId ?? selectedCustomerId;
  const dealId = context?.dealId ?? selectedDealId;

  const dealComponents = useMemo(
    () => (dealId ? getComponentsByDeal(dealId) : []),
    [dealId, getComponentsByDeal]
  );

  useEffect(() => {
    if (!open || !customerId) {
      setReceiptPayments([]);
      return;
    }
    let cancelled = false;
    canvasApi
      .listCustomerReceiptPayments(customerId)
      .then((rows) => {
        if (cancelled) return;
        setReceiptPayments(
          rows.map((row) => ({
            key: `${row.receiptId}|${row.index}`,
            receiptId: row.receiptId,
            index: row.index,
            dealId: row.dealId,
            componentId: row.componentId,
            reason: row.reason,
            paymentDate: row.paymentDate,
            amount: row.amount,
            tdsAmount: row.tdsAmount,
            tdsSettles: row.tdsSettles,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setReceiptPayments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const taggablePayments = useMemo(() => {
    const componentIds = new Set(dealComponents.map((component) => component.id));
    return receiptPayments.filter(
      (payment) => payment.dealId === dealId || componentIds.has(payment.componentId)
    );
  }, [dealComponents, dealId, receiptPayments]);

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

  const internationalClient = Boolean(selectedCustomer?.internationalClient);
  const billingDefaultKey = open
    ? `${customerId}:${internationalClient ? "international" : "domestic"}:${lastBillingType ?? "gst"}`
    : "";
  const [appliedBillingDefaultKey, setAppliedBillingDefaultKey] = useState("");
  if (billingDefaultKey !== appliedBillingDefaultKey) {
    setAppliedBillingDefaultKey(billingDefaultKey);
    if (open) setBillingType(internationalClient ? "non_gst" : (lastBillingType ?? "gst"));
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

  const taggedRows = taggablePayments.filter((payment) => taggedPayments.includes(payment.key));
  const taggedSettled =
    Math.round(
      taggedRows.reduce(
        (sum, payment) => sum + payment.amount + (payment.tdsSettles ? payment.tdsAmount : 0),
        0
      ) * 100
    ) / 100;
  const remaining = Math.max(0, Math.round((summary.total - taggedSettled) * 100) / 100);
  const paidCycleOnly =
    selectedComponents.length > 0 &&
    selectedComponents.every((id) => {
      const component = dealComponents.find((row) => row.id === id);
      if (!component) return false;
      const dueIso = getComponentCurrentDueDate(component).slice(0, 10);
      const paidCycle = (component.lastRenewedDate || "").slice(0, 10);
      if (!paidCycle || !dueIso || paidCycle === dueIso) return false;
      return (cycleByComponent[id] || dueIso) === paidCycle;
    });
  const fullyCovered = taggedRows.length > 0 && remaining <= 0.5;
  const hideDueDate = paidCycleOnly && fullyCovered;
  const dueDateForSave = hideDueDate
    ? taggedRows.map((payment) => payment.paymentDate).sort().at(-1) || invoiceDate
    : dueDate;

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
      setCycleByComponent({});
      setTaggedPayments([]);
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
    if (!invoiceDate || !dueDateForSave) {
      setError(
        hideDueDate
          ? "Invoice date is required."
          : "Invoice date and due date are required."
      );
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
    const tagged = taggedRows;
    if (taggedSettled > summary.total + 0.5) {
      setError("The payments you tagged are more than this invoice.");
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
      const invoice = await createInvoice({
        customerId,
        customerName:
          context?.customerName ||
          selectedCustomer?.company?.trim() ||
          selectedCustomer?.name,
        dealId,
        dealTitle: context?.dealTitle ?? selectedDeal?.title,
        status: "due",
        issueDate: invoiceDate,
        dueDate: dueDateForSave,
        subtotal: summary.subtotal,
        taxPercent: summary.taxRate,
        tax: summary.tax,
        total: summary.total,
        componentIds: selectedComponents,
        billedCycles: selectedComponents.map((id) => {
          const component = dealComponents.find((row) => row.id === id);
          const nextDue = component ? getComponentCurrentDueDate(component) : "";
          return { componentId: id, cycleDate: (cycleByComponent[id] || nextDue).slice(0, 10) };
        }).filter((cycle) => /^\d{4}-\d{2}-\d{2}$/.test(cycle.cycleDate)),
        linkPayments: tagged.map((payment) => ({
          receiptId: payment.receiptId,
          index: payment.index,
        })),
        notes: notes.trim(),
        nextActionDate,
        invoiceNumber,
        billingType,
      });
      if (tagged.length > 0) {
        await loadPaymentsForInvoice(invoice.id);
      }
      onOpenChange(false);
      setSelectedComponents([]);
      setTaggedPayments([]);
      onGenerate?.(invoice);
      void refreshDashboard({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice from selected deal components. The canvas then shows this invoice, not the old forecast for the same components.
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
                            {customer.company?.trim() && customer.name?.trim() && customer.company.trim() !== customer.name.trim()
                              ? `${customer.company.trim()} · ${customer.name.trim()}`
                              : customer.company?.trim() || customer.name?.trim() || "Untitled customer"}
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
                      const paidCycle = (component.lastRenewedDate || "").slice(0, 10);
                      const canBillPaidCycle = Boolean(
                        paidCycle && dueIso && paidCycle !== dueIso.slice(0, 10)
                      );
                      const chosenCycle = cycleByComponent[component.id] || dueIso;
                      const billingPaidCycle = canBillPaidCycle && chosenCycle === paidCycle;
                      const paymentPreview = previewRenewalCyclePayment(component);
                      return (
                        <div
                          key={component.id}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/50"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleComponent(component.id)}
                            className="flex w-full items-center gap-3 text-left"
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
                                {hasComponentRenewal(component.renewalFrequency) && chosenCycle
                                  ? ` · Invoice for cycle ${formatComponentDate(chosenCycle)}`
                                  : ""}
                              </p>
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
                          {isSelected && canBillPaidCycle ? (
                            <div className="mt-2 flex flex-wrap gap-2 pl-8">
                              <button
                                type="button"
                                className={cn(
                                  "rounded-lg border px-2 py-1 text-xs",
                                  !billingPaidCycle
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                                )}
                                onClick={() =>
                                  setCycleByComponent((prev) => ({ ...prev, [component.id]: dueIso }))
                                }
                              >
                                Next cycle · {formatComponentDate(dueIso)}
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  "rounded-lg border px-2 py-1 text-xs",
                                  billingPaidCycle
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                                )}
                                onClick={() =>
                                  setCycleByComponent((prev) => ({
                                    ...prev,
                                    [component.id]: paidCycle,
                                  }))
                                }
                              >
                                Paid cycle · {formatComponentDate(paidCycle)}
                              </button>
                            </div>
                          ) : null}
                          {isSelected && paymentPreview && !billingPaidCycle ? (
                            <p className="mt-1 pl-8 text-xs text-muted-foreground">
                              When this invoice is fully paid, that cycle is marked paid
                              and next due becomes {formatComponentDate(paymentPreview.nextDueDate)}.
                            </p>
                          ) : null}
                          {isSelected && billingPaidCycle ? (
                            <p className="mt-1 pl-8 text-xs text-muted-foreground">
                              This bills the cycle already marked paid. Next renewal stays{" "}
                              {formatComponentDate(dueIso)}.
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {taggablePayments.length > 0 ? (
                <div className="space-y-2">
                  <Label>Payments already recorded</Label>
                  <p className="text-xs text-muted-foreground">
                    Tick a payment to put it on this invoice. It leaves the forecast and stays
                    counted once. The next renewal does not move.
                  </p>
                  <div className="space-y-2 rounded-xl border border-border/70 p-2">
                    {taggablePayments.map((payment) => {
                      const checked = taggedPayments.includes(payment.key);
                      return (
                        <button
                          key={payment.key}
                          type="button"
                          onClick={() =>
                            setTaggedPayments((prev) =>
                              prev.includes(payment.key)
                                ? prev.filter((key) => key !== payment.key)
                                : [...prev, payment.key]
                            )
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left",
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            )}
                          >
                            {checked && <Check className="size-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {payment.reason || "Recorded payment"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums">
                            {formatCurrency(payment.amount)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

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

              <div className={cn("grid gap-4", hideDueDate ? "" : "sm:grid-cols-2")}>
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
                {hideDueDate ? null : (
                  <div className="space-y-2">
                    <Label htmlFor="due-date">
                      {paidCycleOnly && taggedRows.length > 0 ? "Remaining due on" : "Due Date"}
                    </Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-xl"
                    />
                    {paidCycleOnly && taggedRows.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {formatInvoiceCurrency(remaining)} is still left. This date is only for that amount.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              {paidCycleOnly && taggedRows.length > 0 ? (
                <div className="space-y-1 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Already paid
                  </p>
                  {taggedRows.map((payment) => (
                    <p key={payment.key} className="text-sm">
                      Paid on {formatDate(payment.paymentDate)} · {formatCurrency(payment.amount)}
                    </p>
                  ))}
                  {hideDueDate ? (
                    <p className="text-xs text-muted-foreground">
                      Nothing is left on this invoice, so there is no due date.
                    </p>
                  ) : null}
                </div>
              ) : null}

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
                <BillingTypeToggle
                  value={internationalClient ? "non_gst" : billingType}
                  onChange={setBillingType}
                  disabled={internationalClient}
                />
                <p className="text-xs text-muted-foreground">
                  {internationalClient
                    ? "International client. GST not required. The collection counts in the Ameya Innovex GST account."
                    : lastBillingType
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
                {taggedRows.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-border/70 pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Already paid</span>
                      <span className="font-medium">{formatInvoiceCurrency(taggedSettled)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Still to collect</span>
                      <span className="font-medium">{formatInvoiceCurrency(remaining)}</span>
                    </div>
                  </div>
                ) : null}
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
  );
}

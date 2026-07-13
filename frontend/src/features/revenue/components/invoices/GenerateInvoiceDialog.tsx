import { Check } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import {
  getDefaultTaxPercentage,
  resolveCustomerAddress,
  type InvoiceAddressType,
} from "@/features/settings/utils/app-config-utils";
import { formatComponentCurrency } from "@/features/deals/utils/deal-component-utils";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import type { GenerateInvoiceContext, Invoice } from "@/features/revenue/types/invoice";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: GenerateInvoiceContext;
  onGenerate?: (invoice: Invoice) => void;
}

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]!;
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
  const { createInvoice } = useRevenue();
  const defaultTax = getDefaultTaxPercentage(finance);
  const isLocked = Boolean(context);

  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    () => context?.customerId ?? customers[0]?.id ?? ""
  );
  const [selectedDealId, setSelectedDealId] = useState(
    () => context?.dealId ?? deals[0]?.id ?? ""
  );
  const [addressType, setAddressType] = useState<InvoiceAddressType>("billing");
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate);
  const [dueDate, setDueDate] = useState(() => addDaysIso(30));
  const [gstPercent, setGstPercent] = useState(String(defaultTax));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const summary = useMemo(() => {
    const selected = dealComponents.filter((component) =>
      selectedComponents.includes(component.id)
    );
    const subtotal = selected.reduce((sum, component) => sum + component.amount, 0);
    const taxRate = Number.parseFloat(gstPercent) || 0;
    const tax = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total, taxRate };
  }, [dealComponents, selectedComponents, gstPercent]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedComponents([]);
      setAddressType("billing");
      setInvoiceDate(todayIsoDate());
      setDueDate(addDaysIso(30));
      setGstPercent(String(defaultTax));
      setNotes("");
      setError(null);
      setSelectedCustomerId(context?.customerId ?? customers[0]?.id ?? "");
      setSelectedDealId(context?.dealId ?? deals[0]?.id ?? "");
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
    if (selectedComponents.length === 0) {
      setError("Select at least one component.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const invoice = await createInvoice({
        customerId,
        customerName: context?.customerName ?? selectedCustomer?.name,
        dealId,
        dealTitle: context?.dealTitle ?? selectedDeal?.title,
        status: "sent",
        issueDate: invoiceDate,
        dueDate,
        subtotal: summary.subtotal,
        taxPercent: summary.taxRate,
        tax: summary.tax,
        total: summary.total,
        componentIds: selectedComponents,
        notes: notes.trim(),
      });
      onOpenChange(false);
      setSelectedComponents([]);
      onGenerate?.(invoice);
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
            Create a new invoice from selected deal components.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  {isLocked ? (
                    <Input
                      id="customer"
                      value={context!.customerName}
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
                  {isLocked ? (
                    <Input
                      id="deal"
                      value={context!.dealTitle}
                      readOnly
                      className="rounded-xl bg-muted/50"
                    />
                  ) : (
                    <Select value={selectedDealId} onValueChange={setSelectedDealId}>
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
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium">
                            {formatComponentCurrency(component.amount)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
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
                <Label htmlFor="gst">GST %</Label>
                <Input
                  id="gst"
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className="rounded-xl"
                />
              </div>

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
                      GST ({summary.taxRate}%)
                    </span>
                    <span className="font-medium">
                      {formatInvoiceCurrency(summary.tax)}
                    </span>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Grand Total</span>
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
  );
}

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
import {
  getDefaultTaxPercentage,
  resolveCustomerAddress,
  type InvoiceAddressType,
} from "@/features/settings/utils/app-config-utils";
import { formatComponentCurrency } from "@/features/deals/utils/deal-component-utils";
import { calculateInvoiceSummary } from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import type { GenerateInvoiceContext } from "@/features/revenue/types/invoice";

export interface GenerateInvoiceFormData {
  componentIds: string[];
  invoiceDate: string;
  dueDate: string;
  gstPercent: number;
  notes: string;
  addressType: InvoiceAddressType;
}

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: GenerateInvoiceContext;
  onGenerate?: (data: GenerateInvoiceFormData) => void;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().split("T")[0];
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
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    () => context?.customerId ?? customers[0]?.id ?? ""
  );
  const [selectedDealId, setSelectedDealId] = useState(
    () => context?.dealId ?? deals[0]?.id ?? ""
  );
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [gstPercent, setGstPercent] = useState(() =>
    Number.parseFloat(getDefaultTaxPercentage(finance)) || 18
  );
  const [notes, setNotes] = useState("");
  const [addressType, setAddressType] = useState<InvoiceAddressType>("billing");
  const isLocked = Boolean(context);
  const activeDealId = context?.dealId ?? selectedDealId;
  const dealComponents = getComponentsByDeal(activeDealId);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === (context?.customerId ?? selectedCustomerId)
      ),
    [customers, context?.customerId, selectedCustomerId]
  );

  const invoiceAddress = selectedCustomer
    ? resolveCustomerAddress(selectedCustomer, addressType)
    : "";

  const summary = useMemo(
    () => calculateInvoiceSummary(dealComponents, selectedComponents, gstPercent),
    [dealComponents, selectedComponents, gstPercent]
  );

  const customerDeals = useMemo(
    () => deals.filter((deal) => deal.customerId === (context?.customerId ?? selectedCustomerId)),
    [deals, context?.customerId, selectedCustomerId]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedComponents([]);
      setAddressType("billing");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setDueDate(defaultDueDate());
      setGstPercent(Number.parseFloat(getDefaultTaxPercentage(finance)) || 18);
      setNotes("");
    }
    onOpenChange(nextOpen);
  };

  const toggleComponent = (id: string) => {
    setSelectedComponents((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComponents.length === 0) return;
    onGenerate?.({
      componentIds: selectedComponents,
      invoiceDate,
      dueDate,
      gstPercent,
      notes: notes.trim(),
      addressType,
    });
    onOpenChange(false);
    setSelectedComponents([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice from selected deal components.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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
                        setSelectedDealId(firstDeal?.id ?? "");
                        setSelectedComponents([]);
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
                        {customerDeals.map((deal) => (
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
                      const lineTotal =
                        component.amount * (component.quantity ?? 1) *
                        (1 - (component.discount ?? 0) / 100);
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
                              {(component.quantity ?? 1) > 1 &&
                                ` · Qty ${component.quantity}`}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium">
                            {formatComponentCurrency(lineTotal)}
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
                  onChange={(e) => setGstPercent(Number(e.target.value) || 0)}
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
                      {formatComponentCurrency(summary.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({summary.gstPercent}%)</span>
                    <span className="font-medium">
                      {formatComponentCurrency(summary.gstAmount)}
                    </span>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Grand Total</span>
                      <span className="text-lg font-semibold">
                        {formatComponentCurrency(summary.grandTotal)}
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

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedComponents.length === 0}>
              Generate Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

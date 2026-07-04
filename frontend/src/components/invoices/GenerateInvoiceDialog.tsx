import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppConfig } from "@/hooks/use-app-config";
import { useCustomers } from "@/hooks/use-customers";
import { useDeals } from "@/hooks/use-deals";
import {
  getDefaultTaxPercentage,
  resolveCustomerAddress,
  type InvoiceAddressType,
} from "@/lib/app-config-utils";
import { formatComponentCurrency } from "@/lib/deal-component-utils";
import { cn } from "@/lib/utils";
import type { GenerateInvoiceContext } from "@/types/invoice";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: GenerateInvoiceContext;
  onGenerate?: (componentIds: string[]) => void;
}

const PLACEHOLDER_SUMMARY = {
  subtotal: "₹1,25,000",
  gst: "₹22,500",
  grandTotal: "₹1,47,500",
};

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
  const [addressType, setAddressType] = useState<InvoiceAddressType>("billing");
  const isLocked = Boolean(context);
  const defaultTax = getDefaultTaxPercentage(finance);

  const dealComponents = context
    ? getComponentsByDeal(context.dealId)
    : deals[0]
      ? getComponentsByDeal(deals[0].id)
      : [];

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

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedComponents([]);
      setAddressType("billing");
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
    onOpenChange(false);
    onGenerate?.(selectedComponents);
    setSelectedComponents([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice from selected deal components. UI preview only.
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
                      onValueChange={setSelectedCustomerId}
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
                    <Select defaultValue={deals[0]?.id}>
                      <SelectTrigger id="deal" className="w-full rounded-xl">
                        <SelectValue placeholder="Select deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {deals.map((deal) => (
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
                  <Input id="invoice-date" type="date" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input id="due-date" type="date" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST %</Label>
                <Input
                  id="gst"
                  type="number"
                  defaultValue={defaultTax}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
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
                  Placeholder values only
                </p>
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{PLACEHOLDER_SUMMARY.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({defaultTax}%)</span>
                    <span className="font-medium">{PLACEHOLDER_SUMMARY.gst}</span>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Grand Total</span>
                      <span className="text-lg font-semibold">
                        {PLACEHOLDER_SUMMARY.grandTotal}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Generate Invoice</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import type { FinanceSettings } from "@/features/settings/types/settings";

export function FinanceSettingsPage() {
  const { finance, updateFinance } = useAppConfig();
  const [form, setForm] = useState<FinanceSettings>(finance);
  const [saved, setSaved] = useState(false);

  const updateField = <K extends keyof FinanceSettings>(
    field: K,
    value: FinanceSettings[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateFinance(form);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Finance</h2>
        <p className="text-sm text-muted-foreground">
          Invoice numbering, tax defaults and payment terms.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
            <Input
              id="invoice-prefix"
              value={form.invoicePrefix}
              onChange={(e) => updateField("invoicePrefix", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next-invoice">Next Invoice Number</Label>
            <Input
              id="next-invoice"
              value={form.nextInvoiceNumber}
              onChange={(e) => updateField("nextInvoiceNumber", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">Default Tax Percentage</Label>
            <Input
              id="tax"
              type="number"
              min="0"
              value={form.defaultTaxPercentage}
              onChange={(e) => updateField("defaultTaxPercentage", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-terms">Default Payment Terms</Label>
            <Input
              id="payment-terms"
              value={form.defaultPaymentTerms}
              onChange={(e) => updateField("defaultPaymentTerms", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="currency-symbol">Currency Symbol</Label>
            <Input
              id="currency-symbol"
              value={form.currencySymbol}
              onChange={(e) => updateField("currencySymbol", e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
          <Button className="rounded-xl" onClick={handleSave}>
            Save Changes
          </Button>
          {saved && (
            <span className="text-sm text-muted-foreground">Saved locally.</span>
          )}
        </div>
      </div>
    </div>
  );
}

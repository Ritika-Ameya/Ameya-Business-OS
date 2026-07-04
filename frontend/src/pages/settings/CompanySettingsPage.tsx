import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useSettings } from "@/hooks/use-settings";
import { currencyOptions, financialYearOptions } from "@/lib/settings-utils";
import type { CompanySettings } from "@/types/settings";

export function CompanySettingsPage() {
  const { company, updateCompany } = useSettings();
  const [form, setForm] = useState<CompanySettings>(company);
  const [saved, setSaved] = useState(false);

  const updateField = <K extends keyof CompanySettings>(
    field: K,
    value: CompanySettings[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateCompany(form);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Company</h2>
        <p className="text-sm text-muted-foreground">
          Your organization profile and legal identifiers.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6">
              <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Logo upload placeholder</p>
                <p className="text-xs text-muted-foreground">
                  PNG or SVG, recommended 256×256
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              value={form.gstin}
              onChange={(e) => updateField("gstin", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              value={form.pan}
              onChange={(e) => updateField("pan", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="min-h-24 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(value) => updateField("currency", value)}
            >
              <SelectTrigger id="currency" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financial-year">Financial Year</Label>
            <Select
              value={form.financialYear}
              onValueChange={(value) => updateField("financialYear", value)}
            >
              <SelectTrigger id="financial-year" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {financialYearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

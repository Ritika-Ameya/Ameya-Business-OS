import { Check, Layers, LayoutGrid, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PlaceholderCard } from "@/components/deals/PlaceholderCard";
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
import { renewalFrequencyLabels } from "@/lib/deal-utils";
import { getActiveDealTypes } from "@/lib/app-config-utils";
import { useAppConfig } from "@/hooks/use-app-config";
import { cn } from "@/lib/utils";
import type { DealFormData } from "@/types/deal";

const steps = [
  { id: 1, label: "Deal Details", icon: LayoutGrid },
  { id: 2, label: "Components", icon: Layers },
  { id: 3, label: "Review", icon: Sparkles },
] as const;

const emptyForm = (): DealFormData => ({
  title: "",
  dealType: "",
  contractValue: "",
  startDate: new Date().toISOString().split("T")[0],
  renewalFrequency: "",
  description: "",
});

interface FormErrors {
  title?: string;
  dealType?: string;
  contractValue?: string;
  startDate?: string;
  renewalFrequency?: string;
}

interface CreateDealWizardProps {
  customerId: string;
  customerName: string;
  onSave: (data: DealFormData) => void;
}

export function CreateDealWizard({
  customerId,
  customerName,
  onSave,
}: CreateDealWizardProps) {
  const { dealTypes } = useAppConfig();
  const activeDealTypes = getActiveDealTypes(dealTypes);
  const [form, setForm] = useState<DealFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Deal name is required";
    }
    if (!form.dealType) {
      nextErrors.dealType = "Deal type is required";
    }
    if (!form.contractValue.trim()) {
      nextErrors.contractValue = "Contract value is required";
    } else if (
      Number.isNaN(Number.parseFloat(form.contractValue.replace(/,/g, ""))) ||
      Number.parseFloat(form.contractValue.replace(/,/g, "")) <= 0
    ) {
      nextErrors.contractValue = "Enter a valid amount";
    }
    if (!form.startDate) {
      nextErrors.startDate = "Start date is required";
    }
    if (!form.renewalFrequency) {
      nextErrors.renewalFrequency = "Renewal frequency is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    onSave(form);
  };

  const updateField = <K extends keyof DealFormData>(
    field: K,
    value: DealFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Creating deal for {customerName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Create Deal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step 1 of {steps.length} · {steps[0].label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((item, index) => {
          const isActive = item.id === 1;
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isActive && "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {index < steps.length - 1 && (
                <div className="mx-1 h-px flex-1 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6 md:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
              <LayoutGrid className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Deal Information</h2>
              <p className="text-sm text-muted-foreground">
                Name, type, and schedule
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deal-title">Deal Name</Label>
              <Input
                id="deal-title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Annual Maintenance Contract"
                className="rounded-xl"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-type">Deal Type</Label>
              <Select
                value={form.dealType}
                onValueChange={(value) =>
                  updateField("dealType", value as DealFormData["dealType"])
                }
              >
                <SelectTrigger
                  id="deal-type"
                  className="w-full rounded-xl"
                  aria-invalid={Boolean(errors.dealType)}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {activeDealTypes.map((type) => (
                    <SelectItem key={type.id} value={type.slug}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dealType && (
                <p className="text-xs text-destructive">{errors.dealType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-value">Contract Value</Label>
              <Input
                id="contract-value"
                type="number"
                min="0"
                step="1"
                value={form.contractValue}
                onChange={(e) => updateField("contractValue", e.target.value)}
                placeholder="125000"
                className="rounded-xl"
                aria-invalid={Boolean(errors.contractValue)}
              />
              {errors.contractValue && (
                <p className="text-xs text-destructive">{errors.contractValue}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="rounded-xl"
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal-frequency">Renewal Frequency</Label>
              <Select
                value={form.renewalFrequency}
                onValueChange={(value) =>
                  updateField(
                    "renewalFrequency",
                    value as DealFormData["renewalFrequency"]
                  )
                }
              >
                <SelectTrigger
                  id="renewal-frequency"
                  className="w-full rounded-xl"
                  aria-invalid={Boolean(errors.renewalFrequency)}
                >
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(renewalFrequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.renewalFrequency && (
                <p className="text-xs text-destructive">{errors.renewalFrequency}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Optional notes about this deal..."
                className="min-h-24 rounded-xl"
              />
            </div>
          </div>
        </div>

        <PlaceholderCard
          icon={User}
          title="Customer Context"
          description={customerName}
          message="This deal will be linked to the selected customer."
          accent="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <PlaceholderCard
          icon={Check}
          title="Next Steps"
          description="After creation"
          message="Add components, invoices, and payments from the Deal Workspace."
          accent="bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-6 sm:flex-row sm:justify-between">
        <Button variant="ghost" className="rounded-xl" asChild>
          <Link to={`/customers/${customerId}`}>Cancel</Link>
        </Button>
        <Button className="rounded-xl" onClick={handleCreate}>
          Create Deal
        </Button>
      </div>
    </div>
  );
}

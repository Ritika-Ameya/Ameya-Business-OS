import { Check, Layers, LayoutGrid, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PlaceholderCard } from "@/components/deals/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Deal Details", icon: LayoutGrid },
  { id: 2, label: "Components", icon: Layers },
  { id: 3, label: "Review", icon: Sparkles },
] as const;

interface CreateDealWizardProps {
  customerId: string;
  customerName: string;
  onSave: () => void;
}

export function CreateDealWizard({
  customerId,
  customerName,
  onSave,
}: CreateDealWizardProps) {
  const [step, setStep] = useState(1);

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
            Step {step} of {steps.length} · {steps[step - 1].label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((item, index) => {
          const isComplete = step > item.id;
          const isActive = step === item.id;
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isActive && "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : <Icon className="size-4" />}
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
                <div
                  className={cn(
                    "mx-1 h-px flex-1",
                    step > item.id ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={LayoutGrid}
            title="Deal Information"
            description="Name, type, and schedule"
            message="Deal details will be configured here."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Sparkles}
            title="Customer Context"
            description={customerName}
            message="This deal will be linked to the selected customer."
            accent="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={Layers}
            title="Service Components"
            description="Billable items"
            message="Components for this deal will be added here."
            accent="bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <PlaceholderCard
            icon={LayoutGrid}
            title="Pricing Structure"
            description="Rates and billing"
            message="Pricing details will be defined here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={Sparkles}
            title="Review Summary"
            description="Confirm before saving"
            message="A summary of your deal will appear here for review."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Check}
            title="Ready to Save"
            description="Placeholder flow"
            message="Click Save Deal to open the deal workspace."
            accent="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-6 sm:flex-row sm:justify-between">
        <Button variant="ghost" className="rounded-xl" asChild>
          <Link to={`/customers/${customerId}`}>Cancel</Link>
        </Button>
        <div className="flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {step < steps.length ? (
            <Button className="rounded-xl" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button className="rounded-xl" onClick={onSave}>
              Save Deal
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

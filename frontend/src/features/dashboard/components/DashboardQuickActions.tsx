import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AddCustomerDialog } from "@/features/customers/components/AddCustomerDialog";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { CustomerFormData } from "@/features/customers/types/customer";
import { cn } from "@/shared/utils";

const actions = [
  {
    key: "customer",
    label: "Opportunity / Customer",
    hint: "Create a new lead or account",
    className: "from-blue-500/15 to-sky-500/10 border-blue-500/20",
    iconClass: "bg-blue-500/15 text-blue-600",
  },
  {
    key: "deal",
    label: "Deal",
    hint: "Start a new commercial deal",
    href: "/deals",
    className: "from-indigo-500/15 to-violet-500/10 border-indigo-500/20",
    iconClass: "bg-indigo-500/15 text-indigo-600",
  },
  {
    key: "expense",
    label: "Expense",
    hint: "Log a business expense",
    href: "/expenses?action=add",
    className: "from-rose-500/15 to-pink-500/10 border-rose-500/20",
    iconClass: "bg-rose-500/15 text-rose-600",
  },
] as const;

export function DashboardQuickActions() {
  const { addCustomer } = useCustomers();
  const { stages } = useAppConfig();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = async (
    data: CustomerFormData,
    options?: { allowDuplicateCompanyName?: boolean }
  ) => {
    await addCustomer(data, stages, options);
    navigate("/customers");
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const content = (
            <div
              className={cn(
                "group flex h-full flex-col gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-card transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-elevated",
                action.className
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  action.iconClass
                )}
              >
                <Plus className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold tracking-tight">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.hint}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">
                Open <ArrowRight className="size-3.5" />
              </span>
            </div>
          );

          if (action.key === "customer") {
            return (
              <button
                key={action.key}
                type="button"
                className="text-left"
                onClick={() => setDialogOpen(true)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={action.key} to={action.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>

      <AddCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}

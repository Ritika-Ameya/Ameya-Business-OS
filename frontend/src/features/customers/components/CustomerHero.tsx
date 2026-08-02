import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { StageChangeDialog } from "@/features/customers/components/StageChangeDialog";
import { EditFollowUpDateDialog } from "@/features/customers/components/EditFollowUpDateDialog";
import { getCustomerRenewals } from "@/features/customers/utils/customer-workspace-utils";
import { formatCurrency, formatDate, formatPhoneForDisplay } from "@/shared/utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import {
  getCustomerBillingAddress,
  getCustomerServiceAddress,
} from "@/features/settings/utils/app-config-utils";
import {
  getStageById,
  getStagesForRecordType,
  recordTypeLabels,
} from "@/features/customers/utils/stage-utils";
import { cn } from "@/shared/utils";
import type { Customer, RecordType } from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";

interface CustomerHeroProps {
  customer: Customer;
}

function HeroMetric({
  label,
  value,
  detail,
  highlight,
  onClick,
  actionLabel,
}: {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/20 bg-white/15 px-3 py-3 shadow-sm backdrop-blur-md sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-[11px]">
          {label}
        </p>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="shrink-0 text-[10px] font-semibold text-white/90 underline-offset-2 hover:underline sm:text-[11px]"
          >
            {actionLabel ?? "Change"}
          </button>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 truncate text-sm font-bold tabular-nums text-white sm:text-base",
          highlight && "text-amber-200"
        )}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-0.5 truncate text-[10px] text-white/75 sm:text-[11px]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function CustomerHero({ customer }: CustomerHeroProps) {
  const { deals, components } = useDeals();
  const { stages } = useAppConfig();
  const { changeCustomerStage, updateRecordType, updateCustomerFollowUp } = useCustomers();
  const { refreshDashboard } = useDashboard();
  const [pendingStage, setPendingStage] = useState<SettingsStage | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);

  const activeDealsCount = deals.filter(
    (deal) => deal.customerId === customer.id && deal.status !== "completed"
  ).length;
  const renewals = getCustomerRenewals(customer.id, deals, components);
  const nextRenewal = renewals[0];
  const nextRenewalValue = nextRenewal ? formatDate(nextRenewal.dueDate) : "—";
  const nextRenewalDetail = nextRenewal
    ? renewals.length > 1
      ? `${nextRenewal.componentName} · +${renewals.length - 1} more`
      : nextRenewal.componentName
    : undefined;

  const currentStage = getStageById(stages, customer.currentStageId);
  const applicableStages = getStagesForRecordType(stages, customer.recordType);

  const handleStageSelect = (stageId: string) => {
    if (stageId === customer.currentStageId) return;

    const stage = getStageById(stages, stageId);
    if (!stage) return;

    setPendingStage(stage);
    setStageDialogOpen(true);
  };

  const handleStageConfirm = (data: { nextActionDate?: string; notes?: string }) => {
    if (!pendingStage) return;

    void changeCustomerStage(
      customer.id,
      {
        stageId: pendingStage.id,
        nextActionDate: data.nextActionDate,
        notes: data.notes,
      },
      stages
    ).then(() => refreshDashboard({ silent: true }));
    setPendingStage(null);
  };

  const handleFollowUpSave = async (data: {
    nextActionDate: string;
    notes?: string;
  }) => {
    await updateCustomerFollowUp(customer.id, data);
    await refreshDashboard({ silent: true });
  };

  const handleRecordTypeChange = (recordType: RecordType) => {
    if (recordType === customer.recordType) return;
    void updateRecordType(customer.id, recordType, stages);
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-card/95 shadow-elevated dark:border-white/10">
        <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 p-6 text-white sm:p-8">
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-teal-300/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl font-bold shadow-lg ring-2 ring-white/40 backdrop-blur-sm"
                  aria-hidden
                >
                  {(customer.company || customer.name)
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="capitalize border-white/25 bg-white/15 text-white">
                      {customer.status}
                    </Badge>
                    {customer.outstanding > 0 && (
                      <Badge className="border-amber-300/40 bg-amber-400/20 text-amber-50">
                        Outstanding
                      </Badge>
                    )}
                    {activeDealsCount > 0 && (
                      <Badge className="border-white/25 bg-white/15 text-white">
                        {activeDealsCount} active{" "}
                        {activeDealsCount === 1 ? "deal" : "deals"}
                      </Badge>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                      {customer.name}
                    </h1>
                    {customer.company && (
                      <p className="mt-1 flex min-w-0 items-start gap-2 text-white/80">
                        <Building2 className="mt-0.5 size-4 shrink-0" />
                        <span className="break-words">{customer.company}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid max-w-lg gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Record Type
                  </p>
                  <Select
                    value={customer.recordType}
                    onValueChange={(value) => handleRecordTypeChange(value as RecordType)}
                  >
                    <SelectTrigger className="w-full rounded-xl border-white/30 bg-white text-slate-900 shadow-sm hover:bg-white/95 [&_svg]:text-slate-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opportunity">
                        {recordTypeLabels.opportunity}
                      </SelectItem>
                      <SelectItem value="customer">{recordTypeLabels.customer}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Current Stage
                  </p>
                  <Select
                    value={customer.currentStageId ?? ""}
                    onValueChange={handleStageSelect}
                  >
                    <SelectTrigger className="w-full rounded-xl border-white/30 bg-white text-slate-900 shadow-sm hover:bg-white/95 [&_svg]:text-slate-500">
                      <SelectValue placeholder="Select stage">
                        {currentStage ? (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                            <span
                              className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: currentStage.color }}
                            />
                            {currentStage.name}
                          </span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {applicableStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-white/85">
                <span className="flex min-w-0 items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <span className="break-all">{formatPhoneForDisplay(customer.phone)}</span>
                </span>
                {customer.email && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0" />
                    <span className="break-all">{customer.email}</span>
                  </span>
                )}
                {customer.gst && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Receipt className="size-4 shrink-0" />
                    <span className="break-all">GST: {customer.gst}</span>
                  </span>
                )}
                {customer.vatId && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Receipt className="size-4 shrink-0" />
                    <span className="break-all">VAT ID: {customer.vatId}</span>
                  </span>
                )}
                {customer.licenseNo && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Receipt className="size-4 shrink-0" />
                    <span className="break-all">License No: {customer.licenseNo}</span>
                  </span>
                )}
                {getCustomerBillingAddress(customer) && (
                  <span className="flex min-w-0 items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="break-words">
                      Billing: {getCustomerBillingAddress(customer)}
                    </span>
                  </span>
                )}
                {getCustomerServiceAddress(customer) &&
                  getCustomerServiceAddress(customer) !==
                    getCustomerBillingAddress(customer) && (
                    <span className="flex min-w-0 items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0" />
                      <span className="break-words">
                        Service: {getCustomerServiceAddress(customer)}
                      </span>
                    </span>
                  )}
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:w-80 xl:grid-cols-2 2xl:w-96">
              <HeroMetric
                label="Outstanding"
                value={formatCurrency(customer.outstanding)}
                highlight={customer.outstanding > 0}
              />
              <HeroMetric
                label="Business Value"
                value={formatCurrency(customer.businessValue)}
              />
              <HeroMetric
                label="Last Payment"
                value={formatDate(customer.lastPayment)}
              />
              <HeroMetric
                label="Next Renewal"
                value={nextRenewalValue}
                detail={nextRenewalDetail}
              />
              <HeroMetric
                label="Next Action"
                value={formatDate(customer.nextActionDate)}
                highlight={Boolean(customer.nextActionDate)}
                onClick={() => setFollowUpDialogOpen(true)}
                actionLabel="Change"
              />
              <HeroMetric
                label="Active Deals"
                value={String(activeDealsCount)}
              />
            </div>
          </div>
        </div>
      </div>

      <StageChangeDialog
        open={stageDialogOpen}
        onOpenChange={(open) => {
          setStageDialogOpen(open);
          if (!open) setPendingStage(null);
        }}
        stage={pendingStage}
        initialNextActionDate={customer.nextActionDate}
        onConfirm={handleStageConfirm}
      />

      <EditFollowUpDateDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        currentDate={customer.nextActionDate}
        entityLabel={customer.recordType === "opportunity" ? "opportunity" : "customer"}
        onSave={handleFollowUpSave}
      />
    </>
  );
}

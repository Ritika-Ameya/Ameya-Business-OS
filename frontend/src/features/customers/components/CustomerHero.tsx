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
import { formatCurrency, formatDate, formatPhoneForDisplay } from "@/shared/utils";
import {
  getCustomerBillingAddress,
  getCustomerServiceAddress,
} from "@/features/settings/utils/app-config-utils";
import {
  getStageById,
  getStageColorStyle,
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
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 shadow-sm backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-bold tabular-nums text-white sm:text-base",
          highlight && "text-amber-200"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CustomerHero({ customer }: CustomerHeroProps) {
  const { deals } = useDeals();
  const { stages } = useAppConfig();
  const { changeCustomerStage, updateRecordType } = useCustomers();
  const [pendingStage, setPendingStage] = useState<SettingsStage | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const activeDealsCount = deals.filter(
    (deal) => deal.customerId === customer.id && deal.status !== "completed"
  ).length;

  const currentStage = getStageById(stages, customer.currentStageId);
  const applicableStages = getStagesForRecordType(stages, customer.recordType);

  const handleStageSelect = (stageId: string) => {
    if (stageId === customer.currentStageId) return;

    const stage = getStageById(stages, stageId);
    if (!stage) return;

    if (stage.dateRequired || stage.notesRequired) {
      setPendingStage(stage);
      setStageDialogOpen(true);
      return;
    }

    void changeCustomerStage(customer.id, { stageId }, stages);
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
    );
    setPendingStage(null);
  };

  const handleRecordTypeChange = (recordType: RecordType) => {
    if (recordType === customer.recordType) return;
    void updateRecordType(customer.id, recordType, stages);
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-card/95 shadow-elevated dark:border-white/10">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white sm:p-8">
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-teal-300/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
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

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {customer.name}
                    </h1>
                    {customer.company && (
                      <p className="mt-1 flex items-center gap-2 text-white/80">
                        <Building2 className="size-4" />
                        {customer.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:max-w-lg">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Record Type
                  </p>
                  <Select
                    value={customer.recordType}
                    onValueChange={(value) => handleRecordTypeChange(value as RecordType)}
                  >
                    <SelectTrigger className="rounded-xl border-white/20 bg-white/15 text-white backdrop-blur-sm">
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
                    <SelectTrigger className="rounded-xl border-white/20 bg-white/15 text-white backdrop-blur-sm">
                      <SelectValue placeholder="Select stage">
                        {currentStage && (
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-sm"
                            style={getStageColorStyle(currentStage.color)}
                          >
                            {currentStage.name}
                          </span>
                        )}
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

              <div className="flex flex-col gap-2 text-sm text-white/85 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <span className="truncate">{formatPhoneForDisplay(customer.phone)}</span>
                </span>
                {customer.email && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </span>
                )}
                {customer.gst && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Receipt className="size-4 shrink-0" />
                    <span className="truncate">GST: {customer.gst}</span>
                  </span>
                )}
                {getCustomerBillingAddress(customer) && (
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">
                      Billing: {getCustomerBillingAddress(customer)}
                    </span>
                  </span>
                )}
                {getCustomerServiceAddress(customer) &&
                  getCustomerServiceAddress(customer) !==
                    getCustomerBillingAddress(customer) && (
                    <span className="flex min-w-0 items-center gap-2">
                      <MapPin className="size-4 shrink-0" />
                      <span className="truncate">
                        Service: {getCustomerServiceAddress(customer)}
                      </span>
                    </span>
                  )}
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 lg:max-w-xl">
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
                value={formatDate(customer.nextRenewal)}
              />
              <HeroMetric
                label="Next Action"
                value={formatDate(customer.nextActionDate)}
                highlight={Boolean(customer.nextActionDate)}
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
        onConfirm={handleStageConfirm}
      />
    </>
  );
}

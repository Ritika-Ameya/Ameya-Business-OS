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
import { formatCurrency, formatDate } from "@/shared/utils";
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
import type { Customer, CustomerStatus, RecordType } from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";

const statusStyles: Record<CustomerStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  prospect: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

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
    <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold sm:text-base",
          highlight && "text-amber-700 dark:text-amber-400"
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
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn("capitalize", statusStyles[customer.status])}
                >
                  {customer.status}
                </Badge>
                {customer.outstanding > 0 && (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
                    Outstanding
                  </Badge>
                )}
                {activeDealsCount > 0 && (
                  <Badge variant="outline">
                    {activeDealsCount} active {activeDealsCount === 1 ? "deal" : "deals"}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {customer.name}
                </h1>
                {customer.company && (
                  <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4" />
                    {customer.company}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:max-w-lg">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Record Type
                  </p>
                  <Select
                    value={customer.recordType}
                    onValueChange={(value) => handleRecordTypeChange(value as RecordType)}
                  >
                    <SelectTrigger className="rounded-xl">
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
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current Stage
                  </p>
                  <Select
                    value={customer.currentStageId ?? ""}
                    onValueChange={handleStageSelect}
                  >
                    <SelectTrigger className="rounded-xl">
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

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-2">
                    <Mail className="size-4" />
                    {customer.email}
                  </span>
                )}
                {customer.gst && (
                  <span className="flex items-center gap-2">
                    <Receipt className="size-4" />
                    GST: {customer.gst}
                  </span>
                )}
                {getCustomerBillingAddress(customer) && (
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    Billing: {getCustomerBillingAddress(customer)}
                  </span>
                )}
                {getCustomerServiceAddress(customer) &&
                  getCustomerServiceAddress(customer) !==
                    getCustomerBillingAddress(customer) && (
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      Service: {getCustomerServiceAddress(customer)}
                    </span>
                  )}
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-xl lg:grid-cols-2">
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

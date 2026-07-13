import { Calendar, Handshake, Layers, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { StageChangeDialog } from "@/features/customers/components/StageChangeDialog";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import {
  getStageById,
  getStageColorStyle,
  getStagesForRecordType,
} from "@/features/customers/utils/stage-utils";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { formatDate } from "@/shared/utils/format-date";
import { cn } from "@/shared/utils";
import type { Deal, DealStatus } from "@/features/deals/types/deal";
import type { SettingsStage } from "@/features/settings/types/settings";

const statusStyles: Record<DealStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "on-hold": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

interface DealHeroProps {
  deal: Deal;
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

export function DealHero({ deal }: DealHeroProps) {
  const { stages } = useAppConfig();
  const { getCustomer } = useCustomers();
  const { changeDealStage } = useDeals();
  const [pendingStage, setPendingStage] = useState<SettingsStage | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const customer = getCustomer(deal.customerId);
  const recordType = customer?.recordType ?? "customer";
  const currentStage = getStageById(stages, deal.currentStageId);
  const applicableStages = getStagesForRecordType(stages, recordType);

  const handleStageSelect = (stageId: string) => {
    if (stageId === deal.currentStageId) return;

    const stage = getStageById(stages, stageId);
    if (!stage) return;

    if (stage.dateRequired || stage.notesRequired) {
      setPendingStage(stage);
      setStageDialogOpen(true);
      return;
    }

    void changeDealStage(deal.id, { stageId }, stages);
  };

  const handleStageConfirm = (data: { nextActionDate?: string; notes?: string }) => {
    if (!pendingStage) return;

    void changeDealStage(
      deal.id,
      {
        stageId: pendingStage.id,
        nextActionDate: data.nextActionDate,
        notes: data.notes,
      },
      stages
    );
    setPendingStage(null);
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
                  className={cn("capitalize", statusStyles[deal.status])}
                >
                  {deal.status.replace("-", " ")}
                </Badge>
                {deal.componentsCount > 0 && (
                  <Badge variant="outline">
                    {deal.componentsCount}{" "}
                    {deal.componentsCount === 1 ? "component" : "components"}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {deal.title}
                </h1>
                <Link
                  to={`/customers/${deal.customerId}`}
                  className="mt-1 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <User className="size-4" />
                  {deal.customerName}
                  {customer?.company && (
                    <span className="text-muted-foreground/80">· {customer.company}</span>
                  )}
                </Link>
              </div>

              <div className="max-w-xs space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current Stage
                </p>
                <Select
                  value={deal.currentStageId ?? ""}
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

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Handshake className="size-4" />
                  Deal workspace
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Started {formatDate(deal.startDate)}
                </span>
                {deal.nextRenewal && (
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" />
                    Renewal {formatDate(deal.nextRenewal)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md lg:grid-cols-2">
              <HeroMetric label="Start Date" value={formatDate(deal.startDate)} />
              <HeroMetric label="Next Renewal" value={formatDate(deal.nextRenewal)} />
              <HeroMetric
                label="Next Action"
                value={formatDate(deal.nextActionDate)}
                highlight={Boolean(deal.nextActionDate)}
              />
              <HeroMetric label="Components" value={String(deal.componentsCount)} />
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

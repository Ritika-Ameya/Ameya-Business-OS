import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getActiveDealTypes } from "@/features/settings/utils/app-config-utils";
import { renewalFrequencyLabels } from "@/features/deals/utils/deal-utils";
import type { Deal, DealFormData } from "@/features/deals/types/deal";

function formFromDeal(deal: Deal): DealFormData {
  return {
    title: deal.title,
    dealType: deal.dealType ?? "",
    contractValue: String(deal.contractValue ?? ""),
    startDate: deal.startDate,
    renewalFrequency: deal.renewalFrequency ?? "",
    description: deal.description ?? "",
  };
}

interface EditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  onSave: (data: DealFormData) => void;
}

export function EditDealDialog({ open, onOpenChange, deal, onSave }: EditDealDialogProps) {
  const { dealTypes } = useAppConfig();
  const activeDealTypes = getActiveDealTypes(dealTypes);
  const [form, setForm] = useState(() => formFromDeal(deal));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(formFromDeal(deal));
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Deal Name</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Deal Type</Label>
              <Select
                value={form.dealType}
                onValueChange={(value) => setForm((p) => ({ ...p, dealType: value }))}
              >
                <SelectTrigger className="rounded-xl">
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
            </div>
            <div className="space-y-2">
              <Label>Contract Value</Label>
              <Input
                value={form.contractValue}
                onChange={(e) => setForm((p) => ({ ...p, contractValue: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Renewal Frequency</Label>
              <Select
                value={form.renewalFrequency}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, renewalFrequency: value as DealFormData["renewalFrequency"] }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(renewalFrequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

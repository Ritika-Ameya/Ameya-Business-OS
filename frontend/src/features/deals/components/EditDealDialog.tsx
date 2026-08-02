import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useDeals } from "@/features/deals/hooks/use-deals";
import { getActiveDealTypes } from "@/features/settings/utils/app-config-utils";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { Deal, DealFormData } from "@/features/deals/types/deal";

interface EditDealDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formFromDeal(deal: Deal | null): DealFormData {
  if (!deal) {
    return {
      title: "",
      dealType: "",
      contractValue: "",
      startDate: "",
      description: "",
    };
  }
  return {
    title: deal.title,
    dealType: deal.dealType || "",
    contractValue: String(deal.contractValue ?? ""),
    startDate: deal.startDate,
    description: deal.description || "",
  };
}

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const { updateDeal } = useDeals();
  const { dealTypes } = useAppConfig();
  const activeDealTypes = getActiveDealTypes(dealTypes);
  const [form, setForm] = useState<DealFormData>(() => formFromDeal(deal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(formFromDeal(deal));
    setError(null);
  }, [open, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    if (!form.title.trim() || !form.dealType || !form.startDate) {
      setError("Deal name, type, and start date are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDeal(deal.id, form);
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>Update deal details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-deal-title">Deal Name</Label>
            <Input
              id="edit-deal-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="rounded-xl"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-deal-type">Deal Type</Label>
            <Select
              value={form.dealType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, dealType: value }))
              }
              disabled={saving}
            >
              <SelectTrigger id="edit-deal-type" className="w-full rounded-xl">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-deal-value">Contract Value</Label>
              <Input
                id="edit-deal-value"
                type="number"
                value={form.contractValue}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contractValue: e.target.value }))
                }
                className="rounded-xl"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deal-start">Start Date</Label>
              <Input
                id="edit-deal-start"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="rounded-xl"
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-deal-description">Description</Label>
            <Textarea
              id="edit-deal-description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="min-h-20 rounded-xl"
              disabled={saving}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

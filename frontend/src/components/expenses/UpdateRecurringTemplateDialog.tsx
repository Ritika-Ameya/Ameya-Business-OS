import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatExpenseCurrency } from "@/lib/expense-utils";

interface UpdateRecurringTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseName: string;
  oldAmount: number;
  newAmount: number;
  onConfirm: (updateTemplate: boolean) => void;
}

export function UpdateRecurringTemplateDialog({
  open,
  onOpenChange,
  expenseName,
  oldAmount,
  newAmount,
  onConfirm,
}: UpdateRecurringTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update recurring template?</DialogTitle>
          <DialogDescription>
            You changed the amount for <strong>{expenseName}</strong> from{" "}
            {formatExpenseCurrency(oldAmount)} to {formatExpenseCurrency(newAmount)}.
            Should future recurring entries use the new amount?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              onConfirm(false);
              onOpenChange(false);
            }}
          >
            No, this month only
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => {
              onConfirm(true);
              onOpenChange(false);
            }}
          >
            Yes, update template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Badge } from "@/components/ui/badge";
import { transactionStatusLabels } from "@/lib/expense-utils";
import { cn } from "@/lib/utils";
import type { ExpenseTransactionStatus } from "@/types/expense";

const statusStyles: Record<ExpenseTransactionStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  partial: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cancelled: "bg-muted text-muted-foreground",
};

interface ExpenseStatusBadgeProps {
  status: ExpenseTransactionStatus;
  className?: string;
}

export function ExpenseStatusBadge({ status, className }: ExpenseStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium capitalize", statusStyles[status], className)}
    >
      {transactionStatusLabels[status]}
    </Badge>
  );
}

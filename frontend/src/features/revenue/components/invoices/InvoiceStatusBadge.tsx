import { Badge } from "@/shared/ui/badge";
import { invoiceStatusLabels, invoiceStatusStyles } from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import type { InvoiceStatus } from "@/features/revenue/types/invoice";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", invoiceStatusStyles[status])}>
      {invoiceStatusLabels[status]}
    </Badge>
  );
}

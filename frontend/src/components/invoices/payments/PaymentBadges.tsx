import { Badge } from "@/components/ui/badge";
import {
  paymentModeLabels,
  paymentModeStyles,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/lib/payment-utils";
import { cn } from "@/lib/utils";
import type { PaymentMode, PaymentStatus } from "@/types/payment";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="secondary" className={cn(paymentStatusStyles[status])}>
      {paymentStatusLabels[status]}
    </Badge>
  );
}

export function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  return (
    <Badge variant="secondary" className={cn(paymentModeStyles[mode])}>
      {paymentModeLabels[mode]}
    </Badge>
  );
}

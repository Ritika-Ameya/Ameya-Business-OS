import { Badge } from "@/components/ui/badge";
import { useAppConfig } from "@/hooks/use-app-config";
import {
  getPaymentModeLabel,
  getPaymentModeStyle,
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
  const { paymentMethods } = useAppConfig();

  return (
    <Badge variant="secondary" className={cn(getPaymentModeStyle(mode))}>
      {getPaymentModeLabel(mode, paymentMethods)}
    </Badge>
  );
}

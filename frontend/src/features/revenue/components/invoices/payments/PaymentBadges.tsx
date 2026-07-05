import { Badge } from "@/shared/ui/badge";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import {
  getPaymentModeLabel,
  getPaymentModeStyle,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/features/revenue/utils/payment-utils";
import { cn } from "@/shared/utils";
import type { PaymentMode, PaymentStatus } from "@/features/revenue/types/payment";

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

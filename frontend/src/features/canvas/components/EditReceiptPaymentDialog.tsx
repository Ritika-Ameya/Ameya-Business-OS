import { useEffect, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { ReceivedAccountToggle } from "@/features/revenue/components/invoices/payments/ReceivedAccountToggle";
import {
  parseTdsInput,
  TdsDeductionFields,
} from "@/features/revenue/components/invoices/payments/TdsDeductionFields";
import type { PaymentAccount, PaymentMode } from "@/features/revenue/types/payment";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
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
import { formatCurrency } from "@/shared/utils";

export interface EditableReceiptPayment {
  receiptId: string;
  index: number;
  amount: number;
  paymentDate: string;
  mode: string;
  receivedAccount: PaymentAccount;
  tdsAmount: number;
  tdsSettles: boolean;
  outstanding: number;
  billTotal: number;
  beforeGst: number;
  alreadyCut: number;
  cashAlready: number;
  reason?: string;
  installmentCount?: number;
  thisInstallmentLabel?: string;
}

const round = (value: number) => Math.round(value * 100) / 100;

export function EditReceiptPaymentDialog({
  payment,
  onOpenChange,
  onSaved,
}: {
  payment: EditableReceiptPayment | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void | Promise<void>;
}) {
  const { paymentMethods } = useAppConfig();
  const methods = getActivePaymentMethods(paymentMethods);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [mode, setMode] = useState("");
  const [receivedAccount, setReceivedAccount] = useState<PaymentAccount>("gst");
  const [tdsAmount, setTdsAmount] = useState("");
  const [tdsSettles, setTdsSettles] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setAmount(String(payment.amount));
    setPaymentDate(payment.paymentDate);
    setMode(payment.mode || methods[0]?.slug || "");
    setReceivedAccount(payment.receivedAccount);
    setTdsAmount(payment.tdsAmount > 0 ? String(payment.tdsAmount) : "");
    setTdsSettles(Boolean(payment.tdsSettles && payment.tdsAmount > 0));
    setError("");
    setPending(false);
  }, [payment, methods]);

  const cash = Number(amount.replace(/,/g, ""));
  const tdsValue = parseTdsInput(tdsAmount, payment?.beforeGst ?? 0);
  const settledTds = tdsSettles ? tdsValue : 0;
  const outstanding = payment?.outstanding ?? 0;

  const submit = async () => {
    if (!payment || pending) return;
    if (!Number.isFinite(cash) || cash <= 0) {
      setError("Enter the amount received.");
      return;
    }
    if (!paymentDate) {
      setError("Choose the payment date.");
      return;
    }
    if (!mode) {
      setError("Choose the payment mode.");
      return;
    }
    if (round(cash + settledTds) > outstanding + 0.001) {
      setError(
        `Cash plus counted TDS cannot be more than the ${formatCurrency(outstanding)} still left on the bill.`,
      );
      return;
    }
    setPending(true);
    setError("");
    try {
      await canvasApi.updateReceiptPayment(payment.receiptId, payment.index, {
        amount: round(cash),
        paymentDate,
        mode,
        receivedAccount,
        tdsAmount: tdsValue,
        tdsSettles: settledTds > 0,
      });
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  return (
    <Dialog open={Boolean(payment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        {payment ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit payment</DialogTitle>
              <DialogDescription>
                {payment.reason
                  ? `${payment.reason}. `
                  : ""}
                Bill left for this edit: {formatCurrency(outstanding)}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {Number.isFinite(cash) && cash > 0 ? (
                <p
                  className={
                    round(Math.max(0, outstanding - cash - settledTds)) <= 0.009
                      ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
                      : "rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-sm font-semibold text-amber-950 dark:text-amber-100"
                  }
                  role="status"
                >
                  {round(Math.max(0, outstanding - cash - settledTds)) <= 0.009
                    ? "Nothing left on this bill after this payment."
                    : `${formatCurrency(round(Math.max(0, outstanding - cash - settledTds)))} still left on the bill after this payment.`}
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="edit-receipt-amount">Money you received</Label>
                <Input
                  id="edit-receipt-amount"
                  inputMode="decimal"
                  value={amount}
                  disabled={pending}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-receipt-date">Payment date</Label>
                <Input
                  id="edit-receipt-date"
                  type="date"
                  value={paymentDate}
                  disabled={pending}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment mode</Label>
                <Select value={mode || undefined} onValueChange={setMode} disabled={pending}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method.slug} value={method.slug as PaymentMode}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ReceivedAccountToggle
                value={receivedAccount}
                onChange={setReceivedAccount}
                disabled={pending}
              />
              <TdsDeductionFields
                tdsAmount={tdsAmount}
                onTdsAmountChange={setTdsAmount}
                settles={tdsSettles}
                onSettlesChange={setTdsSettles}
                disabled={pending}
                cash={Number.isFinite(cash) ? cash : 0}
                outstanding={outstanding}
                billTotal={payment.billTotal}
                beforeGst={payment.beforeGst}
                alreadyCut={payment.alreadyCut}
                cashAlready={payment.cashAlready}
                installmentCount={payment.installmentCount}
                thisInstallmentLabel={payment.thisInstallmentLabel}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={pending} onClick={() => void submit()}>
                Save payment
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

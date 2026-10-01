import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import type { CanvasBoard, CanvasCard } from "@/features/canvas/types/canvas";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import {
  DEFAULT_REMOVE_GST_REASON,
  PaidWithoutGstPrompt,
} from "@/features/revenue/components/invoices/payments/PaidWithoutGstPrompt";
import { ReceivedAccountToggle } from "@/features/revenue/components/invoices/payments/ReceivedAccountToggle";
import type { PaymentAccount } from "@/features/revenue/types/payment";
import { isBaseOnlyPayment } from "@/features/revenue/utils/invoice-utils";
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
import { formatCurrency, formatDate } from "@/shared/utils";

const round = (value: number) => Math.round(value * 100) / 100;

export function MarkReceiptPaidDialog({
  card,
  today,
  onOpenChange,
  onBoard,
}: {
  card: CanvasCard | null;
  today: string;
  onOpenChange: (open: boolean) => void;
  onBoard: (board: CanvasBoard) => void;
}) {
  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        {card ? (
          <MarkPaidForm
            key={card.id}
            card={card}
            today={today}
            onDone={(board) => {
              onBoard(board);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidForm({
  card,
  today,
  onDone,
  onCancel,
}: {
  card: CanvasCard;
  today: string;
  onDone: (board: CanvasBoard) => void;
  onCancel: () => void;
}) {
  const { invoices, refreshInvoices } = useRevenue();
  const { paymentMethods } = useAppConfig();
  const methods = getActivePaymentMethods(paymentMethods);
  const expected = round(card.expectedAmount ?? 0);

  const openInvoices = useMemo(
    () =>
      invoices
        .filter(
          (invoice) =>
            invoice.customerId === card.customerId &&
            (invoice.status === "due" || invoice.status === "partially_paid") &&
            invoice.outstanding > 0 &&
            (!card.invoiceId || invoice.id === card.invoiceId)
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices, card.customerId, card.invoiceId]
  );

  const defaultAmount = (outstanding: number) =>
    String(round(expected > 0 ? Math.min(expected, outstanding) : outstanding));

  const initialInvoice =
    openInvoices.find((invoice) => invoice.id === card.invoiceId) ??
    (openInvoices.length === 1 ? openInvoices[0] : undefined);
  const [invoiceId, setInvoiceId] = useState(initialInvoice?.id ?? "");
  const [amount, setAmount] = useState(initialInvoice ? defaultAmount(initialInvoice.outstanding) : "");
  const [paymentDate, setPaymentDate] = useState(today);
  const [mode, setMode] = useState(methods[0]?.slug ?? "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [removeGst, setRemoveGst] = useState(false);
  const [removeGstReason, setRemoveGstReason] = useState(DEFAULT_REMOVE_GST_REASON);
  const [accountChoice, setAccountChoice] = useState<PaymentAccount | null>(null);

  const invoice = openInvoices.find((item) => item.id === invoiceId);
  const parsedAmount = Number(amount.replace(/,/g, ""));
  const showGstPrompt = invoice !== undefined && isBaseOnlyPayment(invoice, parsedAmount);
  const convertToNonGst = showGstPrompt && removeGst;
  const receivedAccount: PaymentAccount =
    accountChoice ?? (convertToNonGst || invoice?.billingType === "non_gst" ? "other" : "gst");
  const expectedAfterGst =
    convertToNonGst && invoice && invoice.amount > 0
      ? round((expected * invoice.subtotal) / invoice.amount)
      : expected;
  const remaining = round(
    expectedAfterGst - (Number.isFinite(parsedAmount) ? parsedAmount : 0)
  );

  const submit = async () => {
    if (pending) return;
    if (!invoice) {
      setError("Choose the invoice this payment is against.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter the amount received.");
      return;
    }
    if (parsedAmount > invoice.outstanding + 0.001) {
      setError(`Amount cannot be more than the invoice balance of ${formatCurrency(invoice.outstanding)}.`);
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
    if (convertToNonGst && !removeGstReason.trim()) {
      setError("Give a reason for removing GST.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const board = await canvasApi.markPaid({
        cardId: card.id,
        invoiceId: invoice.id,
        amount: round(parsedAmount),
        paymentDate,
        mode,
        referenceNumber: referenceNumber.trim(),
        removeGstReason: convertToNonGst ? removeGstReason.trim() : undefined,
        receivedAccount,
      });
      onDone(board);
      void refreshInvoices();
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogDescription>
          {card.companyName} · expected {formatCurrency(expected)}
          {card.expectedDate ? ` on ${formatDate(card.expectedDate)}` : ""}. Which invoice is this
          payment against?
        </DialogDescription>
      </DialogHeader>

      {openInvoices.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
          <p>
            {card.invoiceId
              ? `Invoice ${card.invoiceNumber || ""} has no balance left to pay.`
              : `${card.companyName} has no open invoice with a balance.`}{" "}
            A payment is always recorded against an invoice, so create or open the invoice first.
          </p>
          <Link to={`/customers/${card.customerId}`} className="font-medium text-primary hover:underline">
            Open account
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-invoice">Invoice</Label>
            <Select
              value={invoiceId || undefined}
              disabled={Boolean(card.invoiceId) || pending}
              onValueChange={(value) => {
                setInvoiceId(value);
                const next = openInvoices.find((item) => item.id === value);
                if (next) setAmount(defaultAmount(next.outstanding));
                setError("");
              }}
            >
              <SelectTrigger id="mark-paid-invoice" className="w-full">
                <SelectValue placeholder="Choose invoice" />
              </SelectTrigger>
              <SelectContent>
                {openInvoices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.invoiceNo} · {formatCurrency(item.outstanding)} due
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {invoice ? (
              <p className="text-xs text-muted-foreground">
                {invoice.dealTitle ? `${invoice.dealTitle} · ` : ""}Invoice total{" "}
                {formatCurrency(invoice.amount)} · balance {formatCurrency(invoice.outstanding)} · due{" "}
                {formatDate(invoice.dueDate)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mark-paid-amount">Amount received</Label>
              <Input
                id="mark-paid-amount"
                inputMode="decimal"
                value={amount}
                disabled={pending}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mark-paid-date">Payment date</Label>
              <Input
                id="mark-paid-date"
                type="date"
                value={paymentDate}
                disabled={pending}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mark-paid-mode">Payment mode</Label>
              <Select value={mode || undefined} disabled={pending} onValueChange={setMode}>
                <SelectTrigger id="mark-paid-mode" className="w-full">
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method.id} value={method.slug}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mark-paid-reference">Reference (optional)</Label>
              <Input
                id="mark-paid-reference"
                value={referenceNumber}
                disabled={pending}
                onChange={(event) => setReferenceNumber(event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Received in account</Label>
              <ReceivedAccountToggle
                value={receivedAccount}
                onChange={setAccountChoice}
                disabled={pending}
              />
            </div>
          </div>

          {showGstPrompt && invoice ? (
            <PaidWithoutGstPrompt
              invoice={invoice}
              checked={removeGst}
              onCheckedChange={(checked) => {
                setRemoveGst(checked);
                setAccountChoice(null);
              }}
              reason={removeGstReason}
              onReasonChange={setRemoveGstReason}
              disabled={pending}
            />
          ) : null}

          {expected > 0 && remaining > 0.009 && Number.isFinite(parsedAmount) && parsedAmount > 0 ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              This is a part payment. {formatCurrency(remaining)} stays expected and keeps carrying
              forward until it is paid.
            </p>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        {openInvoices.length > 0 ? (
          <Button type="button" disabled={pending || !invoice} onClick={() => void submit()}>
            {pending ? "Recording…" : "Confirm payment"}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

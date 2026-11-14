import { useMemo, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import type { CanvasBoard, CanvasCard } from "@/features/canvas/types/canvas";
import { installmentSiblings } from "@/features/canvas/utils/canvas-utils";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import {
  DEFAULT_REMOVE_GST_REASON,
  PaidWithoutGstPrompt,
} from "@/features/revenue/components/invoices/payments/PaidWithoutGstPrompt";
import { ReceivedAccountToggle } from "@/features/revenue/components/invoices/payments/ReceivedAccountToggle";
import {
  parseTdsInput,
  TdsDeductionFields,
} from "@/features/revenue/components/invoices/payments/TdsDeductionFields";
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

/** Full bill before GST. Earlier tax cuts do not shrink this base. */
function billBeforeGst(card: CanvasCard): number {
  const percent = Number(card.gstPercent) || 0;
  const original = card.history?.originalAmount ?? 0;
  const inclusive = original > 0 ? original : (card.expectedAmount ?? 0);
  if (percent > 0 && inclusive > 0) return round(inclusive / (1 + percent / 100));
  if (original > 0) return round(original);
  if ((card.gstAmount ?? 0) > 0.009 && card.amountExGst != null) return card.amountExGst;
  return round(card.expectedAmount ?? 0);
}

function cardInclusive(card: CanvasCard): number {
  const original = card.history?.originalAmount ?? 0;
  return original > 0 ? original : round(card.expectedAmount ?? 0);
}

export function MarkReceiptPaidDialog({
  board,
  card,
  today,
  onOpenChange,
  onBoard,
}: {
  board: CanvasBoard | null;
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
            board={board}
            card={card}
            today={today}
            onDone={(next) => {
              onBoard(next);
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
  board,
  card,
  today,
  onDone,
  onCancel,
}: {
  board: CanvasBoard | null;
  card: CanvasCard;
  today: string;
  onDone: (board: CanvasBoard) => void;
  onCancel: () => void;
}) {
  const { invoices, payments, refreshInvoices } = useRevenue();
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
  const [tdsAmount, setTdsAmount] = useState("");
  const [tdsSettles, setTdsSettles] = useState(false);

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
  const historyOriginal = card.history?.originalAmount ?? 0;
  const seriesParts = useMemo(() => {
    const siblings = board ? installmentSiblings(card, board.cards) : [];
    return siblings.length > 1 ? siblings : [card];
  }, [board, card]);
  const isSeries = seriesParts.length > 1;
  const useInvoiceBase = Boolean(
    invoice &&
      (card.invoiceId === invoice.id ||
        Math.abs(invoice.amount - expected) < 1 ||
        Math.abs(invoice.outstanding - expected) < 1 ||
        (historyOriginal > 0 && Math.abs(invoice.amount - historyOriginal) < 1)),
  );
  /** 10% TDS is once on the full deal/series base — not 10% of each installment. */
  const beforeGstBase = useInvoiceBase && invoice
    ? invoice.billingType === "non_gst" || convertToNonGst
      ? invoice.subtotal || invoice.amount
      : invoice.subtotal
    : round(seriesParts.reduce((sum, part) => sum + billBeforeGst(part), 0));
  const tdsValue = parseTdsInput(tdsAmount, beforeGstBase);
  const settledTds = tdsSettles ? tdsValue : 0;
  const outstandingCap = invoice ? invoice.outstanding : expectedAfterGst;
  const billTotal = convertToNonGst
    ? beforeGstBase
    : useInvoiceBase && invoice
      ? invoice.amount
      : round(seriesParts.reduce((sum, part) => sum + cardInclusive(part), 0));
  const invoicePayments =
    useInvoiceBase && invoice
      ? payments.filter((payment) => payment.invoiceId === invoice.id && payment.status === "received")
      : [];
  const priorPayments =
    invoicePayments.length > 0
      ? invoicePayments.map((payment) => ({
          amount: payment.amount,
          tds: payment.tdsAmount || 0,
        }))
      : seriesParts.flatMap((part) => {
          const fromHistory = (part.history?.payments ?? []).map((payment) => ({
            amount: payment.amount,
            tds: payment.tdsAmount || 0,
          }));
          if (fromHistory.length > 0) return fromHistory;
          if (!board || !part.persistedId) return [];
          return (board.paid ?? [])
            .filter((entry) => entry.receiptId === part.persistedId)
            .map((entry) => ({
              amount: entry.amount,
              tds: entry.tdsAmount || 0,
            }));
        });
  const alreadyCut = round(priorPayments.reduce((sum, payment) => sum + payment.tds, 0));
  const cashAlready = round(priorPayments.reduce((sum, payment) => sum + payment.amount, 0));
  const submit = async () => {
    if (pending) return;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter the amount received.");
      return;
    }
    if (round(parsedAmount + settledTds) > outstandingCap + 0.001) {
      setError(
        `Cash plus counted TDS cannot be more than the ${formatCurrency(outstandingCap)} still left on the bill.`,
      );
      return;
    }
    if (settledTds > round(Math.max(0, outstandingCap - parsedAmount)) + 0.001) {
      setError(
        `Counted TDS cannot be more than the ${formatCurrency(Math.max(0, outstandingCap - parsedAmount))} still left after cash.`,
      );
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
        invoiceId: invoice?.id || card.invoiceId || "",
        amount: round(parsedAmount),
        paymentDate,
        mode,
        referenceNumber: referenceNumber.trim(),
        removeGstReason: convertToNonGst ? removeGstReason.trim() : undefined,
        receivedAccount,
        tdsAmount: tdsValue,
        tdsSettles: settledTds > 0,
      });
      onDone(board);
      void refreshInvoices();
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  const cashEntered = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const billLeftAfterPayment = round(Math.max(0, outstandingCap - cashEntered - settledTds));
  const showBillLeft =
    cashEntered > 0 && !Number.isNaN(billLeftAfterPayment) && outstandingCap > 0.009;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogDescription>
          {`${card.companyName}. Bill ${formatCurrency(expected)}${card.expectedDate ? `, due ${formatDate(card.expectedDate)}` : ""}.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
          {showBillLeft ? (
            <p
              className={
                billLeftAfterPayment <= 0.009
                  ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
                  : "rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-sm font-semibold text-amber-950 dark:text-amber-100"
              }
              role="status"
            >
              {billLeftAfterPayment <= 0.009
                ? "Nothing left on this bill after this payment."
                : `${formatCurrency(billLeftAfterPayment)} still left on the bill after this payment.`}
            </p>
          ) : null}
          {openInvoices.length === 0 ? (
            <p className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              No invoice. This payment is on the expected receipt.
            </p>
          ) : null}
          {openInvoices.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-invoice">Invoice (optional)</Label>
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
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mark-paid-amount">Money you received</Label>
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

          <TdsDeductionFields
            tdsAmount={tdsAmount}
            onTdsAmountChange={setTdsAmount}
            settles={tdsSettles}
            onSettlesChange={setTdsSettles}
            disabled={pending}
            cash={Number.isFinite(parsedAmount) ? parsedAmount : 0}
            outstanding={expectedAfterGst}
            billTotal={billTotal}
            beforeGst={beforeGstBase}
            alreadyCut={alreadyCut}
            cashAlready={cashAlready}
            installmentCount={isSeries ? seriesParts.length : undefined}
            thisInstallmentLabel={
              isSeries
                ? `Installment ${card.installmentIndex || seriesParts.findIndex((part) => part.id === card.id) + 1} of ${seriesParts.length}`
                : undefined
            }
          />

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

        </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={
            pending ||
            (Number.isFinite(parsedAmount) &&
              settledTds > round(Math.max(0, outstandingCap - parsedAmount)) + 0.001)
          }
          onClick={() => void submit()}
        >
          {pending ? "Recording…" : "Confirm payment"}
        </Button>
      </DialogFooter>
    </>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { ForecastHistory } from "@/features/canvas/components/ForecastHistory";
import { splitInclusive } from "@/features/canvas/components/GstAmount";
import {
  EditReceiptPaymentDialog,
  type EditableReceiptPayment,
} from "@/features/canvas/components/EditReceiptPaymentDialog";
import { customersApi } from "@/features/customers/api/customers.api";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { RecordType } from "@/features/customers/types/customer";
import {
  SOURCE_LABELS,
  type CanvasBoard,
  type CanvasCard,
  type CanvasForecastPayment,
  type ReceiptSourceType,
} from "@/features/canvas/types/canvas";
import {
  formatMonthLabel,
  installmentSiblings,
} from "@/features/canvas/utils/canvas-utils";
import { ApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { DateInput } from "@/shared/ui/date-input";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn, formatCurrency, formatDate } from "@/shared/utils";

export interface CreateDraft {
  customerId: string;
  expectedDate: string;
}

const SOURCES = Object.entries(SOURCE_LABELS) as Array<[ReceiptSourceType, string]>;
const ADD_NEW_ACCOUNT = "add-new";

const accountKindLabel: Record<"opportunity" | "customer" | "uncategorized", string> = {
  opportunity: "Opportunity",
  customer: "Customer",
  uncategorized: "Uncategorized",
};

export function CanvasDrawer({
  board,
  card,
  draft,
  onClose,
  onBoard,
  onSelectCard,
  onMarkPaid,
}: {
  board: CanvasBoard;
  card: CanvasCard | null;
  draft: CreateDraft | null;
  onClose: () => void;
  onBoard: (board: CanvasBoard) => void;
  onSelectCard?: (card: CanvasCard) => void;
  onMarkPaid: (card: CanvasCard) => void;
}) {
  const { addCustomer } = useCustomers();
  const open = Boolean(card || draft);
  const creating = Boolean(draft) && card?.kind !== "receipt";
  const [customerId, setCustomerId] = useState(draft?.customerId || card?.customerId || "");
  const [amount, setAmount] = useState("");
  const [gstRate, setGstRate] = useState<0 | 18>(18);
  const [expectedDate, setExpectedDate] = useState("");
  const [sourceType, setSourceType] = useState<ReceiptSourceType>("other");
  const [reason, setReason] = useState("");
  const [dealId, setDealId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [componentTouched, setComponentTouched] = useState(false);
  const [parts, setParts] = useState<Array<{ expectedAmount: string; expectedDate: string }>>([
    { expectedAmount: "", expectedDate: "" },
    { expectedAmount: "", expectedDate: "" },
  ]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [temperature, setTemperature] = useState<"" | "hot" | "warm" | "cold">("");
  const [addingAccount, setAddingAccount] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Extract<RecordType, "opportunity" | "uncategorized">>("opportunity");
  const [createdAccountId, setCreatedAccountId] = useState("");
  const [duplicateName, setDuplicateName] = useState("");
  const [editingPayment, setEditingPayment] = useState<EditableReceiptPayment | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [seriesEdits, setSeriesEdits] = useState<
    Record<string, { amount: string; expectedDate: string }>
  >({});
  const [seriesSaving, setSeriesSaving] = useState(false);

  useEffect(() => {
    setError("");
    setCustomerId(draft?.customerId || card?.customerId || "");
    setAmount(card?.kind === "receipt" && card.amountExGst != null ? String(card.amountExGst) : "");
    setGstRate(card?.kind === "receipt" && (card.gstPercent ?? 0) > 0 ? 18 : card?.kind === "receipt" ? 0 : 18);
    setExpectedDate(draft?.expectedDate || card?.expectedDate || "");
    setSourceType((card?.sourceType || "other") as ReceiptSourceType);
    setReason(card?.kind === "receipt" ? card.reason : "");
    setDealId(card?.dealId || "");
    setComponentId(card?.componentId || "");
    setComponentTouched(false);
    setTemperature(card?.recordType === "opportunity" ? card.temperature : "");
    setAddingAccount(false);
    setNewName("");
    setNewKind("opportunity");
    setCreatedAccountId("");
    setDuplicateName("");
    setMoreOpen(
      Boolean(card?.kind === "receipt" && (card.reason || card.dealId || card.componentId))
    );
    setInstallmentsOpen(false);
    setSeriesEdits({});
    setSeriesSaving(false);
    const createMode = Boolean(draft) || card?.kind === "account";
    setParts(
      createMode
        ? [{ expectedAmount: "", expectedDate: draft?.expectedDate || "" }]
        : [
            { expectedAmount: "", expectedDate: card?.expectedDate || "" },
            { expectedAmount: "", expectedDate: "" },
          ]
    );
  }, [card, draft]);

  const deals = useMemo(
    () => board.deals.filter((deal) => deal.customerId === (customerId || card?.customerId)),
    [board.deals, card?.customerId, customerId]
  );
  const selectedDeal = board.deals.find((deal) => deal.id === (dealId || card?.dealId));
  const dealComponents = selectedDeal?.components ?? [];
  const account = board.accounts.find((item) => item.id === (customerId || card?.customerId));
  const international = Boolean(account?.internationalClient);
  const seriesParts = useMemo(
    () => (card ? installmentSiblings(card, board.cards) : []),
    [board.cards, card]
  );
  const seriesOpen = seriesParts.filter(
    (part) => part.status === "expected" || part.status === "overdue"
  );
  const seriesIndex =
    card && seriesParts.length > 1
      ? Math.max(
          0,
          seriesParts.findIndex((part) => part.id === card.id)
        )
      : -1;
  const installmentOriginalOf = (part: CanvasCard): number =>
    Math.round(
      ((part.history?.originalAmount ?? part.originalAmount ?? part.expectedAmount ?? 0) as number) *
        100
    ) / 100;
  const installmentPendingOf = (part: CanvasCard): number =>
    Math.round(((part.expectedAmount ?? 0) as number) * 100) / 100;
  const installmentReceivedOf = (part: CanvasCard): number => {
    if (part.receivedAmount != null) return Math.round(part.receivedAmount * 100) / 100;
    return Math.max(0, Math.round((installmentOriginalOf(part) - installmentPendingOf(part)) * 100) / 100);
  };

  const seriesTotals = useMemo(() => {
    if (seriesParts.length < 2) return null;
    let original = 0;
    let received = 0;
    let pending = 0;
    for (const part of seriesParts) {
      const edit = seriesEdits[part.id];
      const canEdit =
        (part.status === "expected" || part.status === "overdue") &&
        installmentReceivedOf(part) <= 0.009;
      const partOriginal =
        canEdit && edit?.amount.trim() && Number.isFinite(Number(edit.amount))
          ? Number(edit.amount)
          : installmentOriginalOf(part);
      const partReceived = installmentReceivedOf(part);
      const partPending = canEdit
        ? Math.max(0, partOriginal - partReceived)
        : installmentPendingOf(part);
      original += partOriginal;
      received += partReceived;
      pending += partPending;
    }
    const storedDeal = seriesParts.find((part) => (part.seriesDealTotal ?? 0) > 0.009)?.seriesDealTotal;
    const dealTotal = storedDeal && storedDeal > 0.009 ? storedDeal : original;
    const dealBase =
      gstRate === 18 ? Math.round((dealTotal / 1.18) * 100) / 100 : dealTotal;
    const dealGst = Math.round((dealTotal - dealBase) * 100) / 100;
    return {
      dealTotal: Math.round(dealTotal * 100) / 100,
      dealBase,
      dealGst,
      scheduleOriginal: Math.round(original * 100) / 100,
      received: Math.round(received * 100) / 100,
      pending: Math.round(pending * 100) / 100,
    };
  }, [gstRate, seriesEdits, seriesParts]);

  const seriesSyncKey = seriesParts
    .map(
      (part) =>
        `${part.id}:${part.originalAmount ?? ""}:${part.expectedAmount ?? ""}:${part.expectedDate}:${part.status}:${part.receivedAmount ?? ""}`
    )
    .join("|");

  useEffect(() => {
    if (!card || seriesParts.length < 2) {
      setSeriesEdits({});
      return;
    }
    const next: Record<string, { amount: string; expectedDate: string }> = {};
    for (const part of seriesParts) {
      const original = installmentOriginalOf(part);
      next[part.id] = {
        amount: original > 0 ? String(original) : "",
        expectedDate: part.expectedDate || "",
      };
    }
    setSeriesEdits(next);
    // Sync from board when installment values change — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seriesSyncKey captures part fields
  }, [card?.id, seriesSyncKey]);

  const saveSeriesSchedule = async () => {
    if (!card || seriesParts.length < 2) return;
    const openParts = seriesParts.filter(
      (part) => part.status === "expected" || part.status === "overdue"
    );
    for (const part of openParts) {
      const edit = seriesEdits[part.id];
      if (!edit?.expectedDate) {
        setError(`Installment needs a date.`);
        return;
      }
      if (edit.amount.trim()) {
        const value = Number(edit.amount);
        if (!Number.isFinite(value) || value < 0) {
          setError("Enter a valid installment amount.");
          return;
        }
      }
    }
    setSeriesSaving(true);
    setError("");
    try {
      let boardNext = board;
      for (const part of openParts) {
        const edit = seriesEdits[part.id];
        if (!edit) continue;
        const value = edit.amount.trim() ? Number(edit.amount) : 0;
        boardNext = await canvasApi.updateReceipt({
          cardId: part.id,
          expectedAmount: Math.round(value * 100) / 100,
          expectedDate: edit.expectedDate,
          gstPercent: gstRate,
        });
      }
      onBoard(boardNext);
      if (card.id) {
        const refreshed = boardNext.cards.find((item) => item.id === card.id);
        if (refreshed) onSelectCard?.(refreshed);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the installment schedule.");
    } finally {
      setSeriesSaving(false);
    }
  };
  const schedulePreview = useMemo(() => {
    if (!(creating || card?.kind === "account")) return null;
    const dealBase =
      amount.trim() && Number.isFinite(Number(amount)) && Number(amount) > 0
        ? Number(amount)
        : null;
    const dealTotal =
      dealBase == null
        ? null
        : gstRate === 18
          ? Math.round((dealBase + Math.round(((dealBase * 18) / 100) * 100) / 100) * 100) / 100
          : Math.round(dealBase * 100) / 100;
    let sum = 0;
    let filled = 0;
    for (const part of parts) {
      const text = part.expectedAmount.trim();
      if (!text && parts.length === 1 && dealTotal != null) {
        sum += dealTotal;
        filled += 1;
        continue;
      }
      if (!text) continue;
      const value = Number(text);
      if (!Number.isFinite(value) || value < 0) continue;
      sum += value;
      filled += 1;
    }
    if (filled === 0) return null;
    const total = Math.round(sum * 100) / 100;
    const dealMismatch =
      dealTotal != null && Math.abs(dealTotal - total) > 0.02;
    return { total, filled, dealMismatch, dealTotal };
  }, [amount, card?.kind, creating, gstRate, parts]);

  useEffect(() => {
    if (!(creating || card?.kind === "account")) return;
    if (international) setGstRate(0);
  }, [card?.kind, creating, international]);
  const baseValue = Number(amount);
  const gstValue =
    gstRate === 18 && Number.isFinite(baseValue) ? Math.round(((baseValue * 18) / 100) * 100) / 100 : 0;
  const totalValue = Number.isFinite(baseValue) ? Math.round((baseValue + gstValue) * 100) / 100 : 0;
  const amountReady = Number.isFinite(baseValue) && baseValue > 0;

  useEffect(() => {
    if (componentTouched || componentId || !dealId) return;
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return;
    const totalNumber =
      gstRate === 18 ? Math.round(amountNumber * 1.18 * 100) / 100 : amountNumber;
    const options = board.deals.find((deal) => deal.id === dealId)?.components ?? [];
    const matches = options.filter((component) => Math.abs(component.total - totalNumber) < 0.6);
    if (matches.length === 1) setComponentId(matches[0].id);
  }, [amount, board.deals, componentId, componentTouched, dealId, gstRate]);

  const run = async (action: () => Promise<CanvasBoard>) => {
    setPending(true);
    setError("");
    setDuplicateName("");
    try {
      onBoard(await action());
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409 && /companyName/i.test(err.message)) {
        setDuplicateName(err.errors[0] || "an existing account");
      }
      setError(err instanceof ApiError ? err.message : "The canvas could not save that change.");
    } finally {
      setPending(false);
    }
  };

  const save = (forceDuplicate = false) => {
    const parsedAmount = Number(amount);
    const gstAmount =
      gstRate === 18 && Number.isFinite(parsedAmount)
        ? Math.round(((parsedAmount * 18) / 100) * 100) / 100
        : 0;
    const totalAmount = Number.isFinite(parsedAmount)
      ? Math.round((parsedAmount + gstAmount) * 100) / 100
      : 0;
    if (addingAccount) {
      if (!newName.trim()) {
        setError("Enter the name.");
        return;
      }
    } else if ((creating || card?.kind === "account") && !customerId) {
      setError("Choose an account, or add a new one.");
      return;
    }
    if (amount.trim() && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      setError("Enter a valid deal value, or leave it blank.");
      return;
    }
    const saveAmount =
      amount.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0 ? totalAmount : 0;
    const isCreate = creating || card?.kind === "account";

    if (isCreate) {
      const usingInstallments =
        installmentsOpen &&
        parts.some(
          (part) => part.expectedAmount.trim() !== "" || parts.length > 1
        );

      const schedule = usingInstallments
        ? parts.map((part) => {
            const text = part.expectedAmount.trim();
            const useDealTotal = !text && parts.length === 1 && saveAmount > 0;
            return {
              amountText: useDealTotal ? String(saveAmount) : part.expectedAmount,
              expectedDate: part.expectedDate,
            };
          })
        : [
            {
              amountText: saveAmount > 0 ? String(saveAmount) : "",
              expectedDate: expectedDate || parts[0]?.expectedDate || "",
            },
          ];
      if (schedule.length === 0) {
        setError("Add at least one installment.");
        return;
      }
      if (schedule.some((part) => !part.expectedDate)) {
        setError(
          usingInstallments
            ? "Each installment needs an expected date."
            : "Choose an expected date."
        );
        return;
      }
      if (
        schedule.some((part) => {
          if (!part.amountText.trim()) return false;
          const value = Number(part.amountText);
          return !Number.isFinite(value) || value < 0;
        })
      ) {
        setError("Enter a valid installment amount, or leave it blank.");
        return;
      }

      // Installment amounts are slices of the deal total (with GST already included when GST is on).
      // With installments closed, the deal total is the full amount to collect.
      const installments = schedule.map((part, index) => {
        const value = Number(part.amountText);
        return {
          expectedAmount:
            part.amountText.trim() && Number.isFinite(value)
              ? Math.round(value * 100) / 100
              : 0,
          expectedDate: part.expectedDate,
          reason:
            usingInstallments && schedule.length > 1
              ? reason.trim()
                ? `Installment ${index + 1} · ${reason.trim()}`
                : `Installment ${index + 1}`
              : reason.trim(),
        };
      });

      void run(async () => {
        let id = createdAccountId || customerId;
        if (addingAccount && !createdAccountId) {
          const created = await addCustomer(
            {
              name: newName.trim(),
              company: newName.trim(),
              phone: "",
              email: "",
              gst: "",
              internationalClient: false,
              vatId: "",
              licenseNo: "",
              billingAddress: "",
              serviceAddress: "",
              notes: "",
              recordType: newKind,
            },
            undefined,
            { allowDuplicateCompanyName: forceDuplicate },
          );
          id = created.id;
          setCreatedAccountId(created.id);
        }
        return canvasApi.createReceipt({
          customerId: id,
          expectedAmount: saveAmount,
          expectedDate: installments[0]?.expectedDate,
          sourceType,
          reason: reason.trim(),
          dealId: dealId || undefined,
          componentId: componentId || undefined,
          gstPercent: gstRate,
          installments,
        });
      });
      return;
    }

    if (!expectedDate) {
      setError("Choose an expected date.");
      return;
    }
    if (!card) return;
    void run(() =>
      canvasApi.updateReceipt({
        cardId: card.id,
        expectedAmount: saveAmount,
        expectedDate,
        sourceType,
        reason: reason.trim(),
        gstPercent: gstRate,
      })
    );
  };

  const saveSplit = () => {
    if (!card?.invoiceId) return;
    const parsed = parts.map((part) => ({
      expectedAmount: Number(part.expectedAmount),
      expectedDate: part.expectedDate,
    }));
    if (parsed.some((part) => !part.expectedDate || !Number.isFinite(part.expectedAmount) || part.expectedAmount <= 0)) {
      setError("Each installment needs a date and an amount.");
      return;
    }
    void run(() => canvasApi.split({ invoiceId: card.invoiceId, parts: parsed }));
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close details"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      ) : null}
      {open ? (
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full min-w-0 max-w-md flex-col border-l bg-background shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expected receipt
            </p>
            <h2 className="text-lg font-semibold">
              {addingAccount
                ? newName.trim() || "New account"
                : account?.companyName || card?.companyName || "New receipt"}
            </h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {error ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          {card?.carriedFrom ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">
              Unpaid from {formatMonthLabel(card.carriedFrom)}. It stays here as carried forward until it
              is paid or moved to another month.
            </p>
          ) : null}

          {card?.kind === "receipt" && seriesParts.length > 1 && seriesTotals ? (
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">
                  Installment schedule · {seriesIndex + 1} of {seriesParts.length}
                </p>
                <div className="mt-2 space-y-1 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
                  <p className="font-semibold tabular-nums">
                    Original deal: {formatCurrency(seriesTotals.dealTotal)}
                    {seriesTotals.dealGst > 0.009
                      ? ` · base ${formatCurrency(seriesTotals.dealBase)} + GST ${formatCurrency(seriesTotals.dealGst)}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Received {formatCurrency(seriesTotals.received)}
                    <span className="mx-1.5 text-border">·</span>
                    Still to collect {formatCurrency(seriesTotals.pending)}
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {seriesParts.map((part, index) => {
                  const paid = part.status === "received";
                  const lockedStatus =
                    paid || part.status === "cancelled" || part.status === "superseded";
                  const original = installmentOriginalOf(part);
                  const received = installmentReceivedOf(part);
                  const pendingAmt = installmentPendingOf(part);
                  const editable = !lockedStatus && received <= 0.009;
                  const edit = seriesEdits[part.id] ?? {
                    amount: original > 0 ? String(original) : "",
                    expectedDate: part.expectedDate || "",
                  };
                  return (
                    <li
                      key={part.id}
                      className={cn(
                        "space-y-2 rounded-lg border px-3 py-2.5",
                        part.id === card.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Installment {index + 1}
                          {part.id === card.id ? " · open now" : ""}
                          {paid ? " · received" : part.status === "overdue" ? " · overdue" : ""}
                        </p>
                        {part.id !== card.id && onSelectCard && !lockedStatus ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => onSelectCard(part)}
                          >
                            Open
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        Original {formatCurrency(original)}
                        <span className="mx-1 text-border">·</span>
                        Received {formatCurrency(received)}
                        <span className="mx-1 text-border">·</span>
                        Pending {formatCurrency(pendingAmt)}
                      </p>
                      {editable ? (
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                          <Field label="Installment amount">
                            <Input
                              inputMode="decimal"
                              value={edit.amount}
                              disabled={pending || seriesSaving}
                              onChange={(event) =>
                                setSeriesEdits((current) => ({
                                  ...current,
                                  [part.id]: { ...edit, amount: event.target.value },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Date">
                            <DateInput
                              className="w-full min-w-0"
                              value={edit.expectedDate}
                              disabled={pending || seriesSaving}
                              onChange={(event) =>
                                setSeriesEdits((current) => ({
                                  ...current,
                                  [part.id]: { ...edit, expectedDate: event.target.value },
                                }))
                              }
                            />
                          </Field>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {received > 0.009
                            ? "Payment already recorded — edit from payment history."
                            : part.expectedDate
                              ? `Due ${formatDate(part.expectedDate)}`
                              : "No date"}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              {seriesOpen.some((part) => installmentReceivedOf(part) <= 0.009) ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending || seriesSaving}
                  onClick={() => void saveSeriesSchedule()}
                >
                  {seriesSaving ? "Saving…" : "Save installment schedule"}
                </Button>
              ) : null}
            </div>
          ) : null}

          {card?.history && card.history.payments.length > 0 ? (
            <>
            <p className="text-xs text-muted-foreground">
              Wrong payment amount? Tap a payment below to edit — totals and remaining adjust
              automatically.
            </p>
            <ForecastHistory
              history={card.history}
              onEditPayment={(payment: CanvasForecastPayment) => {
                if (!card.persistedId || payment.receiptPaymentIndex == null) return;
                const paymentSiblings = card.history?.payments ?? [];
                const seriesCards = installmentSiblings(card, board.cards);
                const seriesParts = seriesCards.length > 1 ? seriesCards : [card];
                const round2 = (value: number) => Math.round(value * 100) / 100;
                const partInclusive = (part: CanvasCard) => {
                  const original = part.history?.originalAmount ?? 0;
                  return original > 0 ? original : part.expectedAmount ?? 0;
                };
                const partBeforeGst = (part: CanvasCard) => {
                  const inclusive = partInclusive(part);
                  const percent = Number(part.gstPercent) || 0;
                  if (percent > 0 && inclusive > 0) {
                    return round2(inclusive / (1 + percent / 100));
                  }
                  if ((part.gstAmount ?? 0) > 0.009 && part.amountExGst != null) {
                    return part.amountExGst;
                  }
                  return round2(inclusive);
                };
                const seriesBeforeGst = round2(
                  seriesParts.reduce((sum, part) => sum + partBeforeGst(part), 0)
                );
                const seriesBillTotal = round2(
                  seriesParts.reduce((sum, part) => sum + partInclusive(part), 0)
                );
                const alreadyCutOtherInstallments = seriesParts
                  .filter((part) => part.id !== card.id)
                  .reduce((sum, part) => {
                    const fromHistory = (part.history?.payments ?? []).reduce(
                      (inner, item) => inner + (item.tdsAmount || 0),
                      0
                    );
                    if (fromHistory > 0) return sum + fromHistory;
                    if (!part.persistedId) return sum;
                    return (
                      sum +
                      board.paid
                        .filter((entry) => entry.receiptId === part.persistedId)
                        .reduce((inner, entry) => inner + (entry.tdsAmount || 0), 0)
                    );
                  }, 0);
                const alreadyCut = round2(
                  alreadyCutOtherInstallments +
                    paymentSiblings
                      .filter((_, index) => index !== payment.receiptPaymentIndex)
                      .reduce((sum, item) => sum + (item.tdsAmount || 0), 0)
                );
                const cashAlready = paymentSiblings
                  .filter((_, index) => index !== payment.receiptPaymentIndex)
                  .reduce((sum, item) => sum + item.amount, 0);
                const settledOthers = paymentSiblings
                  .filter((_, index) => index !== payment.receiptPaymentIndex)
                  .reduce(
                    (sum, item) =>
                      sum + item.amount + (item.tdsSettles ? item.tdsAmount || 0 : 0),
                    0
                  );
                const thisBill = card.history?.originalAmount ?? card.expectedAmount ?? 0;
                setEditingPayment({
                  receiptId: card.persistedId,
                  index: payment.receiptPaymentIndex,
                  amount: payment.amount,
                  paymentDate: payment.date,
                  mode: payment.mode || "",
                  receivedAccount: payment.receivedAccount === "other" ? "other" : "gst",
                  tdsAmount: payment.tdsAmount || 0,
                  tdsSettles: Boolean(payment.tdsSettles),
                  outstanding: Math.max(0, thisBill - settledOthers),
                  billTotal: seriesBillTotal,
                  beforeGst: seriesBeforeGst,
                  alreadyCut,
                  cashAlready,
                  reason: card.reason,
                  installmentCount: seriesParts.length > 1 ? seriesParts.length : undefined,
                  thisInstallmentLabel:
                    seriesParts.length > 1
                      ? `Installment ${card.installmentIndex || 1} of ${seriesParts.length}`
                      : undefined,
                });
              }}
            />
            </>
          ) : null}

          {creating || card?.kind === "account" ? (
            <Field label="Account">
              <Select
                value={addingAccount ? ADD_NEW_ACCOUNT : customerId || undefined}
                onValueChange={(value) => {
                  if (value === ADD_NEW_ACCOUNT) {
                    setAddingAccount(true);
                    setCustomerId("");
                    setDuplicateName("");
                    return;
                  }
                  setAddingAccount(false);
                  setCreatedAccountId("");
                  setCustomerId(value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full",
                    addingAccount && "border-primary/40 bg-primary/5 font-semibold text-primary"
                  )}
                >
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={ADD_NEW_ACCOUNT}
                    className="my-1 rounded-lg border border-primary/30 bg-primary/10 font-semibold text-primary focus:bg-primary/15 focus:text-primary"
                  >
                    + Add new
                  </SelectItem>
                  {board.accounts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.companyName} · {accountKindLabel[item.recordType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {addingAccount ? (
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
              <Field label="Save this account as">
                <Select
                  value={newKind}
                  onValueChange={(value) =>
                    setNewKind(value as "opportunity" | "uncategorized")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newKind === "opportunity"
                    ? "This is saved under Opportunities."
                    : "This is saved under Uncategorized. Lead is not used."}
                </p>
              </Field>
              <Field label="Name">
                <Input
                  value={newName}
                  placeholder="Person or account name"
                  onChange={(event) => {
                    setNewName(event.target.value);
                    setDuplicateName("");
                  }}
                />
              </Field>
              {duplicateName ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p>A record already uses this name ({duplicateName}). Create another anyway?</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={pending}
                    onClick={() => save(true)}
                  >
                    Yes, create anyway
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <Field label="GST">
            {international ? (
              <p className="text-xs text-muted-foreground">
                International client. GST not required. This collection counts in the Ameya Innovex
                GST account, not Ritika.
              </p>
            ) : null}
            <div role="radiogroup" className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {(
                [
                  { value: 18 as const, label: "18% GST", hint: "Added on the base amount" },
                  { value: 0 as const, label: "0% GST", hint: "Base amount only" },
                ] as const
              ).map((option) => {
                const selected = gstRate === option.value;
                const locked = international && option.value === 18;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) setGstRate(option.value);
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            <Field
              label={
                creating || card?.kind === "account"
                  ? "Total deal value (base, optional)"
                  : seriesParts.length > 1
                    ? "This installment · base (editable)"
                    : "Deal / receipt amount · base (editable)"
              }
            >
              <Input
                inputMode="decimal"
                value={amount}
                placeholder="Overall deal value"
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field label="GST">
              <Input
                readOnly
                value={
                  amountReady
                    ? gstRate === 18
                      ? formatCurrency(gstValue)
                      : international
                        ? "GST not required"
                        : "No GST"
                    : ""
                }
              />
            </Field>
            <Field label="Total">
              <Input
                readOnly
                value={amountReady ? formatCurrency(totalValue) : ""}
              />
            </Field>
          </div>
          {amountReady ? (
            <p className="text-sm font-medium tabular-nums">
              {gstRate === 18
                ? `${formatCurrency(baseValue)} + GST ${formatCurrency(gstValue)} = Total ${formatCurrency(totalValue)}`
                : international
                  ? `${formatCurrency(baseValue)} · International client · GST not required`
                  : `${formatCurrency(baseValue)} · No GST`}
            </p>
          ) : null}
          {card?.liveBalance != null ? (
            <p className="text-xs text-muted-foreground">
              Invoice balance is {formatCurrency(card.liveBalance)}
              {(card.gstPercent ?? 0) > 0
                ? ` with GST (${formatCurrency(splitInclusive(card.liveBalance, card.gstPercent).exclusive)} before GST)`
                : " without GST"}
              . Saving a different amount keeps that invoice balance unchanged.
            </p>
          ) : null}

          {creating || card?.kind === "account" ? (
            <>
              {!installmentsOpen ? (
                <Field label="Expected date">
                  <DateInput
                    className="w-full min-w-0"
                    value={expectedDate}
                    onChange={(event) => {
                      const value = event.target.value;
                      setExpectedDate(value);
                      setParts((current) =>
                        current.length === 1
                          ? [{ ...current[0], expectedDate: value }]
                          : current
                      );
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Without installments, the deal total above is the full amount to collect.
                  </p>
                </Field>
              ) : null}
              <div className="rounded-xl border border-border/70 bg-muted/20">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"
                  aria-expanded={installmentsOpen}
                  onClick={() => {
                    setInstallmentsOpen((open) => {
                      const next = !open;
                      if (next) {
                        setParts((current) =>
                          current.length > 0
                            ? current.map((part, index) =>
                                index === 0 && !part.expectedDate && expectedDate
                                  ? { ...part, expectedDate }
                                  : part
                              )
                            : [{ expectedAmount: "", expectedDate }]
                        );
                      }
                      return next;
                    });
                  }}
                >
                  <span>
                    Split into installments
                    <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      installmentsOpen && "rotate-180"
                    )}
                  />
                </button>
                {installmentsOpen ? (
                  <div className="space-y-3 border-t border-border/70 px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      Split the total above across dates. Enter collect amounts here — GST is not
                      added again.
                    </p>
                    {parts.map((part, index) => (
                      <div
                        key={index}
                        className="space-y-2 rounded-lg border border-border/60 bg-background px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Installment {index + 1}
                          </p>
                          {parts.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setParts((current) =>
                                  current.filter((_, itemIndex) => itemIndex !== index)
                                )
                              }
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                          <Field label="Amount">
                            <Input
                              inputMode="decimal"
                              placeholder={
                                parts.length === 1 && amountReady
                                  ? `Uses total ${formatCurrency(totalValue)} if blank`
                                  : "Part of the total"
                              }
                              value={part.expectedAmount}
                              onChange={(event) =>
                                setParts((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, expectedAmount: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          </Field>
                          <Field label="Expected date">
                            <DateInput
                              className="w-full min-w-0"
                              value={part.expectedDate}
                              onChange={(event) =>
                                setParts((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, expectedDate: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        setParts((current) => [
                          ...current,
                          { expectedAmount: "", expectedDate: "" },
                        ])
                      }
                    >
                      + Add installment
                    </Button>
                    {schedulePreview ? (
                      <div
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm",
                          schedulePreview.dealMismatch
                            ? "border-amber-500/40 bg-amber-500/10"
                            : "border-border/70 bg-background"
                        )}
                      >
                        <p className="font-medium tabular-nums">
                          Installments total: {formatCurrency(schedulePreview.total)}
                          {schedulePreview.dealTotal != null
                            ? ` of ${formatCurrency(schedulePreview.dealTotal)}`
                            : ""}
                        </p>
                        {schedulePreview.dealMismatch && schedulePreview.dealTotal != null ? (
                          <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                            Deal total is {formatCurrency(schedulePreview.dealTotal)}, but
                            installments sum to {formatCurrency(schedulePreview.total)}.
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            These amounts are the money to collect — GST is already in the deal
                            total above.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Field label="Expected date">
              <DateInput
                className="w-full min-w-0"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </Field>
          )}
          <Field label="Source">
            <Select value={sourceType} onValueChange={(value) => setSourceType(value as ReceiptSourceType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="rounded-xl border border-border/70">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
            >
              <span>
                More details
                <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
              </span>
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", moreOpen && "rotate-180")}
              />
            </button>
            {moreOpen ? (
              <div className="space-y-3 border-t border-border/70 px-3 py-3">
                <Field label="Reason">
                  <Input
                    value={reason}
                    placeholder="Optional"
                    onChange={(event) => setReason(event.target.value)}
                  />
                </Field>
                <Field label="Deal">
                  <Select
                    value={dealId || "none"}
                    onValueChange={(value) => {
                      setDealId(value === "none" ? "" : value);
                      setComponentId("");
                      setComponentTouched(false);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No deal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No deal</SelectItem>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {selectedDeal ? (
                  <p className="text-xs text-muted-foreground">
                    Deal probability is {selectedDeal.probability}%. Contract value is{" "}
                    {formatCurrency(selectedDeal.contractValue)}. Neither number is treated as expected
                    cash.
                  </p>
                ) : null}
                {dealComponents.length > 0 ? (
                  <Field label="Component">
                    <Select
                      value={componentId || "none"}
                      onValueChange={(value) => {
                        setComponentTouched(true);
                        setComponentId(value === "none" ? "" : value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose component" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealComponents.filter(
                          (component) => Math.abs(component.total - totalValue) < 0.6
                        ).length === 1 ? null : (
                          <SelectItem value="none">Not a component renewal</SelectItem>
                        )}
                        {dealComponents.map((component) => (
                          <SelectItem key={component.id} value={component.id}>
                            {component.name} · {formatCurrency(component.total)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {card?.invoiceId
                        ? "This invoice is the amount to collect. The old forecast for the same cycle stays off the canvas."
                        : componentId
                          ? "This receipt is the forecast for that component, so the canvas will not add a second card for the same amount."
                          : "If this amount is one of the deal's components, choose it. Otherwise the canvas also shows that component's own forecast."}
                    </p>
                  </Field>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {card?.customerId ? (
              <Link className="text-primary underline-offset-4 hover:underline" to={`/customers/${card.customerId}`}>
                Open account
              </Link>
            ) : null}
            {card?.dealId ? (
              <Link className="text-primary underline-offset-4 hover:underline" to={`/deals/${card.dealId}`}>
                Open deal
              </Link>
            ) : null}
            {card?.invoiceId ? (
              <Link className="text-primary underline-offset-4 hover:underline" to={`/invoices/${card.invoiceId}`}>
                Open invoice
              </Link>
            ) : null}
          </div>

          {card?.recordType === "opportunity" ? (
            <Field label="Temperature">
              <Select
                value={temperature || "unclassified"}
                onValueChange={(value) => {
                  const next = value === "unclassified" ? "" : (value as "hot" | "warm" | "cold");
                  setTemperature(next);
                  if (!card) return;
                  void run(() => canvasApi.setTemperature(card.customerId, next));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unclassified">Unclassified</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {card?.recordType === "opportunity" ? (
            <Button type="button" variant="outline" onClick={() => setConfirmConvert(true)}>
              Convert to customer
            </Button>
          ) : null}

          {card?.kind === "receipt" && card.invoiceId && card.sourceType === "invoice_balance" ? (
            <div className="space-y-2 rounded-2xl border p-3">
              <p className="text-sm font-medium">Split into installments</p>
              <p className="text-xs text-muted-foreground">Each amount is with GST.</p>
              {parts.map((part, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  <Input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={part.expectedAmount}
                    onChange={(event) =>
                      setParts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, expectedAmount: event.target.value } : item
                        )
                      )
                    }
                  />
                  <DateInput
                    className="w-full min-w-0"
                    aria-label={`Installment ${index + 1} date`}
                    value={part.expectedDate}
                    onChange={(event) =>
                      setParts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, expectedDate: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setParts((current) => [...current, { expectedAmount: "", expectedDate: "" }])}
              >
                Add installment
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={saveSplit}>
                Save installments
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t px-4 py-4">
          {card?.kind === "receipt" && (card.status === "expected" || card.status === "overdue") ? (
            <Button
              type="button"
              disabled={pending}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              onClick={() => onMarkPaid(card)}
            >
              Mark as paid
            </Button>
          ) : null}
          <Button type="button" disabled={pending} onClick={() => save()}>
            Save forecast
          </Button>
          {card?.kind === "receipt" &&
          (card.status === "expected" || card.status === "overdue") ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmRemove(true)}
            >
              Remove from forecast
            </Button>
          ) : null}
        </div>
      </aside>
      ) : null}

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from forecast</DialogTitle>
            <DialogDescription>
              This takes the expected amount off the canvas. The row is kept as cancelled, so nothing
              is deleted. An invoice that already exists stays in Revenue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !card}
              onClick={() => {
                if (!card) return;
                setConfirmRemove(false);
                void run(() => canvasApi.dismiss(card.id));
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to customer</DialogTitle>
            <DialogDescription>
              This uses the existing conversion action. It can update the account stage. It does not
              change Hot, Warm, or Cold by itself, and it does not change expected dates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmConvert(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !card}
              onClick={() => {
                if (!card) return;
                setConfirmConvert(false);
                void run(async () => {
                  await customersApi.changeRecordType(card.customerId, "customer");
                  return canvasApi.getBoard();
                });
              }}
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditReceiptPaymentDialog
        payment={editingPayment}
        onOpenChange={(open) => {
          if (!open) setEditingPayment(null);
        }}
        onSaved={async () => {
          const board = await canvasApi.getBoard();
          onBoard(board);
        }}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

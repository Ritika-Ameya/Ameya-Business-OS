import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { splitInclusive } from "@/features/canvas/components/GstAmount";
import { customersApi } from "@/features/customers/api/customers.api";
import {
  SOURCE_LABELS,
  type CanvasBoard,
  type CanvasCard,
  type ReceiptSourceType,
} from "@/features/canvas/types/canvas";
import { formatMonthLabel } from "@/features/canvas/utils/canvas-utils";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn, formatCurrency } from "@/shared/utils";

export interface CreateDraft {
  customerId: string;
  expectedDate: string;
}

const SOURCES = Object.entries(SOURCE_LABELS) as Array<[ReceiptSourceType, string]>;

export function CanvasDrawer({
  board,
  card,
  draft,
  onClose,
  onBoard,
  onMarkPaid,
}: {
  board: CanvasBoard;
  card: CanvasCard | null;
  draft: CreateDraft | null;
  onClose: () => void;
  onBoard: (board: CanvasBoard) => void;
  onMarkPaid: (card: CanvasCard) => void;
}) {
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
  const [temperature, setTemperature] = useState<"" | "hot" | "warm" | "cold">("");

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
    setParts([
      { expectedAmount: "", expectedDate: card?.expectedDate || "" },
      { expectedAmount: "", expectedDate: "" },
    ]);
  }, [card, draft]);

  const deals = useMemo(
    () => board.deals.filter((deal) => deal.customerId === (customerId || card?.customerId)),
    [board.deals, card?.customerId, customerId]
  );
  const selectedDeal = board.deals.find((deal) => deal.id === (dealId || card?.dealId));
  const dealComponents = selectedDeal?.components ?? [];
  const account = board.accounts.find((item) => item.id === (customerId || card?.customerId));
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
    try {
      onBoard(await action());
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The canvas could not save that change.");
    } finally {
      setPending(false);
    }
  };

  const save = () => {
    const parsedAmount = Number(amount);
    const gstAmount =
      gstRate === 18 && Number.isFinite(parsedAmount)
        ? Math.round(((parsedAmount * 18) / 100) * 100) / 100
        : 0;
    const totalAmount = Number.isFinite(parsedAmount)
      ? Math.round((parsedAmount + gstAmount) * 100) / 100
      : 0;
    if (!customerId) {
      setError("Choose an account.");
      return;
    }
    if (!expectedDate) {
      setError("Choose an expected date.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an expected amount.");
      return;
    }
    if (!reason.trim()) {
      setError("Enter a reason.");
      return;
    }
    if (creating || card?.kind === "account") {
      void run(() =>
        canvasApi.createReceipt({
          customerId,
          expectedAmount: totalAmount,
          expectedDate,
          sourceType,
          reason: reason.trim(),
          dealId: dealId || undefined,
          componentId: componentId || undefined,
          gstPercent: gstRate,
        })
      );
      return;
    }
    if (!card) return;
    void run(() =>
      canvasApi.updateReceipt({
        cardId: card.id,
        expectedAmount: totalAmount,
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
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expected receipt
            </p>
            <h2 className="text-lg font-semibold">
              {account?.companyName || card?.companyName || "New receipt"}
            </h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
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

          {creating || card?.kind === "account" ? (
            <Field label="Account">
              <Select value={customerId || undefined} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {board.accounts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          <Field label="GST">
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 18 as const, label: "18% GST", hint: "Added on the base amount" },
                  { value: 0 as const, label: "0% GST", hint: "Base amount only" },
                ] as const
              ).map((option) => {
                const selected = gstRate === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGstRate(option.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition-colors",
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
          <div className="grid grid-cols-3 gap-2">
            <Field label="Base amount">
              <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </Field>
            <Field label="GST">
              <Input
                readOnly
                value={amountReady ? (gstRate === 18 ? formatCurrency(gstValue) : "No GST") : ""}
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
                : `${formatCurrency(baseValue)} · No GST`}
            </p>
          ) : null}
          {card?.liveBalance != null ? (
            <p className="text-xs text-muted-foreground">
              Invoice balance is {formatCurrency(card.liveBalance)} with GST
              {card.gstPercent != null
                ? ` and ${formatCurrency(splitInclusive(card.liveBalance, card.gstPercent).exclusive)} without GST`
                : ""}
              . Saving a different amount keeps that invoice balance unchanged.
            </p>
          ) : null}
          <Field label="Expected date">
            <Input type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
          </Field>
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
          <Field label="Reason">
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
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
              {formatCurrency(selectedDeal.contractValue)}. Neither number is treated as expected cash.
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
                  {dealComponents.filter((component) => Math.abs(component.total - totalValue) < 0.6).length ===
                  1 ? null : (
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
                {componentId
                  ? "This receipt is the forecast for that component, so the canvas will not add a second card for the same amount."
                  : "If this amount is one of the deal's components, choose it. Otherwise the canvas also shows that component's own forecast."}
              </p>
            </Field>
          ) : null}

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
                <div key={index} className="grid grid-cols-2 gap-2">
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
                  <Input
                    type="date"
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
          <Button type="button" disabled={pending} onClick={save}>
            Save forecast
          </Button>
          {card?.kind === "receipt" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void run(() => canvasApi.dismiss(card.id))}
            >
              Remove from forecast
            </Button>
          ) : null}
        </div>
      </aside>
      ) : null}

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

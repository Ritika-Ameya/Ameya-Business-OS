import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { RenewalFrequencyBadge } from "@/features/deals/components/components/ComponentBadges";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { billedComponentLines, formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceOverviewTabProps {
  invoice: Invoice;
}

export function InvoiceOverviewTab({ invoice }: InvoiceOverviewTabProps) {
  const { components: allComponents } = useDeals();
  const componentById = new Map(allComponents.map((component) => [component.id, component]));
  const isNonGst = invoice.billingType === "non_gst";
  const lines = billedComponentLines(invoice, allComponents);
  const lineByComponent = new Map(lines.map((line) => [line.componentId, line]));
  const rows =
    invoice.lineItems.length > 0
      ? lines.map((line) => ({
          key: line.componentId || line.name,
          name: line.name,
          component: componentById.get(line.componentId),
          line,
        }))
      : invoice.componentIds.map((componentId) => {
          const component = componentById.get(componentId);
          const line = lineByComponent.get(componentId) ?? null;
          return {
            key: componentId,
            name: line?.name ?? component?.name ?? "—",
            component,
            line,
          };
        });
  const showAmounts = rows.some((row) => row.line);
  const rowBase = rows.reduce((sum, row) => sum + (row.line?.taxable ?? 0), 0);
  const rowTax = rows.reduce((sum, row) => sum + (row.line?.gstAmount ?? 0), 0);
  const rowsMatchInvoice =
    showAmounts &&
    rows.every((row) => row.line) &&
    Math.abs(rowBase - invoice.subtotal) < 1 &&
    Math.abs(rowTax - invoice.tax) < 1;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Invoice Components</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "What was billed on this invoice"
              : rowsMatchInvoice
                ? "Each component is on its own row. The total below is the sum of these rows."
                : "Each component shows its own amount. The total below is what was billed on this invoice."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
              No components linked to this invoice.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-4">Component</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Frequency</TableHead>
                    {showAmounts && (
                      <>
                        <TableHead className="text-right">Base amount</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="pr-4 text-right">Total</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.component?.category ?? "—"}
                      </TableCell>
                      <TableCell>
                        {row.component ? (
                          <RenewalFrequencyBadge frequency={row.component.renewalFrequency} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {showAmounts && (
                        <>
                          <TableCell className="text-right tabular-nums">
                            {row.line ? formatInvoiceCurrency(row.line.taxable) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {row.line
                              ? row.line.gstPercent > 0
                                ? `${formatInvoiceCurrency(row.line.gstAmount)} (${row.line.gstPercent}%)`
                                : "No GST"
                              : "—"}
                          </TableCell>
                          <TableCell className="pr-4 text-right font-medium tabular-nums">
                            {row.line ? formatInvoiceCurrency(row.line.total) : "—"}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base amount</span>
              <span className="tabular-nums">{formatInvoiceCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isNonGst ? "GST (not charged)" : `GST (${invoice.gstPercent}%)`}
              </span>
              <span className="tabular-nums">{formatInvoiceCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border/70 pt-1.5 font-semibold">
              <span>{isNonGst ? "Invoice total (without GST)" : "Invoice total (incl. GST)"}</span>
              <span className="tabular-nums">{formatInvoiceCurrency(invoice.amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card className="rounded-2xl border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

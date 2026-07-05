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
import { BillingTypeBadge } from "@/features/deals/components/components/ComponentBadges";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { formatComponentCurrency } from "@/features/deals/utils/deal-component-utils";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceOverviewTabProps {
  invoice: Invoice;
}

export function InvoiceOverviewTab({ invoice }: InvoiceOverviewTabProps) {
  const { components: allComponents } = useDeals();
  const components = allComponents.filter((component) =>
    invoice.componentIds.includes(component.id)
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Invoice Components</CardTitle>
          <CardDescription>
            Billable components included in this invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
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
                    <TableHead>Billing</TableHead>
                    <TableHead className="pr-4 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="pl-4 font-medium">
                        {component.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {component.category}
                      </TableCell>
                      <TableCell>
                        <BillingTypeBadge type={component.billingType} />
                      </TableCell>
                      <TableCell className="pr-4 text-right font-medium">
                        {formatComponentCurrency(component.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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

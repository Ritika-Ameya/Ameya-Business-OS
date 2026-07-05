import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatDate } from "@/lib/deal-utils";
import {
  customerRenewalStatusLabels,
  customerRenewalStatusStyles,
  type CustomerRenewalItem,
} from "@/lib/customer-workspace-utils";
import { cn } from "@/shared/utils";

interface CustomerRenewalsTableProps {
  renewals: CustomerRenewalItem[];
}

export function CustomerRenewalsTable({ renewals }: CustomerRenewalsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Renewal</TableHead>
            <TableHead>Deal</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renewals.map((renewal) => (
            <TableRow key={renewal.id}>
              <TableCell className="pl-4">
                <Link
                  to={`/deals/${renewal.dealId}?tab=renewals`}
                  className="font-medium transition-colors hover:text-primary"
                >
                  {renewal.renewalLabel}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {renewal.dealTitle}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(renewal.dueDate)}
              </TableCell>
              <TableCell>{renewal.amount}</TableCell>
              <TableCell className="pr-4">
                <Badge
                  variant="secondary"
                  className={cn(customerRenewalStatusStyles[renewal.status])}
                >
                  {customerRenewalStatusLabels[renewal.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

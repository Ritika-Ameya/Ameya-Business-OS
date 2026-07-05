import { Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
  companyRenewalStatusStyles,
  renewalStatusLabels,
  type CompanyRenewalRow,
} from "@/lib/revenue-utils";
import { cn } from "@/shared/utils";

interface RevenueRenewalsTableProps {
  renewals: CompanyRenewalRow[];
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export function RevenueRenewalsTable({
  renewals,
  isFiltered = false,
  onResetFilters,
}: RevenueRenewalsTableProps) {
  const navigate = useNavigate();

  if (renewals.length === 0) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="No renewals found"
        description="Try a different search term or adjust your filters."
        secondaryActionLabel={isFiltered ? "Reset filters" : undefined}
        onSecondaryAction={isFiltered ? onResetFilters : undefined}
      />
    );
  }

  return (
    <ResponsiveTableFrame>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Renewal</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead>Renewal Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renewals.map((renewal) => (
            <TableRow
              key={renewal.id}
              className="cursor-pointer"
              onClick={() =>
                navigate(`/deals/${renewal.dealId}?tab=renewals`)
              }
            >
              <TableCell className="pl-4 font-medium">{renewal.renewalLabel}</TableCell>
              <TableCell className="text-muted-foreground">
                {renewal.customerName}
              </TableCell>
              <TableCell className="hidden max-w-[160px] truncate text-muted-foreground md:table-cell">
                {renewal.dealTitle}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(renewal.renewalDate)}
              </TableCell>
              <TableCell>{renewal.amount}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(companyRenewalStatusStyles[renewal.status])}
                >
                  {renewalStatusLabels[renewal.status]}
                </Badge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View deal renewals"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/deals/${renewal.dealId}?tab=renewals`);
                  }}
                >
                  <Eye />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

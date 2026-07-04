import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/deal-utils";
import {
  companyRenewalStatusStyles,
  type CompanyRenewalRow,
} from "@/lib/revenue-utils";
import { cn } from "@/lib/utils";

interface RevenueRenewalsTableProps {
  renewals: CompanyRenewalRow[];
}

const renewalStatusLabels = {
  upcoming: "Upcoming",
  overdue: "Overdue",
  renewed: "Renewed",
} as const;

export function RevenueRenewalsTable({ renewals }: RevenueRenewalsTableProps) {
  const navigate = useNavigate();

  if (renewals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No renewals found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
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
                navigate(`/deals/${renewal.dealId}`, { state: { tab: "renewals" } })
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
                    navigate(`/deals/${renewal.dealId}`, {
                      state: { tab: "renewals" },
                    });
                  }}
                >
                  <Eye />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

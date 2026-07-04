import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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

interface RenewalReportTableProps {
  renewals: CompanyRenewalRow[];
}

const renewalStatusLabels = {
  upcoming: "Upcoming",
  overdue: "Overdue",
  renewed: "Renewed",
} as const;

export function RenewalReportTable({ renewals }: RenewalReportTableProps) {
  const navigate = useNavigate();

  if (renewals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No renewal records found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your date range or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead className="hidden md:table-cell">Deal</TableHead>
            <TableHead>Renewal</TableHead>
            <TableHead>Renewal Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell className="pl-4 text-muted-foreground">
                {renewal.customerName}
              </TableCell>
              <TableCell className="hidden max-w-[160px] truncate text-muted-foreground md:table-cell">
                {renewal.dealTitle}
              </TableCell>
              <TableCell className="font-medium">{renewal.renewalLabel}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

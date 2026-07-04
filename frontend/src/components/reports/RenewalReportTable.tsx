import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTableFrame } from "@/components/shared/ResponsiveTableFrame";
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
      <EmptyState
        icon={RefreshCw}
        title="No renewal records found"
        description="Try adjusting your date range or filters."
      />
    );
  }

  return (
    <ResponsiveTableFrame>
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
              title="Open deal workspace"
              onClick={() =>
                navigate(`/deals/${renewal.dealId}?tab=renewals`)
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
    </ResponsiveTableFrame>
  );
}

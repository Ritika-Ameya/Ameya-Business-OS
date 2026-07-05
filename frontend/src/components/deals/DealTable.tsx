import { Briefcase, Edit, Eye, MoreHorizontal, User } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatDate } from "@/lib/deal-utils";
import { cn } from "@/shared/utils";
import type { Deal, DealStatus } from "@/types/deal";

const statusStyles: Record<DealStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "on-hold": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

interface DealTableProps {
  deals: Deal[];
  isFiltered?: boolean;
  isEmpty?: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
}

export function DealTable({
  deals,
  isFiltered = false,
  isEmpty = false,
  onAdd,
  onResetFilters,
}: DealTableProps) {
  if (deals.length === 0) {
    if (isEmpty) {
      return (
        <EmptyState
          icon={Briefcase}
          title="No deals yet"
          description="Create a deal from a customer workspace to track components and renewals."
          actionLabel="Go to Customers"
          onAction={onAdd}
        />
      );
    }

    return (
      <EmptyState
        icon={Briefcase}
        title="No deals found"
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
            <TableHead className="pl-4">Deal</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Start Date</TableHead>
            <TableHead className="hidden lg:table-cell">Components</TableHead>
            <TableHead className="hidden lg:table-cell">Next Renewal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="group">
              <TableCell className="pl-4">
                <Link
                  to={`/deals/${deal.id}`}
                  className="block rounded-lg py-1 transition-colors hover:text-primary"
                >
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-xs text-muted-foreground lg:hidden">
                    {formatDate(deal.nextRenewal)}
                  </p>
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  to={`/customers/${deal.customerId}`}
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <User className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{deal.customerName}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(deal.startDate)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {deal.componentsCount}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatDate(deal.nextRenewal)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("capitalize", statusStyles[deal.status])}
                >
                  {deal.status.replace("-", " ")}
                </Badge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link to={`/deals/${deal.id}`} aria-label={`View ${deal.title}`}>
                      <Eye />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit deal" disabled>
                    <Edit />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More actions for ${deal.title}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/deals/${deal.id}`}>View workspace</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/customers/${deal.customerId}`}>View customer</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Edit deal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

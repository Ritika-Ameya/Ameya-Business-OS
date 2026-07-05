import { Users } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { Edit, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
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
import { formatCurrency, formatDate } from "@/shared/utils";
import { cn } from "@/shared/utils";
import type { Customer, CustomerStatus } from "@/features/customers/types/customer";

const statusStyles: Record<CustomerStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  prospect: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  isFiltered?: boolean;
  isEmpty?: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
}

export function CustomerTable({
  customers,
  onEdit,
  isFiltered = false,
  isEmpty = false,
  onAdd,
  onResetFilters,
}: CustomerTableProps) {
  if (customers.length === 0) {
    if (isEmpty) {
      return (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start tracking deals, invoices, and renewals."
          actionLabel="Add Customer"
          onAction={onAdd}
        />
      );
    }

    return (
      <EmptyState
        icon={Users}
        title="No customers found"
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
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead className="hidden lg:table-cell">Active Deals</TableHead>
            <TableHead className="hidden lg:table-cell">Next Renewal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="group">
              <TableCell className="pl-4">
                <Link
                  to={`/customers/${customer.id}`}
                  className="block rounded-lg py-1 transition-colors hover:text-primary"
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    {customer.company}
                  </p>
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {customer.company || "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {customer.phone}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-medium",
                    customer.outstanding > 0
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(customer.outstanding)}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {customer.activeDeals}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatDate(customer.nextRenewal)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("capitalize", statusStyles[customer.status])}
                >
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${customer.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/customers/${customer.id}`}>
                        <Eye />
                        View workspace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      <Edit />
                      Edit customer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/customers/${customer.id}/deals/new`}>
                        Create deal
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

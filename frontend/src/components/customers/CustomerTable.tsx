import { Edit, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/customer-utils";
import { cn } from "@/lib/utils";
import type { Customer, CustomerStatus } from "@/types/customer";

const statusStyles: Record<CustomerStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  prospect: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
}

export function CustomerTable({ customers, onEdit }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No customers found</p>
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
              <TableCell className="hidden lg:table-cell">
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
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link to={`/customers/${customer.id}`} aria-label="View customer">
                      <Eye />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(customer)}
                    aria-label="Edit customer"
                  >
                    <Edit />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/customers/${customer.id}`}>View workspace</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        Edit customer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Create deal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

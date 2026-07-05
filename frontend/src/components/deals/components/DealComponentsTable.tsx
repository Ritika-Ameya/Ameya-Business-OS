import { Edit, Eye, MoreHorizontal } from "lucide-react";
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
import {
  BillingTypeBadge,
  ComponentStatusBadge,
} from "@/components/deals/components/ComponentBadges";
import {
  formatComponentCurrency,
  formatComponentDate,
} from "@/lib/deal-component-utils";
import type { DealComponent } from "@/types/deal-component";

interface DealComponentsTableProps {
  components: DealComponent[];
}

export function DealComponentsTable({ components }: DealComponentsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Component</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead>Billing</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Renewal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.map((component) => (
            <TableRow key={component.id}>
              <TableCell className="pl-4">
                <div>
                  <p className="font-medium">{component.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {component.description}
                  </p>
                  <Badge variant="outline" className="mt-1.5 md:hidden">
                    {component.category}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {component.category}
              </TableCell>
              <TableCell>
                <BillingTypeBadge type={component.billingType} />
              </TableCell>
              <TableCell className="font-medium">
                {formatComponentCurrency(component.amount)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatComponentDate(component.renewalDate)}
              </TableCell>
              <TableCell>
                <ComponentStatusBadge status={component.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="View component">
                    <Eye />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit component" disabled>
                    <Edit />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>View details</DropdownMenuItem>
                      <DropdownMenuItem disabled>Edit component</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Remove component</DropdownMenuItem>
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

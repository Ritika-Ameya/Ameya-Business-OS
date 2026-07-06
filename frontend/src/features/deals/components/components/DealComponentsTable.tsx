import { Copy, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
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
} from "@/features/deals/components/components/ComponentBadges";
import {
  formatComponentCurrency,
  formatComponentDate,
} from "@/features/deals/utils/deal-component-utils";
import type { DealComponent } from "@/features/deals/types/deal-component";

interface DealComponentsTableProps {
  components: DealComponent[];
  onView: (component: DealComponent) => void;
  onEdit: (component: DealComponent) => void;
  onRemove: (component: DealComponent) => void;
  onDuplicate: (component: DealComponent) => void;
}

export function DealComponentsTable({
  components,
  onView,
  onEdit,
  onRemove,
  onDuplicate,
}: DealComponentsTableProps) {
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
                {formatComponentCurrency(
                  component.amount * (component.quantity ?? 1) *
                    (1 - (component.discount ?? 0) / 100)
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatComponentDate(component.renewalDate)}
              </TableCell>
              <TableCell>
                <ComponentStatusBadge status={component.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View component"
                    onClick={() => onView(component)}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit component"
                    onClick={() => onEdit(component)}
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
                      <DropdownMenuItem onClick={() => onView(component)}>
                        <Eye />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(component)}>
                        <Edit />
                        Edit component
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(component)}>
                        <Copy />
                        Duplicate component
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemove(component)}
                      >
                        <Trash2 />
                        Remove component
                      </DropdownMenuItem>
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

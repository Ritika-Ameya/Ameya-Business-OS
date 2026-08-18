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
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
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
  computeComponentLineTotal,
  formatComponentCurrency,
  formatComponentDate,
  getComponentCurrentDueDate,
} from "@/features/deals/utils/deal-component-utils";
import type { DealComponent } from "@/features/deals/types/deal-component";

interface DealComponentsTableProps {
  components: DealComponent[];
  onEdit?: (component: DealComponent) => void;
  onDelete?: (component: DealComponent) => void;
}

export function DealComponentsTable({
  components,
  onEdit,
  onDelete,
}: DealComponentsTableProps) {
  return (
    <ResponsiveTableFrame>
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
                <div>
                  {formatComponentCurrency(computeComponentLineTotal(component))}
                  {component.gstPercent > 0 && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      Incl. {component.gstPercent}% GST
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {component.renewalFrequency && component.renewalFrequency !== "none" ? (
                  <div>
                    <p>Next {formatComponentDate(getComponentCurrentDueDate(component))}</p>
                    {component.lastRenewedDate ? (
                      <p className="mt-0.5 text-xs">
                        Paid for {formatComponentDate(component.lastRenewedDate)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs">Not paid yet</p>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <ComponentStatusBadge
                  status={component.status}
                  hasRenewal={
                    Boolean(component.renewalFrequency) &&
                    component.renewalFrequency !== "none"
                  }
                />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View component"
                    disabled={!onEdit}
                    onClick={() => onEdit?.(component)}
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit component"
                    disabled={!onEdit}
                    onClick={() => onEdit?.(component)}
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
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(component)}>
                          Edit component
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(component)}
                          >
                            Remove component
                          </DropdownMenuItem>
                        </>
                      )}
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

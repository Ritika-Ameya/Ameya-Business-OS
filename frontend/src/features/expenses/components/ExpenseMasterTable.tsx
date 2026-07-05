import { Edit, Layers, MoreHorizontal } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  formatExpenseCurrency,
  formatExpenseDate,
  frequencyLabels,
  getCategoryName,
} from "@/features/expenses/utils/expense-utils";
import { cn } from "@/shared/utils";
import type { ExpenseCategoryItem, ExpenseMasterTemplate, ExpenseMasterStatus } from "@/features/expenses/types/expense";

const statusStyles: Record<ExpenseMasterStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

interface ExpenseMasterTableProps {
  masters: ExpenseMasterTemplate[];
  categories: ExpenseCategoryItem[];
  onEdit: (master: ExpenseMasterTemplate) => void;
  isFiltered?: boolean;
  isEmpty?: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
}

export function ExpenseMasterTable({
  masters,
  categories,
  onEdit,
  isFiltered = false,
  isEmpty = false,
  onAdd,
  onResetFilters,
}: ExpenseMasterTableProps) {
  if (masters.length === 0) {
    if (isEmpty) {
      return (
        <EmptyState
          icon={Layers}
          title="No expense templates"
          description="Add recurring templates to auto-generate register entries."
          actionLabel="Add Template"
          onAction={onAdd}
        />
      );
    }

    return (
      <EmptyState
        icon={Layers}
        title="No templates found"
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
            <TableHead className="pl-4">Expense Name</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Vendor / Employee</TableHead>
            <TableHead>Default Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Frequency</TableHead>
            <TableHead className="hidden md:table-cell">Start Date</TableHead>
            <TableHead className="hidden lg:table-cell">End Date</TableHead>
            <TableHead className="hidden md:table-cell">Auto Generate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {masters.map((master) => (
            <TableRow key={master.id}>
              <TableCell className="pl-4 font-medium">{master.name}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {getCategoryName(categories, master.categoryId)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {master.vendorOrEmployee}
              </TableCell>
              <TableCell className="font-medium">
                {formatExpenseCurrency(master.defaultAmount)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {frequencyLabels[master.frequency]}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatExpenseDate(master.startDate)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatExpenseDate(master.endDate)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{master.autoGenerate ? "Yes" : "No"}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("capitalize", statusStyles[master.status])}
                >
                  {master.status}
                </Badge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${master.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(master)}>
                      <Edit />
                      Edit
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

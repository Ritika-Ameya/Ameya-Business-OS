import { Edit, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  formatExpenseCurrency,
  formatExpenseDate,
  frequencyLabels,
  getCategoryName,
} from "@/lib/expense-utils";
import { cn } from "@/lib/utils";
import type { ExpenseCategoryItem, ExpenseMasterTemplate, ExpenseMasterStatus } from "@/types/expense";

const statusStyles: Record<ExpenseMasterStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

interface ExpenseMasterTableProps {
  masters: ExpenseMasterTemplate[];
  categories: ExpenseCategoryItem[];
  onEdit: (master: ExpenseMasterTemplate) => void;
}

export function ExpenseMasterTable({
  masters,
  categories,
  onEdit,
}: ExpenseMasterTableProps) {
  if (masters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No expense templates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add recurring templates to auto-generate register entries.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Expense Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vendor / Employee</TableHead>
            <TableHead>Default Amount</TableHead>
            <TableHead>Frequency</TableHead>
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
              <TableCell className="text-muted-foreground">
                {getCategoryName(categories, master.categoryId)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {master.vendorOrEmployee}
              </TableCell>
              <TableCell className="font-medium">
                {formatExpenseCurrency(master.defaultAmount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
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
                    <Button variant="ghost" size="icon-sm" aria-label="Template actions">
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
    </div>
  );
}

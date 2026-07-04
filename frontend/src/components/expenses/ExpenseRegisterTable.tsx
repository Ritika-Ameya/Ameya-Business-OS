import { Edit, MoreHorizontal, Paperclip, RefreshCw } from "lucide-react";
import { ExpenseStatusBadge } from "@/components/expenses/ExpenseStatusBadge";
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
  getCategoryName,
  paymentMethodLabels,
} from "@/lib/expense-utils";
import type { ExpenseCategoryItem, ExpenseTransaction } from "@/types/expense";

interface ExpenseRegisterTableProps {
  transactions: ExpenseTransaction[];
  categories: ExpenseCategoryItem[];
  onEdit: (transaction: ExpenseTransaction) => void;
}

export function ExpenseRegisterTable({
  transactions,
  categories,
  onEdit,
}: ExpenseRegisterTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No expenses found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting filters or add a new expense transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expense</TableHead>
            <TableHead>Vendor / Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Payment Method</TableHead>
            <TableHead className="hidden md:table-cell">Recurring</TableHead>
            <TableHead className="hidden xl:table-cell">Attachment</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="pl-4 text-muted-foreground">
                {formatExpenseDate(transaction.date)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getCategoryName(categories, transaction.categoryId)}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {transaction.name}
                  {transaction.masterTemplateId && (
                    <RefreshCw className="size-3.5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.vendorOrEmployee}
              </TableCell>
              <TableCell className="font-medium">
                {formatExpenseCurrency(transaction.amount)}
              </TableCell>
              <TableCell>
                <ExpenseStatusBadge status={transaction.status} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {transaction.paymentMethod
                  ? paymentMethodLabels[transaction.paymentMethod]
                  : "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{transaction.recurring ? "Yes" : "No"}</Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {transaction.hasAttachment ? (
                  <Paperclip className="size-4 text-muted-foreground" />
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Expense actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>
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

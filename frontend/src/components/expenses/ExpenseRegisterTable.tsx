import { Edit, MoreHorizontal, Paperclip, ReceiptText, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTableFrame } from "@/components/shared/ResponsiveTableFrame";
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
} from "@/lib/expense-utils";
import { getPaymentMethodLabel } from "@/lib/app-config-utils";
import { useAppConfig } from "@/hooks/use-app-config";
import type { ExpenseCategoryItem, ExpenseTransaction } from "@/types/expense";

interface ExpenseRegisterTableProps {
  transactions: ExpenseTransaction[];
  categories: ExpenseCategoryItem[];
  onEdit: (transaction: ExpenseTransaction) => void;
  isFiltered?: boolean;
  isEmpty?: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
}

export function ExpenseRegisterTable({
  transactions,
  categories,
  onEdit,
  isFiltered = false,
  isEmpty = false,
  onAdd,
  onResetFilters,
}: ExpenseRegisterTableProps) {
  const { paymentMethods } = useAppConfig();

  if (transactions.length === 0) {
    if (isEmpty) {
      return (
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="Record your first expense to start tracking business spending."
          actionLabel="Add Expense"
          onAction={onAdd}
        />
      );
    }

    return (
      <EmptyState
        icon={ReceiptText}
        title="No expenses found"
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
            <TableHead className="pl-4">Date</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Expense</TableHead>
            <TableHead className="hidden md:table-cell">Vendor / Employee</TableHead>
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
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {getCategoryName(categories, transaction.categoryId)}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {transaction.name}
                  {transaction.masterTemplateId && (
                    <RefreshCw className="size-3.5 text-muted-foreground" aria-hidden />
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
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
                  ? getPaymentMethodLabel(transaction.paymentMethod, paymentMethods)
                  : "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{transaction.recurring ? "Yes" : "No"}</Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {transaction.hasAttachment ? (
                  <span title="Has attachment">
                    <Paperclip className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${transaction.name}`}
                    >
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
    </ResponsiveTableFrame>
  );
}

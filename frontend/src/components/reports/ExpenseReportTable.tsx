import { useNavigate } from "react-router-dom";
import { ExpenseStatusBadge } from "@/components/expenses/ExpenseStatusBadge";
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

interface ExpenseReportTableProps {
  transactions: ExpenseTransaction[];
  categories: ExpenseCategoryItem[];
}

export function ExpenseReportTable({
  transactions,
  categories,
}: ExpenseReportTableProps) {
  const navigate = useNavigate();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium">No expense records found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your date range or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="pl-4">Expense Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expense</TableHead>
            <TableHead className="hidden md:table-cell">Vendor / Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Payment Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="cursor-pointer"
              onClick={() =>
                navigate("/expenses", {
                  state: { tab: "register", expenseId: transaction.id },
                })
              }
            >
              <TableCell className="pl-4 text-muted-foreground">
                {formatExpenseDate(transaction.date)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getCategoryName(categories, transaction.categoryId)}
              </TableCell>
              <TableCell className="font-medium">{transaction.name}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {transaction.vendorOrEmployee}
              </TableCell>
              <TableCell className="font-medium">
                {formatExpenseCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {transaction.paymentMethod
                  ? paymentMethodLabels[transaction.paymentMethod]
                  : "—"}
              </TableCell>
              <TableCell>
                <ExpenseStatusBadge status={transaction.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

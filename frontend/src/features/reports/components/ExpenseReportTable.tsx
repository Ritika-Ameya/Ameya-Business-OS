import { ReceiptText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";
import { ResponsiveTableFrame } from "@/shared/components/ResponsiveTableFrame";
import { ExpenseStatusBadge } from "@/features/expenses/components/ExpenseStatusBadge";
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
  getCategoryName,
} from "@/features/expenses/utils/expense-utils";
import { getPaymentMethodLabel } from "@/features/settings/utils/app-config-utils";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import type { ExpenseCategoryItem, ExpenseTransaction } from "@/features/expenses/types/expense";

interface ExpenseReportTableProps {
  transactions: ExpenseTransaction[];
  categories: ExpenseCategoryItem[];
}

export function ExpenseReportTable({
  transactions,
  categories,
}: ExpenseReportTableProps) {
  const navigate = useNavigate();
  const { paymentMethods } = useAppConfig();

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No expense records found"
        description="Try adjusting your date range or filters."
      />
    );
  }

  return (
    <ResponsiveTableFrame>
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
              title="Open expense register"
              onClick={() =>
                navigate(`/expenses?tab=register&expenseId=${transaction.id}`)
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
                  ? getPaymentMethodLabel(transaction.paymentMethod, paymentMethods)
                  : "—"}
              </TableCell>
              <TableCell>
                <ExpenseStatusBadge status={transaction.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableFrame>
  );
}

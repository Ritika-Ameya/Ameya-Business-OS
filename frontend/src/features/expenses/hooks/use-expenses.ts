import { useContext } from "react";
import { ExpensesContext } from "@/features/expenses/hooks/ExpensesContext";

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error("useExpenses must be used within ExpensesProvider");
  }
  return context;
}

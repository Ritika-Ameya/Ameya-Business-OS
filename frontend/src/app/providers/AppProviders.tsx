import type { ReactNode } from "react";
import { AppConfigProvider } from "@/features/settings/hooks/AppConfigContext";
import { CustomersProvider } from "@/features/customers/hooks/CustomersContext";
import { DealsProvider } from "@/features/deals/hooks/DealsContext";
import { ExpensesProvider } from "@/features/expenses/hooks/ExpensesContext";

/** Composes all application context providers in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CustomersProvider>
      <DealsProvider>
        <AppConfigProvider>
          <ExpensesProvider>{children}</ExpensesProvider>
        </AppConfigProvider>
      </DealsProvider>
    </CustomersProvider>
  );
}

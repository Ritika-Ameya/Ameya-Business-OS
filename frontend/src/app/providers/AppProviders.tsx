import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/hooks/AuthContext";
import { DashboardProvider } from "@/features/dashboard/hooks/DashboardContext";
import { AppConfigProvider } from "@/features/settings/hooks/AppConfigContext";
import { CustomersProvider } from "@/features/customers/hooks/CustomersContext";
import { DealsProvider } from "@/features/deals/hooks/DealsContext";
import { ExpensesProvider } from "@/features/expenses/hooks/ExpensesContext";
import { RevenueProvider } from "@/features/revenue/hooks/RevenueContext";

/** Composes all application context providers in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CustomersProvider>
        <DealsProvider>
          <RevenueProvider>
            <AppConfigProvider>
              <ExpensesProvider>
                <DashboardProvider>{children}</DashboardProvider>
              </ExpensesProvider>
            </AppConfigProvider>
          </RevenueProvider>
        </DealsProvider>
      </CustomersProvider>
    </AuthProvider>
  );
}

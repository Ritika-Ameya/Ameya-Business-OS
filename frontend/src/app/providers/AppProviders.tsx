import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/hooks/AuthContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardProvider } from "@/features/dashboard/hooks/DashboardContext";
import { AppConfigProvider } from "@/features/settings/hooks/AppConfigContext";
import { CustomersProvider } from "@/features/customers/hooks/CustomersContext";
import { DealsProvider } from "@/features/deals/hooks/DealsContext";
import { ExpensesProvider } from "@/features/expenses/hooks/ExpensesContext";
import { RevenueProvider } from "@/features/revenue/hooks/RevenueContext";

function BusinessProviders({ children }: { children: ReactNode }) {
  // AppConfig first so company name/logo are available to the shell immediately.
  return (
    <AppConfigProvider>
      <CustomersProvider>
        <DealsProvider>
          <RevenueProvider>
            <ExpensesProvider>
              <DashboardProvider>{children}</DashboardProvider>
            </ExpensesProvider>
          </RevenueProvider>
        </DealsProvider>
      </CustomersProvider>
    </AppConfigProvider>
  );
}

function AuthAwareProviders({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Do not mount data providers before authentication.
  // This prevents unauthorized pre-login API calls and backend 401 noise.
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return <BusinessProviders>{children}</BusinessProviders>;
}

/** Composes all application context providers in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthAwareProviders>{children}</AuthAwareProviders>
    </AuthProvider>
  );
}

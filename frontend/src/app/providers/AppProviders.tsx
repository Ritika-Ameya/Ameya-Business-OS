import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "@/features/auth/hooks/AuthContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardProvider } from "@/features/dashboard/hooks/DashboardContext";
import { AppConfigProvider } from "@/features/settings/hooks/AppConfigContext";
import { CustomersProvider } from "@/features/customers/hooks/CustomersContext";
import { DealsProvider } from "@/features/deals/hooks/DealsContext";
import { ExpensesProvider } from "@/features/expenses/hooks/ExpensesContext";
import { RevenueProvider } from "@/features/revenue/hooks/RevenueContext";

/**
 * Shell (Topbar Breadcrumb + WorkspaceSearch) always needs customers/deals/revenue.
 * Expenses stay route-scoped to keep login→dashboard lighter.
 */
function AuthenticatedBusinessProviders({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const needsExpenses = pathname.startsWith("/expenses");
  const [expensesSeen, setExpensesSeen] = useState(needsExpenses);

  // Derive during render so the first paint of /expenses has the provider
  // (useEffect-only mount races and blank-screens the page).
  const mountExpenses = expensesSeen || needsExpenses;

  useEffect(() => {
    if (needsExpenses) {
      setExpensesSeen(true);
    }
  }, [needsExpenses]);

  let tree = <>{children}</>;
  if (mountExpenses) {
    tree = <ExpensesProvider>{tree}</ExpensesProvider>;
  }

  return (
    <AppConfigProvider>
      <DashboardProvider>
        <CustomersProvider>
          <DealsProvider>
            <RevenueProvider>{tree}</RevenueProvider>
          </DealsProvider>
        </CustomersProvider>
      </DashboardProvider>
    </AppConfigProvider>
  );
}

function AuthAwareProviders({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AuthenticatedBusinessProviders>{children}</AuthenticatedBusinessProviders>
  );
}

/** Composes all application context providers in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthAwareProviders>{children}</AuthAwareProviders>
    </AuthProvider>
  );
}

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "@/app/config";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RouteFallback } from "@/shared/components/RouteFallback";

const AppLayout = lazy(() =>
  import("@/shared/layouts/AppLayout").then((module) => ({ default: module.AppLayout }))
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  }))
);
const CustomersPage = lazy(() =>
  import("@/features/customers/pages/CustomersPage").then((module) => ({
    default: module.CustomersPage,
  }))
);
const CustomerWorkspacePage = lazy(() =>
  import("@/features/customers/pages/CustomerWorkspacePage").then((module) => ({
    default: module.CustomerWorkspacePage,
  }))
);
const CreateDealPage = lazy(() =>
  import("@/features/deals/pages/CreateDealPage").then((module) => ({
    default: module.CreateDealPage,
  }))
);
const DealsPage = lazy(() =>
  import("@/features/deals/pages/DealsPage").then((module) => ({
    default: module.DealsPage,
  }))
);
const DealWorkspacePage = lazy(() =>
  import("@/features/deals/pages/DealWorkspacePage").then((module) => ({
    default: module.DealWorkspacePage,
  }))
);
const InvoicesPage = lazy(() =>
  import("@/features/revenue/pages/InvoicesPage").then((module) => ({
    default: module.InvoicesPage,
  }))
);
const InvoiceWorkspacePage = lazy(() =>
  import("@/features/revenue/pages/InvoiceWorkspacePage").then((module) => ({
    default: module.InvoiceWorkspacePage,
  }))
);
const RevenuePage = lazy(() =>
  import("@/features/revenue/pages/RevenuePage").then((module) => ({
    default: module.RevenuePage,
  }))
);
const ExpensesPage = lazy(() =>
  import("@/features/expenses/pages/ExpensesPage").then((module) => ({
    default: module.ExpensesPage,
  }))
);
const ReportsPage = lazy(() =>
  import("@/features/reports/pages/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  }))
);
const SettingsLayout = lazy(() =>
  import("@/features/settings/components/SettingsLayout").then((module) => ({
    default: module.SettingsLayout,
  }))
);
const CompanySettingsPage = lazy(() =>
  import("@/features/settings/pages/CompanySettingsPage").then((module) => ({
    default: module.CompanySettingsPage,
  }))
);
const FinanceSettingsPage = lazy(() =>
  import("@/features/settings/pages/FinanceSettingsPage").then((module) => ({
    default: module.FinanceSettingsPage,
  }))
);
const MastersSettingsPage = lazy(() =>
  import("@/features/settings/pages/MastersSettingsPage").then((module) => ({
    default: module.MastersSettingsPage,
  }))
);
const BrandingSettingsPage = lazy(() =>
  import("@/features/settings/pages/BrandingSettingsPage").then((module) => ({
    default: module.BrandingSettingsPage,
  }))
);
const PreferencesSettingsPage = lazy(() =>
  import("@/features/settings/pages/PreferencesSettingsPage").then((module) => ({
    default: module.PreferencesSettingsPage,
  }))
);

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate replace to={APP_ROUTES.default} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerWorkspacePage />} />
          <Route path="/customers/:customerId/deals/new" element={<CreateDealPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/new" element={<CreateDealPage />} />
          <Route path="/deals/:dealId" element={<DealWorkspacePage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceWorkspacePage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate replace to={APP_ROUTES.settingsDefault} />} />
            <Route path="company" element={<CompanySettingsPage />} />
            <Route path="masters" element={<MastersSettingsPage />} />
            <Route path="finance" element={<FinanceSettingsPage />} />
            <Route path="branding" element={<BrandingSettingsPage />} />
            <Route path="preferences" element={<PreferencesSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

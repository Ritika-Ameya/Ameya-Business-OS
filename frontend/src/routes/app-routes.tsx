import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "@/app/config";
import { AppLayout } from "@/shared/layouts/AppLayout";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { CustomersPage } from "@/features/customers/pages/CustomersPage";
import { CustomerWorkspacePage } from "@/features/customers/pages/CustomerWorkspacePage";
import { CreateDealPage } from "@/features/deals/pages/CreateDealPage";
import { DealsPage } from "@/features/deals/pages/DealsPage";
import { DealWorkspacePage } from "@/features/deals/pages/DealWorkspacePage";
import { InvoicesPage } from "@/features/revenue/pages/InvoicesPage";
import { InvoiceWorkspacePage } from "@/features/revenue/pages/InvoiceWorkspacePage";
import { RevenuePage } from "@/features/revenue/pages/RevenuePage";
import { ExpensesPage } from "@/features/expenses/pages/ExpensesPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { CompanySettingsPage } from "@/features/settings/pages/CompanySettingsPage";
import { FinanceSettingsPage } from "@/features/settings/pages/FinanceSettingsPage";
import { MastersSettingsPage } from "@/features/settings/pages/MastersSettingsPage";
import { BrandingSettingsPage } from "@/features/settings/pages/BrandingSettingsPage";
import { PreferencesSettingsPage } from "@/features/settings/pages/PreferencesSettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate replace to={APP_ROUTES.default} />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:customerId" element={<CustomerWorkspacePage />} />
        <Route path="/customers/:customerId/deals/new" element={<CreateDealPage />} />
        <Route path="/deals" element={<DealsPage />} />
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
  );
}

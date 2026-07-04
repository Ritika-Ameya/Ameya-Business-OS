import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { CustomersProvider } from "@/context/CustomersContext";
import { DealsProvider } from "@/context/DealsContext";
import { ExpensesProvider } from "@/context/ExpensesContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { CreateDealPage } from "@/pages/CreateDealPage";
import { CustomerWorkspacePage } from "@/pages/CustomerWorkspacePage";
import { CustomersPage } from "@/pages/CustomersPage";
import { DealWorkspacePage } from "@/pages/DealWorkspacePage";
import { DealsPage } from "@/pages/DealsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { InvoiceWorkspacePage } from "@/pages/InvoiceWorkspacePage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { RevenuePage } from "@/pages/RevenuePage";
import { CompanySettingsPage } from "@/pages/settings/CompanySettingsPage";
import { FinanceSettingsPage } from "@/pages/settings/FinanceSettingsPage";
import { MastersSettingsPage } from "@/pages/settings/MastersSettingsPage";
import { PreferencesSettingsPage } from "@/pages/settings/PreferencesSettingsPage";

function App() {
  return (
    <CustomersProvider>
      <DealsProvider>
        <ExpensesProvider>
          <SettingsProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate replace to="/dashboard" />} />
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
                  <Route index element={<Navigate replace to="company" />} />
                  <Route path="company" element={<CompanySettingsPage />} />
                  <Route path="masters" element={<MastersSettingsPage />} />
                  <Route path="finance" element={<FinanceSettingsPage />} />
                  <Route path="preferences" element={<PreferencesSettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </SettingsProvider>
        </ExpensesProvider>
      </DealsProvider>
    </CustomersProvider>
  );
}

export default App;
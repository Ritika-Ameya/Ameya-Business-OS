import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CustomersProvider } from "@/context/CustomersContext";
import { CustomerWorkspacePage } from "@/pages/CustomerWorkspacePage";
import { CustomersPage } from "@/pages/CustomersPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { RevenuePage } from "@/pages/RevenuePage";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <CustomersProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerWorkspacePage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </CustomersProvider>
  );
}

export default App;
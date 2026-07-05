import { Navigate } from "react-router-dom";

/** Legacy list route — invoices live under Revenue. */
export function InvoicesPage() {
  return <Navigate to="/revenue?tab=invoices" replace />;
}

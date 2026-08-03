import { AppProviders } from "@/app/providers";
import { AppRoutes } from "@/routes";
import { DocumentTitle } from "@/shared/components/DocumentTitle";

export default function App() {
  return (
    <AppProviders>
      <DocumentTitle />
      <AppRoutes />
    </AppProviders>
  );
}

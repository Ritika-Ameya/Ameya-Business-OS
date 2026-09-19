import { lazy, Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/features/auth/hooks/AuthContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RouteFallback } from "@/shared/components/RouteFallback";

const AuthenticatedBusinessProviders = lazy(() =>
  import("@/app/providers/AuthenticatedBusinessProviders").then((module) => ({
    default: module.AuthenticatedBusinessProviders,
  }))
);

function AuthAwareProviders({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AuthenticatedBusinessProviders>{children}</AuthenticatedBusinessProviders>
    </Suspense>
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

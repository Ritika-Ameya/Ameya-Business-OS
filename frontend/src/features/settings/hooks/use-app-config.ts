import { useContext } from "react";
import { AppConfigContext } from "@/features/settings/hooks/AppConfigContext";
import type { AppConfigValue } from "@/features/settings/types/app-config";

export function useAppConfig(): AppConfigValue {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}

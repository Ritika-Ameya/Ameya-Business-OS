import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";

export function SettingsMessages() {
  const { error, successMessage, clearMessages } = useAppConfig();

  if (!error && !successMessage) {
    return null;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">{error}</div>
          <button type="button" className="text-xs underline" onClick={clearMessages}>
            Dismiss
          </button>
        </div>
      )}
      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">{successMessage}</div>
          <button type="button" className="text-xs underline" onClick={clearMessages}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

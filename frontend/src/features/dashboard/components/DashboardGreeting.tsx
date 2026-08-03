import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { formatTodayDate } from "@/features/dashboard/utils/dashboard-utils";
import { CompanyLogoImage } from "@/shared/components/CompanyLogoImage";
import { getCompanyDisplayName } from "@/shared/utils/company-brand";

export function DashboardGreeting() {
  const { company, branding } = useAppConfig();
  const companyName = getCompanyDisplayName(company.companyName);
  const hasLogo = Boolean(branding.logoUrl?.trim());

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-5 shadow-sm sm:p-6 lg:p-8 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div
        className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-8 size-48 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-400/10"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-md ring-1 ring-slate-200/90 sm:size-28 lg:size-32 dark:bg-white dark:ring-white/25">
          {hasLogo ? (
            <CompanyLogoImage
              logoUrl={branding.logoUrl}
              alt={companyName}
              className="size-full"
            />
          ) : (
            <span className="text-2xl font-bold tracking-tight text-slate-700 sm:text-3xl">
              {companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {formatTodayDate()}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-white">
            Good evening, Abhay
          </h1>
          <p className="max-w-xl text-sm text-slate-600 md:text-base dark:text-slate-300">
            Welcome to {companyName} — your command center for customers, revenue,
            renewals, and collections.
          </p>
        </div>
      </div>
    </div>
  );
}

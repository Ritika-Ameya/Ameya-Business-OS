import { formatTodayDate, getTimeOfDayGreeting } from "@/features/dashboard/utils/dashboard-utils";

export function DashboardGreeting() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-elevated sm:p-8 dark:border-white/10">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-fuchsia-400/20 blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {formatTodayDate()}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {getTimeOfDayGreeting()}, Abhay
        </h1>
        <p className="max-w-xl text-sm text-white/80 sm:text-base">
          Your command center for customers, revenue, renewals, and collections.
        </p>
      </div>
    </div>
  );
}

import { formatTodayDate, getTimeOfDayGreeting } from "@/features/dashboard/utils/dashboard-utils";

export function DashboardGreeting() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {getTimeOfDayGreeting()}, Abhay 👋
      </h1>
      <p className="text-sm text-muted-foreground">{formatTodayDate()}</p>
    </div>
  );
}

import { formatDate, toLocalIsoDate } from "@/shared/utils/format-date";

export function calendarMonthPeriod(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function shortMonthYear(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function lastCalendarMonthPeriod(date = new Date()): string {
  return calendarMonthPeriod(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

export function nextCalendarMonthPeriod(date = new Date()): string {
  return calendarMonthPeriod(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

export function quarterPeriod(date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function nextQuarterPeriod(date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  if (quarter === 4) return `Q1 ${date.getFullYear() + 1}`;
  return `Q${quarter + 1} ${date.getFullYear()}`;
}

export function currentYearPeriod(date = new Date()): string {
  return String(date.getFullYear());
}

export function lastSixMonthsPeriod(date = new Date()): string {
  const from = new Date(date.getFullYear(), date.getMonth() - 5, 1);
  return `${shortMonthYear(from)} – ${shortMonthYear(date)}`;
}

export function calendarDayPeriod(date = new Date()): string {
  return formatDate(toLocalIsoDate(date));
}

export function tomorrowDayPeriod(date = new Date()): string {
  return calendarDayPeriod(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  );
}

export const ALL_TIME = "All time";
export const AS_OF_TODAY = "As of today";

export function thisMonthPeriod(date = new Date()): string {
  return `This month · ${calendarMonthPeriod(date)}`;
}

export function thisQuarterPeriod(date = new Date()): string {
  return `This quarter · ${quarterPeriod(date)}`;
}

export function thisYearPeriod(date = new Date()): string {
  return `This year · ${currentYearPeriod(date)}`;
}

export function nextMonthPeriod(date = new Date()): string {
  return `Next month · ${nextCalendarMonthPeriod(date)}`;
}

/** Maps a date-preset filter to a human-readable period (no calculation change). */
export function datePresetPeriodLabel(
  preset: string,
  dateFrom = "",
  dateTo = ""
): string {
  switch (preset) {
    case "today":
      return `Today · ${calendarDayPeriod()}`;
    case "this-week":
      return "This week";
    case "this-month":
      return thisMonthPeriod();
    case "last-month":
      return `Last month · ${lastCalendarMonthPeriod()}`;
    case "this-quarter":
      return thisQuarterPeriod();
    case "this-year":
      return thisYearPeriod();
    case "all":
      return ALL_TIME;
    case "custom": {
      if (dateFrom && dateTo) {
        return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
      }
      if (dateFrom) return `From ${formatDate(dateFrom)}`;
      if (dateTo) return `Until ${formatDate(dateTo)}`;
      return "Custom range";
    }
    default:
      return "Selected period";
  }
}

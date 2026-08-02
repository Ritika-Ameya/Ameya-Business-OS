const PREFERENCES_KEY = "ameya-settings-preferences";
const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";

type DateParts = { year: number; month: number; day: number };

let activeDateFormat: string = DEFAULT_DATE_FORMAT;

/** Called by AppConfigProvider so formatters react to preference changes. */
export function setActiveDateFormat(format?: string | null): void {
  const trimmed = format?.trim();
  activeDateFormat = trimmed || DEFAULT_DATE_FORMAT;
}

export function getActiveDateFormat(): string {
  return activeDateFormat || readStoredDateFormat();
}

function readStoredDateFormat(): string {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_DATE_FORMAT;
    const parsed = JSON.parse(raw) as { dateFormat?: string };
    return parsed.dateFormat?.trim() || DEFAULT_DATE_FORMAT;
  } catch {
    return DEFAULT_DATE_FORMAT;
  }
}

function parseDateParts(date?: string): DateParts | null {
  if (!date?.trim()) return null;
  const trimmed = date.trim();

  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateOnly) {
    return {
      year: Number(isoDateOnly[1]),
      month: Number(isoDateOnly[2]),
      day: Number(isoDateOnly[3]),
    };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local calendar YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export function toLocalIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Add calendar days using local time, return YYYY-MM-DD. */
export function addLocalDaysIso(days: number, from: Date = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

function formatWithPattern(parts: DateParts, pattern: string): string {
  const day = pad2(parts.day);
  const month = pad2(parts.month);
  const year = String(parts.year);

  switch (pattern) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD MMM YYYY": {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(parts.year, parts.month - 1, parts.day));
    }
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDate(date?: string): string {
  const parts = parseDateParts(date);
  if (!parts) return "—";
  return formatWithPattern(parts, getActiveDateFormat());
}

/** Date + time for timeline / activity stamps. */
export function formatDateTime(date?: string): string {
  if (!date) return "—";

  // Date-only values should not invent a local time (e.g. 5:30 AM from UTC midnight).
  if (/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return formatDate(date);
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  const dateLabel = formatDate(
    `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`
  );
  const timeLabel = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);

  return `${dateLabel}, ${timeLabel}`;
}

export function isRenewalThisMonth(date?: string): boolean {
  const parts = parseDateParts(date);
  if (!parts) return false;
  const now = new Date();
  return parts.month === now.getMonth() + 1 && parts.year === now.getFullYear();
}

export function isUpcomingRenewal(date?: string): boolean {
  const parts = parseDateParts(date);
  if (!parts) return false;
  const renewal = new Date(parts.year, parts.month - 1, parts.day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return renewal >= today;
}

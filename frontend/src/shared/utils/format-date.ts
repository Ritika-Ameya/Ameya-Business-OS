const PREFERENCES_KEY = "ameya-settings-preferences";
const DEFAULT_DATE_FORMAT = "DD MMM YYYY";
const LEGACY_DATE_FORMAT = "DD/MM/YYYY";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

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

function monthFromName(name: string): number | null {
  return MONTH_INDEX[name.toLowerCase().replace(/\./g, "")] ?? null;
}

function parseDateParts(date?: string): DateParts | null {
  if (!date?.trim()) return null;
  const trimmed = date.trim();

  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateOnly) {
    return validParts(
      Number(isoDateOnly[1]),
      Number(isoDateOnly[2]),
      Number(isoDateOnly[3]),
    );
  }

  const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(trimmed);
  if (dmy) {
    return validParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }

  const compact = /^(\d{2})(\d{2})(\d{4})$/.exec(trimmed);
  if (compact) {
    return validParts(Number(compact[3]), Number(compact[2]), Number(compact[1]));
  }

  const named = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(trimmed);
  if (named) {
    const month = monthFromName(named[2]);
    if (!month) return null;
    return validParts(Number(named[3]), month, Number(named[1]));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

function validParts(year: number, month: number, day: number): DateParts | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Convert a stored date into the active display format, e.g. 26 Aug 2027. */
export function isoToDisplayDate(iso?: string): string {
  const parts = parseDateParts(iso);
  if (!parts) return "";
  return formatWithPattern(parts, getActiveDateFormat());
}

/** Example shown in empty date fields, matching the active display format. */
export function dateInputPlaceholder(): string {
  return formatWithPattern({ year: 2027, month: 8, day: 26 }, getActiveDateFormat());
}

/** Parse a typed date into YYYY-MM-DD. Empty string if blank; null if invalid. */
export function displayDateToIso(value?: string): string | null {
  if (!value?.trim()) return "";
  const parts = parseDateParts(value);
  if (!parts) return null;
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
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
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "DD MMM YYYY":
    default:
      return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${year}`;
  }
}

/** Older installs stored the slash format. Display dates as 26 Aug 2027 instead. */
export function preferredDateFormat(format?: string | null): string {
  const trimmed = format?.trim();
  if (!trimmed || trimmed === LEGACY_DATE_FORMAT) return DEFAULT_DATE_FORMAT;
  return trimmed;
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

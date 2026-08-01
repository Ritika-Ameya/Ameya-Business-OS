/**
 * Visual design tokens only — no business logic.
 */

export const THEME_STORAGE_KEY = "ameya-shell-theme";

export const statusBadgeStyles = {
  active:
    "border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-border/60 bg-muted text-muted-foreground",
  prospect:
    "border-sky-500/25 bg-gradient-to-r from-sky-500/15 to-blue-500/10 text-sky-700 dark:text-sky-300",
  pending:
    "border-amber-500/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-800 dark:text-amber-300",
  due: "border-amber-500/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-800 dark:text-amber-300",
  overdue:
    "border-rose-500/25 bg-gradient-to-r from-rose-500/15 to-red-500/10 text-rose-700 dark:text-rose-300",
  paid: "border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-border/60 bg-muted text-muted-foreground",
  renewed:
    "border-violet-500/25 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-700 dark:text-violet-300",
  won: "border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300",
  lost: "border-rose-500/25 bg-gradient-to-r from-rose-500/15 to-red-500/10 text-rose-700 dark:text-rose-300",
  draft:
    "border-slate-500/25 bg-gradient-to-r from-slate-500/15 to-slate-400/10 text-slate-700 dark:text-slate-300",
  partially_paid:
    "border-amber-500/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-800 dark:text-amber-300",
} as const;

export type StatusBadgeKey = keyof typeof statusBadgeStyles;

/** Module color identities for KPI / nav accents (presentation only). */
export const moduleAccents = {
  dashboard: {
    bar: "accent-bar-blue",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    glow: "from-blue-500/20 to-indigo-500/10",
    solid: "bg-blue-500",
  },
  customers: {
    bar: "accent-bar-blue",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    glow: "from-blue-500/25 to-sky-500/10",
    solid: "bg-blue-500",
  },
  revenue: {
    bar: "accent-bar-emerald",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/25 to-teal-500/10",
    solid: "bg-emerald-500",
  },
  collections: {
    bar: "accent-bar-violet",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    glow: "from-violet-500/25 to-fuchsia-500/10",
    solid: "bg-violet-500",
  },
  invoices: {
    bar: "accent-bar-orange",
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    glow: "from-orange-500/25 to-amber-500/10",
    solid: "bg-orange-500",
  },
  renewals: {
    bar: "accent-bar-teal",
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    glow: "from-teal-500/25 to-cyan-500/10",
    solid: "bg-teal-500",
  },
  deals: {
    bar: "accent-bar-indigo",
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    glow: "from-indigo-500/25 to-violet-500/10",
    solid: "bg-indigo-500",
  },
  expenses: {
    bar: "accent-bar-rose",
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    glow: "from-rose-500/25 to-pink-500/10",
    solid: "bg-rose-500",
  },
  reports: {
    bar: "accent-bar-cyan",
    iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    glow: "from-cyan-500/25 to-sky-500/10",
    solid: "bg-cyan-500",
  },
  cash: {
    bar: "accent-bar-emerald",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/20 to-lime-500/10",
    solid: "bg-emerald-500",
  },
  settings: {
    bar: "accent-bar-indigo",
    iconBg: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    glow: "from-slate-500/20 to-indigo-500/10",
    solid: "bg-slate-500",
  },
} as const;

export type ModuleAccentKey = keyof typeof moduleAccents;

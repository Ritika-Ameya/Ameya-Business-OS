import {
  BarChart3,
  DollarSign,
  Gauge,
  Handshake,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";
import type { ModuleAccentKey } from "@/shared/constants/theme";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
  /** Visual-only module accent key */
  accent: ModuleAccentKey;
  section: "main" | "finance" | "system";
};

export const navSections = [
  { id: "main" as const, label: "Workspace" },
  { id: "finance" as const, label: "Finance" },
  { id: "system" as const, label: "System" },
];

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge, accent: "dashboard", section: "main" },
  {
    label: "Opportunities / Customers",
    href: "/customers",
    icon: Users,
    accent: "customers",
    section: "main",
  },
  { label: "Deals", href: "/deals", icon: Handshake, accent: "deals", section: "main" },
  { label: "Revenue", href: "/revenue", icon: DollarSign, accent: "revenue", section: "finance" },
  {
    label: "Expenses",
    href: "/expenses",
    icon: ReceiptText,
    accent: "expenses",
    section: "finance",
  },
  { label: "Reports", href: "/reports", icon: BarChart3, accent: "reports", section: "finance" },
  { label: "Settings", href: "/settings", icon: Settings, accent: "settings", section: "system" },
];

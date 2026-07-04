import {
  BarChart3,
  DollarSign,
  Gauge,
  Handshake,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Deals", href: "/deals", icon: Handshake },
  { label: "Revenue", href: "/revenue", icon: DollarSign },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

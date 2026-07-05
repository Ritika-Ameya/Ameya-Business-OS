import type { Deal } from "@/features/deals/types/deal";

export const seedDeals: Deal[] = [
  {
    id: "deal-001",
    title: "Annual Maintenance Contract",
    customerId: "cust-001",
    customerName: "Rahul Mehta",
    status: "active",
    startDate: "2025-04-01",
    nextRenewal: "2026-07-15",
    componentsCount: 3,
  },
  {
    id: "deal-002",
    title: "Consulting Engagement",
    customerId: "cust-002",
    customerName: "Priya Sharma",
    status: "active",
    startDate: "2025-09-12",
    nextRenewal: "2026-08-20",
    componentsCount: 2,
  },
  {
    id: "deal-003",
    title: "Logistics Platform Setup",
    customerId: "cust-003",
    customerName: "Vikram Desai",
    status: "draft",
    startDate: "2026-01-20",
    componentsCount: 0,
  },
];

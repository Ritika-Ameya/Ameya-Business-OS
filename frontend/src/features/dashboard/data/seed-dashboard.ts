import type { DashboardActivity } from "@/features/dashboard/types/dashboard";

export const seedDashboardActivity: DashboardActivity[] = [
  {
    id: "act-001",
    type: "payment_recorded",
    title: "Payment Recorded",
    description: "₹30,000 received from Rahul Mehta for INV-2026-0051",
    timestamp: "2026-07-03T10:30:00",
  },
  {
    id: "act-002",
    type: "invoice_generated",
    title: "Invoice Generated",
    description: "INV-2026-0058 created for Priya Sharma",
    timestamp: "2026-07-01T14:15:00",
  },
  {
    id: "act-003",
    type: "deal_created",
    title: "Deal Created",
    description: "Logistics Platform Setup added for Vikram Desai",
    timestamp: "2026-06-28T09:00:00",
  },
  {
    id: "act-004",
    type: "renewal_completed",
    title: "Renewal Completed",
    description: "Annual Maintenance Contract renewed for Rahul Mehta",
    timestamp: "2026-06-15T16:45:00",
  },
  {
    id: "act-005",
    type: "expense_added",
    title: "Expense Added",
    description: "Office supplies — ₹4,200",
    timestamp: "2026-06-12T11:20:00",
  },
];

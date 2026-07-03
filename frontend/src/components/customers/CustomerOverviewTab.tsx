import { Activity, CalendarClock, IndianRupee, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/customer-utils";
import type { Customer } from "@/types/customer";

interface CustomerOverviewTabProps {
  customer: Customer;
}

export function CustomerOverviewTab({ customer }: CustomerOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Business Summary</CardTitle>
                <CardDescription>Relationship overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business Since</span>
              <span className="font-medium">{formatDate(customer.businessSince)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business Value</span>
              <span className="font-medium">{formatCurrency(customer.businessValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Deals</span>
              <span className="font-medium">{customer.activeDeals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{customer.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <IndianRupee className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Collection Summary</CardTitle>
                <CardDescription>Payment status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-medium">{formatCurrency(customer.outstanding)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Payment</span>
              <span className="font-medium">{formatDate(customer.lastPayment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collection Status</span>
              <span className="font-medium">
                {customer.outstanding > 0 ? "Pending" : "Clear"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-none md:col-span-2 xl:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
                <CalendarClock className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle>Renewal Summary</CardTitle>
                <CardDescription>Upcoming renewals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next Renewal</span>
              <span className="font-medium">{formatDate(customer.nextRenewal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Renewal Status</span>
              <span className="font-medium">
                {customer.nextRenewal ? "Scheduled" : "Not set"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/70 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Activity className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions and updates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
            <p className="text-sm font-medium">No recent activity</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Activity will appear here as you manage deals, invoices, and payments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

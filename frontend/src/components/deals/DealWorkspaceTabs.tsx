import {
  Clock,
  FileText,
  History,
  Layers,
  LayoutGrid,
  Receipt,
  RefreshCw,
  StickyNote,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import { PlaceholderCard } from "./PlaceholderCard";

interface DealWorkspaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function TabPlaceholderGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function DealWorkspaceTabs({ activeTab, onTabChange }: DealWorkspaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="gap-6">
      <div className="overflow-x-auto pb-1">
        <TabsList
          variant="line"
          className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
        >
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2">
            <LayoutGrid />
            Overview
          </TabsTrigger>
          <TabsTrigger value="components" className="rounded-lg px-4 py-2">
            <Layers />
            Components
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg px-4 py-2">
            <Receipt />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-4 py-2">
            <Wallet />
            Payments
          </TabsTrigger>
          <TabsTrigger value="renewals" className="rounded-lg px-4 py-2">
            <RefreshCw />
            Renewals
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-4 py-2">
            <FileText />
            Documents
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg px-4 py-2">
            <History />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg px-4 py-2">
            <StickyNote />
            Notes
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={LayoutGrid}
            title="Deal Summary"
            description="Core deal information"
            message="Deal details will appear here once configured."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Wallet}
            title="Financial Summary"
            description="Revenue and collections"
            message="Financial overview will be available here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <PlaceholderCard
            icon={RefreshCw}
            title="Renewal Summary"
            description="Renewal schedule"
            message="Renewal details will be shown here."
            accent="bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="components" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={Layers}
            title="Service Components"
            description="Billable items"
            message="Components added to this deal will appear here."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Receipt}
            title="Component Pricing"
            description="Rate structure"
            message="Pricing details will be displayed here."
            accent="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="invoices" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={Receipt}
            title="Invoices"
            description="Billing records"
            message="No invoices have been created for this deal yet."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Wallet}
            title="Invoice Status"
            description="Payment tracking"
            message="Invoice status will be tracked here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={Wallet}
            title="Payment History"
            description="Recorded payments"
            message="Payment records will appear here once received."
            accent="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <PlaceholderCard
            icon={Receipt}
            title="Outstanding"
            description="Amount due"
            message="Outstanding balance will be shown here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="renewals" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={RefreshCw}
            title="Renewal Schedule"
            description="Upcoming renewals"
            message="Renewal dates will be listed here."
            accent="bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <PlaceholderCard
            icon={History}
            title="Renewal History"
            description="Past renewals"
            message="Previous renewals will be tracked here."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={FileText}
            title="Documents"
            description="Contracts and files"
            message="Uploaded documents will appear here."
            accent="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <PlaceholderCard
            icon={Receipt}
            title="Agreements"
            description="Signed contracts"
            message="Deal agreements will be stored here."
            accent="bg-muted"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">Timeline</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A chronological history of this deal will appear here.
            </p>
            <div className="mt-8 w-full space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-border" />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 text-left opacity-50">
                  <p className="text-xs text-muted-foreground">Waiting for activity</p>
                  <p className="mt-1 text-sm">Deal events will build over time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notes" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={StickyNote}
            title="Deal Notes"
            description="Internal notes"
            message="Notes about this deal will be saved here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <PlaceholderCard
            icon={History}
            title="Note History"
            description="Previous notes"
            message="A history of notes will be maintained here."
            accent="bg-muted"
          />
        </TabPlaceholderGrid>
      </TabsContent>
    </Tabs>
  );
}

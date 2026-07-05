import { Layers, Plus, ReceiptText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/PageHeader";
import { ExpenseMasterTab } from "@/components/expenses/ExpenseMasterTab";
import { ExpenseRegisterTab } from "@/components/expenses/ExpenseRegisterTab";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type ExpenseTab = "register" | "master";

type ExpensesNavigationState = {
  tab?: ExpenseTab;
  expenseId?: string;
  action?: "add";
};

const expenseTabLabels: Record<ExpenseTab, string> = {
  register: "Expense Register",
  master: "Expense Master",
};

function parseExpenseTab(value: string | null): ExpenseTab {
  return value === "master" ? "master" : "register";
}

export function ExpensesPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationState = location.state as ExpensesNavigationState | null;

  const activeTab = parseExpenseTab(searchParams.get("tab"));
  const expenseId = searchParams.get("expenseId");
  const openAddDialog = searchParams.get("action") === "add";

  const [registerDialogOpen, setRegisterDialogOpen] = useState(openAddDialog);

  useEffect(() => {
    if (!navigationState) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (navigationState.tab) next.set("tab", navigationState.tab);
        if (navigationState.expenseId) next.set("expenseId", navigationState.expenseId);
        if (navigationState.action) next.set("action", navigationState.action);
        return next;
      },
      { replace: true }
    );
    window.history.replaceState({}, document.title);
  }, [navigationState, setSearchParams]);

  useEffect(() => {
    if (openAddDialog) {
      setRegisterDialogOpen(true);
    }
  }, [openAddDialog]);

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        next.delete("expenseId");
        next.delete("action");
        return next;
      },
      { replace: true }
    );
  };

  const handleRegisterDialogOpenChange = useCallback(
    (open: boolean) => {
      setRegisterDialogOpen(open);
      if (!open) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("action");
            next.delete("expenseId");
            return next;
          },
          { replace: true }
        );
      }
    },
    [setSearchParams]
  );

  const handleExpenseIdHandled = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("expenseId");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Expenses"
        subtitle="Track, record and manage all business expenses."
        action={
          activeTab === "register" ? (
            <Button
              className="rounded-xl"
              onClick={() => setRegisterDialogOpen(true)}
            >
              <Plus />
              Add Expense
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            <TabsTrigger value="register" className="rounded-lg px-4 py-2">
              <ReceiptText />
              {expenseTabLabels.register}
            </TabsTrigger>
            <TabsTrigger value="master" className="rounded-lg px-4 py-2">
              <Layers />
              {expenseTabLabels.master}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="register" className="mt-0">
          <ExpenseRegisterTab
            expenseId={expenseId}
            onExpenseIdHandled={handleExpenseIdHandled}
            dialogOpen={registerDialogOpen}
            onDialogOpenChange={handleRegisterDialogOpenChange}
          />
        </TabsContent>

        <TabsContent value="master" className="mt-0">
          <ExpenseMasterTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

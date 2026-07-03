import { Layers, Plus, ReceiptText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/customers/PageHeader";
import { ExpenseMasterTab } from "@/components/expenses/ExpenseMasterTab";
import { ExpenseRegisterTab } from "@/components/expenses/ExpenseRegisterTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("register");
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expenses"
        subtitle="Track, record and manage all business expenses."
        action={
          activeTab === "register" ? (
            <Button className="rounded-xl" onClick={() => setRegisterDialogOpen(true)}>
              <Plus />
              Add Expense
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            <TabsTrigger value="register" className="rounded-lg px-4 py-2">
              <ReceiptText />
              Expense Register
            </TabsTrigger>
            <TabsTrigger value="master" className="rounded-lg px-4 py-2">
              <Layers />
              Expense Master
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="register" className="mt-0">
          <ExpenseRegisterTab
            dialogOpen={registerDialogOpen}
            onDialogOpenChange={setRegisterDialogOpen}
          />
        </TabsContent>

        <TabsContent value="master" className="mt-0">
          <ExpenseMasterTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

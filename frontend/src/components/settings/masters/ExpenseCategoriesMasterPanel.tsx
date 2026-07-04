import { Edit, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ExpenseCategoryDialog } from "@/components/settings/masters/dialogs/ExpenseCategoryDialog";
import { SettingsSearchBar } from "@/components/settings/SettingsSearchBar";
import { SettingsStatusBadge } from "@/components/settings/SettingsStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSettings } from "@/hooks/use-settings";
import { filterByQuery } from "@/lib/settings-utils";
import type { SettingsExpenseCategory } from "@/types/settings";

export function ExpenseCategoriesMasterPanel() {
  const { expenseCategories, addExpenseCategory, updateExpenseCategory } = useSettings();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsExpenseCategory | undefined>();

  const filtered = useMemo(
    () =>
      filterByQuery(expenseCategories, query, (item) => [
        item.name,
        item.description,
      ]),
    [expenseCategories, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search expense categories..."
        />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="pl-4 font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <SettingsStatusBadge status={category.status} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(category);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseCategoryDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSave={(data) => {
          if (editing) updateExpenseCategory(editing.id, data);
          else addExpenseCategory(data);
        }}
      />
    </div>
  );
}

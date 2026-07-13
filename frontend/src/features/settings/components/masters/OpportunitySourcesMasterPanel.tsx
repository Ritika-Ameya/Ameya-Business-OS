import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NamedMasterDialog } from "@/features/settings/components/masters/dialogs/NamedMasterDialog";
import { SettingsSearchBar } from "@/features/settings/components/SettingsSearchBar";
import { SettingsStatusBadge } from "@/features/settings/components/SettingsStatusBadge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { filterByQuery } from "@/features/settings/utils/settings-utils";
import type { SettingsOpportunitySource } from "@/features/settings/types/settings";

export function OpportunitySourcesMasterPanel() {
  const { opportunitySources, addOpportunitySource, updateOpportunitySource, deleteOpportunitySource, saving } =
    useAppConfig();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsOpportunitySource | undefined>();

  const filtered = useMemo(
    () => filterByQuery(opportunitySources, query, (item) => [item.name, item.description]),
    [opportunitySources, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search opportunity sources..."
        />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Source
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Source</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No opportunity sources found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {item.description || "—"}
                  </TableCell>
                  <TableCell>
                    <SettingsStatusBadge status={item.status} />
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
                            setEditing(item);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (window.confirm(`Delete "${item.name}"?`)) {
                              void deleteOpportunitySource(item.id);
                            }
                          }}
                        >
                          <Trash2 />
                          Delete
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

      <NamedMasterDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Opportunity Source" : "Add Opportunity Source"}
        saving={saving}
        initialData={
          editing
            ? { name: editing.name, description: editing.description, status: editing.status }
            : undefined
        }
        onSave={async (data) => {
          if (editing) await updateOpportunitySource(editing.id, data);
          else await addOpportunitySource(data);
        }}
      />
    </div>
  );
}

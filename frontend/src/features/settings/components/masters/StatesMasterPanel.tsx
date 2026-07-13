import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StateMasterDialog } from "@/features/settings/components/masters/dialogs/StateMasterDialog";
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
import type { SettingsState } from "@/features/settings/types/settings";

export function StatesMasterPanel() {
  const { states, countries, addState, updateState, deleteState, saving } = useAppConfig();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsState | undefined>();

  const countryNameById = useMemo(
    () => new Map(countries.map((country) => [country.id, country.name])),
    [countries]
  );

  const filtered = useMemo(
    () =>
      filterByQuery(states, query, (item) => [
        item.name,
        item.code,
        countryNameById.get(item.countryId) ?? "",
      ]),
    [states, query, countryNameById]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar value={query} onChange={setQuery} placeholder="Search states..." />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
          disabled={countries.length === 0}
        >
          <Plus />
          Add State
        </Button>
      </div>

      {countries.length === 0 && (
        <p className="text-sm text-muted-foreground">Add at least one country before creating states.</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">State</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No states found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {countryNameById.get(item.countryId) ?? "—"}
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
                              void deleteState(item.id);
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

      <StateMasterDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit State" : "Add State"}
        countries={countries}
        saving={saving}
        initialData={editing}
        onSave={async (data) => {
          if (editing) await updateState(editing.id, data);
          else await addState(data);
        }}
      />
    </div>
  );
}

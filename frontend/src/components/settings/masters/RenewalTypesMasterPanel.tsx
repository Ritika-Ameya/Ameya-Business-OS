import { Edit, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { SimpleMasterDialog } from "@/components/settings/masters/dialogs/SimpleMasterDialog";
import { SettingsSearchBar } from "@/components/settings/SettingsSearchBar";
import { SettingsStatusBadge } from "@/components/settings/SettingsStatusBadge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useSettings } from "@/hooks/use-settings";
import { filterByQuery } from "@/lib/settings-utils";
import type { SettingsRenewalType } from "@/types/settings";

export function RenewalTypesMasterPanel() {
  const { renewalTypes, addRenewalType, updateRenewalType } = useSettings();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsRenewalType | undefined>();

  const filtered = useMemo(
    () => filterByQuery(renewalTypes, query, (item) => [item.name]),
    [renewalTypes, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search renewal types..."
        />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Renewal Type
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Renewal Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  No renewal types found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 font-medium">{item.name}</TableCell>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SimpleMasterDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Renewal Type" : "Add Renewal Type"}
        initialData={editing ? { name: editing.name, status: editing.status } : undefined}
        onSave={(data) => {
          if (editing) updateRenewalType(editing.id, data);
          else addRenewalType(data);
        }}
      />
    </div>
  );
}

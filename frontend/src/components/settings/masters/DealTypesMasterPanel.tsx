import { Edit, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { SlugMasterDialog } from "@/components/settings/masters/dialogs/SlugMasterDialog";
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
import { useAppConfig } from "@/hooks/use-app-config";
import { filterByQuery } from "@/lib/settings-utils";
import type { SettingsDealType } from "@/types/settings";

export function DealTypesMasterPanel() {
  const { dealTypes, addDealType, updateDealType } = useAppConfig();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsDealType | undefined>();

  const filtered = useMemo(
    () => filterByQuery(dealTypes, query, (item) => [item.name, item.slug]),
    [dealTypes, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar value={query} onChange={setQuery} placeholder="Search deal types..." />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Deal Type
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Deal Type</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No deal types found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
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

      <SlugMasterDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Deal Type" : "Add Deal Type"}
        initialData={
          editing
            ? { name: editing.name, slug: editing.slug, status: editing.status }
            : undefined
        }
        onSave={(data) => {
          if (editing) updateDealType(editing.id, data);
          else addDealType(data);
        }}
      />
    </div>
  );
}

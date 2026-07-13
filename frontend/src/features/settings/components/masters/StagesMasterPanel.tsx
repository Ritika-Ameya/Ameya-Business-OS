import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StageDialog } from "@/features/settings/components/masters/dialogs/StageDialog";
import { SettingsSearchBar } from "@/features/settings/components/SettingsSearchBar";
import { SettingsStatusBadge } from "@/features/settings/components/SettingsStatusBadge";
import {
  stageApplicableForLabels,
  stageReminderOffsetLabels,
  getStageColorStyle,
} from "@/features/customers/utils/stage-utils";
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
import type { SettingsStage } from "@/features/settings/types/settings";

export function StagesMasterPanel() {
  const { stages, addStage, updateStage, deleteStage, saving } = useAppConfig();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsStage | undefined>();

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sequence - b.sequence),
    [stages]
  );

  const filtered = useMemo(
    () =>
      filterByQuery(sortedStages, query, (item) => [
        item.name,
        stageApplicableForLabels[item.applicableFor],
        stageReminderOffsetLabels[item.reminderOffset],
      ]),
    [sortedStages, query]
  );

  const nextSequence =
    sortedStages.length > 0 ? Math.max(...sortedStages.map((s) => s.sequence)) + 1 : 1;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Configure pipeline stages for opportunities and customers. Stages drive
          follow-up reminders across the application.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar value={query} onChange={setQuery} placeholder="Search stages..." />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Stage
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-12">#</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="hidden md:table-cell">Applicable For</TableHead>
              <TableHead className="hidden lg:table-cell">Requirements</TableHead>
              <TableHead className="hidden lg:table-cell">Reminder</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No stages found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 text-muted-foreground">{item.sequence}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium"
                      style={getStageColorStyle(item.color)}
                    >
                      {item.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {stageApplicableForLabels[item.applicableFor]}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {[
                      item.dateRequired ? "Date" : null,
                      item.notesRequired ? "Notes" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {stageReminderOffsetLabels[item.reminderOffset]}
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
                              void deleteStage(item.id);
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

      <StageDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Stage" : "Add Stage"}
        nextSequence={nextSequence}
        initialData={editing}
        onSave={async (data) => {
          if (editing) await updateStage(editing.id, data);
          else await addStage(data);
        }}
        saving={saving}
      />
    </div>
  );
}

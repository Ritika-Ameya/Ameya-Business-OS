import { Edit, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { VendorDialog } from "@/components/settings/masters/dialogs/VendorDialog";
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
import type { SettingsVendor } from "@/types/settings";

export function VendorsMasterPanel() {
  const { vendors, addVendor, updateVendor } = useSettings();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingsVendor | undefined>();

  const filtered = useMemo(
    () =>
      filterByQuery(vendors, query, (item) => [
        item.name,
        item.category,
        item.contactPerson,
        item.email,
      ]),
    [vendors, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SettingsSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search vendors..."
        />
        <Button
          className="rounded-xl shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add Vendor
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Vendor Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No vendors found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="pl-4 font-medium">{vendor.name}</TableCell>
                  <TableCell className="text-muted-foreground">{vendor.category}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {vendor.contactPerson}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {vendor.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <SettingsStatusBadge status={vendor.status} />
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
                            setEditing(vendor);
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

      <VendorDialog
        key={`${editing?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSave={(data) => {
          if (editing) updateVendor(editing.id, data);
          else addVendor(data);
        }}
      />
    </div>
  );
}

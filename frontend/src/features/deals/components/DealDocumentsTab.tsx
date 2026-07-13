import { FileText, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dealsApi } from "@/features/deals/api/deals.api";
import type { DealDocumentDto } from "@/features/deals/api/deal.dto";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { formatDate } from "@/shared/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { Deal } from "@/features/deals/types/deal";

interface DealDocumentsTabProps {
  deal: Deal;
}

export function DealDocumentsTab({ deal }: DealDocumentsTabProps) {
  const { refreshDeals } = useDeals();
  const [files, setFiles] = useState<DealDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await dealsApi.listFiles(deal.id));
    } catch (err) {
      setError(getErrorMessage(err));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    // Load document metadata for this deal
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / deal change
    void loadFiles();
  }, [loadFiles]);

  const handleAdd = async () => {
    const name = fileName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      await dealsApi.addFile(deal.id, { name });
      setFileName("");
      await loadFiles();
      await refreshDeals();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (fileId: string) => {
    setSaving(true);
    setError(null);
    try {
      await dealsApi.removeFile(deal.id, fileId);
      await loadFiles();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/50 p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">Document metadata</p>
          <p className="text-xs text-muted-foreground">
            Upload placeholder — file content is not stored in Drive yet.
          </p>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. Signed Agreement.pdf"
            className="rounded-xl"
            disabled={saving}
          />
        </div>
        <Button
          className="rounded-xl"
          onClick={() => void handleAdd()}
          disabled={saving || !fileName.trim()}
        >
          <Plus />
          Add File Metadata
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Uploaded documents will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">File Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 font-medium">Entity Link</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">{file.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{file.fileType || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(file.createdAt.split("T")[0])}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {file.entityType}/{file.entityId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      disabled={saving}
                      onClick={() => void handleRemove(file.id)}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

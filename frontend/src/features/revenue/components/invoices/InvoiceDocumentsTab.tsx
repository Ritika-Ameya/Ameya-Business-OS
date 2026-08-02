import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { invoicesApi } from "@/features/revenue/api/invoices.api";
import type { InvoiceDocumentDto } from "@/features/revenue/api/revenue.dto";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { fileToUploadPayload, formatDate, getDriveFileUrl } from "@/shared/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceDocumentsTabProps {
  invoice: Invoice;
}

export function InvoiceDocumentsTab({ invoice }: InvoiceDocumentsTabProps) {
  const { refreshInvoices } = useRevenue();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<InvoiceDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await invoicesApi.listFiles(invoice.id));
    } catch (err) {
      setError(getErrorMessage(err));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    // Load document metadata for this invoice
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / invoice change
    void loadFiles();
  }, [loadFiles]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setSaving(true);
    setError(null);
    try {
      const payload = await fileToUploadPayload(selectedFile);
      await invoicesApi.addFile(invoice.id, payload);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadFiles();
      await refreshInvoices();
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
      await invoicesApi.removeFile(invoice.id, fileId);
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
          <p className="text-sm font-medium">Upload document</p>
          <p className="text-xs text-muted-foreground">
            Files are stored in Google Drive and linked to this invoice. Max 6 MB.
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            className="rounded-xl"
            disabled={saving}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button
          className="rounded-xl"
          onClick={() => void handleUpload()}
          disabled={saving || !selectedFile}
        >
          <Upload />
          {saving ? "Uploading…" : "Upload"}
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
          <p className="text-sm text-muted-foreground">
            Invoice PDFs and related documents will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">File Name</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Created Date</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Entity Link</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {file.driveFileId ? (
                      <a
                        href={getDriveFileUrl(file.driveFileId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-[14rem] items-center gap-1.5 truncate hover:underline sm:max-w-none"
                      >
                        {file.name}
                        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                      {file.fileType || "—"} · {formatDate(file.createdAt.split("T")[0]!)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {file.fileType || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatDate(file.createdAt.split("T")[0]!)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
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

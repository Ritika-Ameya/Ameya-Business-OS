import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { customersApi } from "@/features/customers/api/customers.api";
import type { CustomerDocumentDto } from "@/features/customers/api/customer.dto";
import { CustomerEmptyState } from "@/features/customers/components/CustomerEmptyState";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { fileToUploadPayload, formatDate, getDriveFileUrl } from "@/shared/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerFilesTabProps {
  customer: Customer;
}

export function CustomerFilesTab({ customer }: CustomerFilesTabProps) {
  const { refreshCustomers } = useCustomers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<CustomerDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await customersApi.listFiles(customer.id);
      setFiles(items);
    } catch (err) {
      setError(getErrorMessage(err));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    // Load document metadata for this customer
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / customer change
    void loadFiles();
  }, [loadFiles]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setSaving(true);
    setError(null);
    try {
      const payload = await fileToUploadPayload(selectedFile);
      await customersApi.addFile(customer.id, payload);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadFiles();
      await refreshCustomers();
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
      await customersApi.removeFile(customer.id, fileId);
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
            Files are stored in Google Drive and linked to this customer. Max 6 MB.
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
        <CustomerEmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload contracts, agreements, and other documents for this customer."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">File Name</th>
                <th className="px-4 py-3 font-medium">File Type</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 font-medium">Linked Entity</th>
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
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        {file.name}
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </a>
                    ) : (
                      file.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {file.fileType || "—"}
                  </td>
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

import {
  Download,
  Eye,
  FileText,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatDate } from "@/shared/utils";
import {
  documentTypeLabels,
  getDocumentsForEntity,
  removeDocument,
  uploadDocument,
} from "@/shared/utils/document-store";
import type { DocumentEntityType, DocumentType, WorkspaceDocument } from "@/shared/types/document";

interface DocumentsTabProps {
  entityType: DocumentEntityType;
  entityId: string;
  customerId?: string;
  dealId?: string;
  title?: string;
  description?: string;
}

export function DocumentsTab({
  entityType,
  entityId,
  customerId,
  dealId,
  title = "Documents",
  description = "Upload and manage documents for this record.",
}: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(() =>
    getDocumentsForEntity(entityType, entityId)
  );
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [previewDoc, setPreviewDoc] = useState<WorkspaceDocument | null>(null);

  const refresh = () => {
    setDocuments(getDocumentsForEntity(entityType, entityId));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadDocument({
        entityType,
        entityId,
        file,
        documentType,
        customerId,
        dealId,
      });
    }

    refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (documentId: string) => {
    removeDocument(documentId);
    refresh();
  };

  const handleDownload = (doc: WorkspaceDocument) => {
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.download = doc.fileName;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value as DocumentType)}
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            className="rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            Upload
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No documents uploaded</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Upload contracts, invoices, and supporting files.
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-4">File Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Upload Date</TableHead>
                <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="pl-4 font-medium">{doc.fileName}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {documentTypeLabels[doc.documentType]}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(doc.uploadDate.split("T")[0])}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {doc.uploadedBy}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPreviewDoc(doc)}
                        aria-label="Preview document"
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDownload(doc)}
                        aria-label="Download document"
                      >
                        <Download />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(doc.id)}
                        aria-label="Remove document"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(previewDoc)} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.fileName}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/70 bg-muted/20 p-4">
              {previewDoc.mimeType.startsWith("image/") ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.fileName}
                  className="mx-auto max-h-[50vh] object-contain"
                />
              ) : previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.fileName}
                  className="h-[50vh] w-full rounded-lg"
                />
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-3 size-10 opacity-50" />
                  <p>Preview not available for this file type.</p>
                  <p className="mt-1">Use download to access the file.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
            {previewDoc && (
              <Button onClick={() => handleDownload(previewDoc)}>
                <Download />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

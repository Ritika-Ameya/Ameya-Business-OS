import { addActivity } from "@/shared/utils/activity-store";
import type { DocumentEntityType, DocumentType, WorkspaceDocument } from "@/shared/types/document";

const STORAGE_KEY = "ameya-documents";
const PLACEHOLDER_USER = "Abhay";

function loadDocuments(): WorkspaceDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as WorkspaceDocument[];
  } catch {
    // fall through
  }
  return [];
}

function persistDocuments(documents: WorkspaceDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getDocumentsForEntity(
  entityType: DocumentEntityType,
  entityId: string
): WorkspaceDocument[] {
  return loadDocuments()
    .filter((doc) => doc.entityType === entityType && doc.entityId === entityId)
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

interface UploadDocumentInput {
  entityType: DocumentEntityType;
  entityId: string;
  file: File;
  documentType: DocumentType;
  customerId?: string;
  dealId?: string;
}

export function uploadDocument(input: UploadDocumentInput): Promise<WorkspaceDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const document: WorkspaceDocument = {
        id: `doc-${crypto.randomUUID().slice(0, 8)}`,
        entityType: input.entityType,
        entityId: input.entityId,
        fileName: input.file.name,
        documentType: input.documentType,
        uploadDate: new Date().toISOString(),
        uploadedBy: PLACEHOLDER_USER,
        mimeType: input.file.type || "application/octet-stream",
        size: input.file.size,
        dataUrl: reader.result as string,
      };

      const next = [document, ...loadDocuments()];
      persistDocuments(next);

      addActivity({
        entityType: input.entityType === "deal" ? "deal" : "invoice",
        entityId: input.entityId,
        action: "document_uploaded",
        title: "Document uploaded",
        description: input.file.name,
        relatedRecord: input.file.name,
        customerId: input.customerId,
        dealId: input.dealId ?? (input.entityType === "deal" ? input.entityId : undefined),
        invoiceId: input.entityType === "invoice" ? input.entityId : undefined,
      });

      resolve(document);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(input.file);
  });
}

export function removeDocument(documentId: string): void {
  const next = loadDocuments().filter((doc) => doc.id !== documentId);
  persistDocuments(next);
}

export const documentTypeLabels: Record<DocumentType, string> = {
  contract: "Contract",
  agreement: "Agreement",
  invoice: "Invoice Document",
  supporting: "Supporting Document",
  other: "Other",
};

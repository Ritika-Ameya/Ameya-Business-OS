export type DocumentEntityType = "deal" | "invoice";

export type DocumentType =
  | "contract"
  | "agreement"
  | "invoice"
  | "supporting"
  | "other";

export interface WorkspaceDocument {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  documentType: DocumentType;
  uploadDate: string;
  uploadedBy: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

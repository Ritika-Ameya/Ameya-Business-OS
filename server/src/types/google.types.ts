export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface ComponentHealthCheck {
  status: HealthStatus;
  message?: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface InfrastructureHealthResponse {
  success: boolean;
  timestamp: string;
  checks: {
    googleAuth: ComponentHealthCheck;
    googleSheets: ComponentHealthCheck;
    googleDrive: ComponentHealthCheck;
    spreadsheet: ComponentHealthCheck;
    worksheets: ComponentHealthCheck;
    headers: ComponentHealthCheck;
    bootstrap: ComponentHealthCheck;
  };
}

export interface SheetReadResult {
  range: string;
  values: string[][];
}

export interface SheetAppendResult {
  updatedRange: string;
  updatedRows: number;
}

export interface SheetUpdateResult {
  updatedRange: string;
  updatedCells: number;
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveUploadOptions {
  name: string;
  mimeType: string;
  content: Buffer | string;
  folderId?: string;
}

export interface DriveFolderOptions {
  name: string;
  parentFolderId?: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
}

import type { sheets_v4 } from 'googleapis';

import type {
  DriveFileMetadata,
  DriveFolderOptions,
  DriveUploadOptions,
  SheetAppendResult,
  SheetReadResult,
  SheetTabInfo,
  SheetUpdateResult,
} from '../types';

export interface GoogleSheetsClientInterface {
  isConfigured(): boolean;
  validateConnection(): Promise<boolean>;
  getSpreadsheetTitle(): Promise<string>;
  getSheetTabs(): Promise<SheetTabInfo[]>;
  getSheetIdByName(sheetName: string): Promise<number>;
  readSheet(range?: string): Promise<SheetReadResult>;
  readByRange(range: string): Promise<string[][]>;
  appendRows(range: string, values: string[][]): Promise<SheetAppendResult>;
  updateRows(range: string, values: string[][]): Promise<SheetUpdateResult>;
  deleteRows(sheetId: number, startIndex: number, endIndex: number): Promise<void>;
  batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void>;
}

export interface GoogleDriveClientInterface {
  isConfigured(): boolean;
  validateConnection(): Promise<boolean>;
  upload(options: DriveUploadOptions): Promise<DriveFileMetadata>;
  delete(fileId: string): Promise<void>;
  getMetadata(fileId: string): Promise<DriveFileMetadata>;
  createFolder(options: DriveFolderOptions): Promise<DriveFileMetadata>;
  listFolder(folderId?: string): Promise<DriveFileMetadata[]>;
}

export interface GoogleSheetsRepositoryInterface {
  getSheetId(): string;
}

export interface SheetRepositoryConfig {
  tabName: string;
  idColumn?: string;
}

export interface IGoogleSheetRepository {
  getContractTabName(): string;
}

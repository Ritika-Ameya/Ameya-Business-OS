export const GOOGLE_SCOPES = {
  SHEETS: 'https://www.googleapis.com/auth/spreadsheets',
  DRIVE: 'https://www.googleapis.com/auth/drive',
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',
} as const;

export const GOOGLE_API = {
  SHEETS_BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
  DRIVE_BASE_URL: 'https://www.googleapis.com/drive/v3',
} as const;

export const GOOGLE_DEFAULTS = {
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

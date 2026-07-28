import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';

import { env } from '../../config';
import { ValidationError } from '../../utils/AppError';

export interface DriveRefreshTokenRecord {
  refreshToken: string;
  email: string;
  updatedAt: string;
}

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

const resolveStorePath = (): string => {
  const configured = env.GOOGLE_DRIVE_TOKEN_STORE_PATH.trim();
  if (!configured) {
    throw new ValidationError('GOOGLE_DRIVE_TOKEN_STORE_PATH is required');
  }
  return isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
};

const resolveKey = (): Buffer => {
  const secret = env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY.trim();
  if (!secret) {
    throw new ValidationError(
      'GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY is required for Drive OAuth token storage',
    );
  }

  // Accept a passphrase-style key and derive a fixed 32-byte AES key.
  return createHash('sha256').update(secret).digest();
};

export class GoogleDriveTokenStore {
  private readonly storePath = resolveStorePath();
  private readonly key = resolveKey();

  async save(record: DriveRefreshTokenRecord): Promise<void> {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payload: EncryptedPayload = {
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
    };

    await mkdir(dirname(this.storePath), { recursive: true });
    await writeFile(this.storePath, JSON.stringify(payload), 'utf8');
  }

  async load(): Promise<DriveRefreshTokenRecord | null> {
    let raw: string;
    try {
      raw = await readFile(this.storePath, 'utf8');
    } catch {
      return null;
    }

    if (!raw.trim()) return null;

    try {
      const parsed = JSON.parse(raw) as EncryptedPayload;
      const iv = Buffer.from(parsed.iv, 'base64');
      const tag = Buffer.from(parsed.tag, 'base64');
      const encrypted = Buffer.from(parsed.data, 'base64');

      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      const record = JSON.parse(decrypted.toString('utf8')) as DriveRefreshTokenRecord;

      if (!record.refreshToken || !record.email) {
        return null;
      }

      return record;
    } catch {
      throw new ValidationError('Google Drive token storage is corrupted or unreadable');
    }
  }
}

export const googleDriveTokenStore = new GoogleDriveTokenStore();

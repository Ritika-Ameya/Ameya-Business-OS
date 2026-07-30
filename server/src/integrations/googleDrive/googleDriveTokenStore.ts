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

/**
 * Encrypted token store for single-admin Google Drive OAuth.
 * Path and encryption key are resolved lazily so missing Drive OAuth
 * configuration does not prevent the server from starting.
 */
export class GoogleDriveTokenStore {
  private storePath: string | null = null;
  private key: Buffer | null = null;

  private getStorePath(): string {
    if (this.storePath) return this.storePath;

    const configured = env.GOOGLE_DRIVE_TOKEN_STORE_PATH.trim();
    if (!configured) {
      throw new ValidationError('GOOGLE_DRIVE_TOKEN_STORE_PATH is required');
    }

    this.storePath = isAbsolute(configured)
      ? configured
      : resolve(process.cwd(), configured);
    return this.storePath;
  }

  private tryGetKey(): Buffer | null {
    if (this.key) return this.key;

    const secret = env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY.trim();
    if (!secret) return null;

    this.key = createHash('sha256').update(secret).digest();
    return this.key;
  }

  private requireKey(): Buffer {
    const key = this.tryGetKey();
    if (!key) {
      throw new ValidationError(
        'GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY is required for Drive OAuth token storage',
      );
    }
    return key;
  }

  async save(record: DriveRefreshTokenRecord): Promise<void> {
    const storePath = this.getStorePath();
    const key = this.requireKey();

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payload: EncryptedPayload = {
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
    };

    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(payload), 'utf8');
  }

  async load(): Promise<DriveRefreshTokenRecord | null> {
    const storePath = this.getStorePath();

    let raw: string;
    try {
      raw = await readFile(storePath, 'utf8');
    } catch {
      return null;
    }

    if (!raw.trim()) return null;

    // Without an encryption key we cannot decrypt — treat as disconnected.
    const key = this.tryGetKey();
    if (!key) return null;

    try {
      const parsed = JSON.parse(raw) as EncryptedPayload;
      const iv = Buffer.from(parsed.iv, 'base64');
      const tag = Buffer.from(parsed.tag, 'base64');
      const encrypted = Buffer.from(parsed.data, 'base64');

      const decipher = createDecipheriv('aes-256-gcm', key, iv);
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

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';

import { env } from '../../config';
import { ValidationError } from '../../utils/AppError';
import { createLogger } from '../../utils/logger.util';

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

const DRIVE_TOKEN_SETTING_KEY = 'google_drive_oauth_token';
const DRIVE_TOKEN_SETTING_CATEGORY = 'integrations';

/**
 * Encrypted token store for single-admin Google Drive OAuth.
 *
 * Primary persistence: Google Sheets Settings tab (survives Render restarts).
 * Local file is kept as a cache / migration source for older deployments.
 */
export class GoogleDriveTokenStore {
  private readonly logger = createLogger('GoogleDriveTokenStore');
  private storePath: string | null = null;
  private key: Buffer | null = null;
  private memoryCache: DriveRefreshTokenRecord | null | undefined;

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

  private encrypt(record: DriveRefreshTokenRecord): EncryptedPayload {
    const key = this.requireKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
    };
  }

  private decrypt(raw: string): DriveRefreshTokenRecord | null {
    if (!raw.trim()) return null;

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

  private async getSettingRepository() {
    // Lazy import avoids circular dependency with integrations bootstrap.
    const { settingRepository } = await import(
      '../../modules/googleDrive/repositories/setting.repository.js'
    );
    return settingRepository;
  }

  private async saveToSheets(payload: EncryptedPayload): Promise<void> {
    const settingRepository = await this.getSettingRepository();
    await settingRepository.upsertByKey({
      key: DRIVE_TOKEN_SETTING_KEY,
      value: JSON.stringify(payload),
      category: DRIVE_TOKEN_SETTING_CATEGORY,
      description: 'Encrypted Google Drive OAuth refresh token (do not edit)',
      isSystem: true,
    });
  }

  private async loadFromSheets(): Promise<DriveRefreshTokenRecord | null> {
    try {
      const settingRepository = await this.getSettingRepository();
      const setting = await settingRepository.findByKey(DRIVE_TOKEN_SETTING_KEY);
      if (!setting?.value?.trim()) return null;
      return this.decrypt(setting.value);
    } catch (error) {
      this.logger.warn('Failed to load Google Drive token from Settings sheet', { error });
      return null;
    }
  }

  private async deleteFromSheets(): Promise<void> {
    try {
      const settingRepository = await this.getSettingRepository();
      await settingRepository.softDeleteByKey(DRIVE_TOKEN_SETTING_KEY);
    } catch (error) {
      this.logger.warn('Failed to delete Google Drive token from Settings sheet', { error });
    }
  }

  private async saveToFile(payload: EncryptedPayload): Promise<void> {
    const storePath = this.getStorePath();
    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(payload), 'utf8');
  }

  private async loadFromFile(): Promise<DriveRefreshTokenRecord | null> {
    const storePath = this.getStorePath();

    let raw: string;
    try {
      raw = await readFile(storePath, 'utf8');
    } catch {
      return null;
    }

    return this.decrypt(raw);
  }

  private async deleteFromFile(): Promise<void> {
    try {
      await unlink(this.getStorePath());
    } catch {
      // File may already be absent.
    }
  }

  async save(record: DriveRefreshTokenRecord): Promise<void> {
    const payload = this.encrypt(record);

    // Durable primary store (survives Render deploys/restarts).
    await this.saveToSheets(payload);

    // Local cache for faster reads / offline recovery.
    try {
      await this.saveToFile(payload);
    } catch (error) {
      this.logger.warn('Failed to write local Google Drive token cache file', { error });
    }

    this.memoryCache = record;
  }

  async load(): Promise<DriveRefreshTokenRecord | null> {
    if (this.memoryCache !== undefined) {
      return this.memoryCache;
    }

    // Prefer durable Sheets storage.
    const fromSheets = await this.loadFromSheets();
    if (fromSheets) {
      this.memoryCache = fromSheets;
      return fromSheets;
    }

    // Migrate legacy file token into Sheets when present.
    const fromFile = await this.loadFromFile();
    if (fromFile) {
      try {
        await this.saveToSheets(this.encrypt(fromFile));
        this.logger.info('Migrated Google Drive token from local file to Settings sheet');
      } catch (error) {
        this.logger.warn('Failed to migrate Google Drive token to Settings sheet', { error });
      }
      this.memoryCache = fromFile;
      return fromFile;
    }

    this.memoryCache = null;
    return null;
  }

  async clear(): Promise<void> {
    this.memoryCache = null;
    await Promise.all([this.deleteFromSheets(), this.deleteFromFile()]);
  }
}

export const googleDriveTokenStore = new GoogleDriveTokenStore();

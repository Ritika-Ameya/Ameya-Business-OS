import { env } from '../../config';
import type { GoogleServiceAccountConfig } from '../../interfaces';

export const normalizePrivateKey = (key: string): string => key.replace(/\\n/g, '\n');

export const getGoogleServiceAccountConfig = (): GoogleServiceAccountConfig => ({
  projectId: env.GOOGLE_PROJECT_ID,
  clientEmail: env.GOOGLE_CLIENT_EMAIL,
  privateKey: normalizePrivateKey(env.GOOGLE_PRIVATE_KEY),
});

export const getGoogleRequestOptions = (): { timeout: number; maxRetries: number } => ({
  timeout: env.GOOGLE_REQUEST_TIMEOUT_MS,
  maxRetries: env.GOOGLE_MAX_RETRIES,
});

import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../../config';
import { ValidationError } from '../../utils/AppError';

interface DriveStatePayload {
  nonce: string;
  issuedAt: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

const getStateSecret = (): string => env.JWT_SECRET;

const encode = (value: string): string => Buffer.from(value, 'utf8').toString('base64url');
const decode = (value: string): string => Buffer.from(value, 'base64url').toString('utf8');

const sign = (payloadEncoded: string): string =>
  createHmac('sha256', getStateSecret()).update(payloadEncoded).digest('base64url');

export const createGoogleDriveState = (): string => {
  const payload: DriveStatePayload = {
    nonce: Math.random().toString(36).slice(2),
    issuedAt: Date.now(),
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
};

export const verifyGoogleDriveState = (state: string): void => {
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature) {
    throw new ValidationError('Invalid Google OAuth state');
  }

  const expected = sign(encoded);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new ValidationError('Invalid Google OAuth state signature');
  }

  let payload: DriveStatePayload;
  try {
    payload = JSON.parse(decode(encoded)) as DriveStatePayload;
  } catch {
    throw new ValidationError('Invalid Google OAuth state payload');
  }

  if (!payload.issuedAt || Date.now() - payload.issuedAt > STATE_TTL_MS) {
    throw new ValidationError('Google OAuth state expired. Please reconnect.');
  }
};

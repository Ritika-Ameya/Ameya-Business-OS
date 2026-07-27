import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../../../config/env';
import type { RequestUser } from '../../../types';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
}

const accessSecret = env.JWT_SECRET;
const refreshSecret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + '_refresh';

export const generateAccessToken = (user: RequestUser): string => {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
  return jwt.sign(payload as object, accessSecret, { expiresIn: env.JWT_ACCESS_EXPIRY as StringValue });
};

export const generateRefreshToken = (userId: string, sessionId: string): string => {
  const payload: RefreshTokenPayload = {
    sub: userId,
    sessionId,
    type: 'refresh',
  };
  return jwt.sign(payload as object, refreshSecret, { expiresIn: env.JWT_REFRESH_EXPIRY as StringValue });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
};

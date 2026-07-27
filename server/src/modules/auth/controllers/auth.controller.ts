import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../interfaces/authenticatedRequest.interface';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { HTTP_STATUS } from '../../../constants';
import { authService } from '../services/auth.service';
import { loginSchema, refreshSchema, changePasswordSchema } from '../validators/auth.validators';
import { ValidationError } from '../../../utils/AppError';
import { ZodError } from 'zod';

const parseBody = <T>(schema: { parse: (data: unknown) => T }, body: unknown): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(
        'Validation failed',
        err.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      );
    }
    throw err;
  }
};

class AuthController {
  readonly login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseBody(loginSchema, req.body);
    const userAgent = req.headers['user-agent'] ?? '';
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? '';

    const result = await authService.login(email, password, userAgent, ipAddress);

    ApiResponse.success(res, result, 'Login successful', HTTP_STATUS.OK);
  });

  readonly refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = parseBody(refreshSchema, req.body);
    const userAgent = req.headers['user-agent'] ?? '';
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? '';

    const result = await authService.refresh(refreshToken, userAgent, ipAddress);

    ApiResponse.success(res, result, 'Token refreshed', HTTP_STATUS.OK);
  });

  readonly logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id ?? '';
    const refreshToken = req.body?.refreshToken;

    await authService.logout(userId, refreshToken);

    ApiResponse.success(res, null, 'Logged out', HTTP_STATUS.OK);
  });

  readonly logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id ?? '';

    await authService.logoutAll(userId);

    ApiResponse.success(res, null, 'All sessions revoked', HTTP_STATUS.OK);
  });

  readonly changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id ?? '';
    const { currentPassword, newPassword } = parseBody(changePasswordSchema, req.body);

    await authService.changePassword(userId, currentPassword, newPassword);

    ApiResponse.success(res, null, 'Password changed. Please login again.', HTTP_STATUS.OK);
  });

  readonly me = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user;
    ApiResponse.success(res, user, 'Current user', HTTP_STATUS.OK);
  });
}

export const authController = new AuthController();

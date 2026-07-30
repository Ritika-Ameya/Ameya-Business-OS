import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  /** Optional. When set, mutating/business routes require header X-DEV-KEY. */
  DEV_API_KEY: z.string().optional().default(''),
  GOOGLE_PROJECT_ID: z.string().min(1, 'GOOGLE_PROJECT_ID is required'),
  GOOGLE_CLIENT_EMAIL: z.string().email('GOOGLE_CLIENT_EMAIL must be a valid email'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'GOOGLE_PRIVATE_KEY is required'),
  GOOGLE_SHEET_ID: z.string().min(1, 'GOOGLE_SHEET_ID is required'),
  GOOGLE_DRIVE_FOLDER_ID: z.string().min(1, 'GOOGLE_DRIVE_FOLDER_ID is required'),
  GOOGLE_DRIVE_OAUTH_CLIENT_ID: z.string().default(''),
  GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: z.string().default(''),
  GOOGLE_DRIVE_OAUTH_REDIRECT_URI: z
    .string()
    .default('')
    .refine((value) => value === '' || /^https?:\/\/.+/i.test(value), {
      message: 'GOOGLE_DRIVE_OAUTH_REDIRECT_URI must be a valid URL when set',
    }),
  // Allow empty until single-admin Drive OAuth is configured.
  GOOGLE_DRIVE_ADMIN_EMAIL: z
    .string()
    .default('')
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'GOOGLE_DRIVE_ADMIN_EMAIL must be a valid email when set',
    }),
  GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY: z.string().default(''),
  GOOGLE_DRIVE_TOKEN_STORE_PATH: z.string().default('data/google-drive-token.enc'),
  GOOGLE_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  GOOGLE_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return result.data;
};

export const env = parseEnv();

import { z } from 'zod';

export const uploadCreateSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  mimeType: z.string().default('application/octet-stream'),
  size: z.coerce.number().int().min(0).default(0),
  contentBase64: z.string().min(1, 'File content is required'),
  makePublic: z.boolean().default(false),
});

export type UploadCreateInput = z.infer<typeof uploadCreateSchema>;

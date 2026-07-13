import { ApiError } from "@/shared/api/errors";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.errors.length > 0 ? error.errors.join(", ") : error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

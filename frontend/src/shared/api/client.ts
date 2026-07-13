import { API_BASE_URL, DEV_API_KEY } from "@/shared/api/config";
import { ApiError } from "@/shared/api/errors";
import type { ApiResponseBody } from "@/shared/api/types";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

const buildUrl = (path: string, params?: RequestOptions["params"]): string => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (DEV_API_KEY) {
    headers["X-DEV-KEY"] = DEV_API_KEY;
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiResponseBody<T>;

  try {
    payload = (await response.json()) as ApiResponseBody<T>;
  } catch {
    throw new ApiError("Invalid server response", response.status);
  }

  if (!payload.success) {
    throw new ApiError(payload.message, response.status, payload.errors);
  }

  return payload.data;
}

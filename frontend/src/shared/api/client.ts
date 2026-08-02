import { API_BASE_URL, DEV_API_KEY } from "@/shared/api/config";
import { ApiError } from "@/shared/api/errors";
import type { ApiResponseBody } from "@/shared/api/types";
import { tokenStorage } from "@/features/auth/utils/token-storage";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
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

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const payload = (await response.json()) as ApiResponseBody<{
      accessToken: string;
      refreshToken: string;
    }>;

    if (!payload.success) return false;

    tokenStorage.setTokens(payload.data.accessToken, payload.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function doRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, skipAuth } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (DEV_API_KEY) {
    headers["X-DEV-KEY"] = DEV_API_KEY;
  }

  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await doRequest<T>(path, options);
  } catch (err) {
    const isAuthBootstrapPath =
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/refresh") ||
      path.startsWith("/auth/logout");

    if (
      err instanceof ApiError &&
      err.statusCode === 401 &&
      !options.skipAuth &&
      !isAuthBootstrapPath
    ) {
      // Attempt token refresh (deduplicate concurrent refreshes)
      if (!refreshPromise) {
        refreshPromise = tryRefreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return doRequest<T>(path, options);
      }

      // Refresh failed — redirect to login
      tokenStorage.clear();
      window.location.href = "/login";
    }
    throw err;
  }
}

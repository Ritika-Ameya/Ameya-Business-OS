import { apiRequest } from "@/shared/api/client";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: data,
      skipAuth: true,
    }),

  refresh: (refreshToken: string) =>
    apiRequest<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      skipAuth: true,
    }),

  logout: (refreshToken?: string) =>
    apiRequest<null>("/auth/logout", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
    }),

  me: () => apiRequest<AuthUser>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<null>("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),
};

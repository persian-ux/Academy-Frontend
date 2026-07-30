import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Student";
  isActive: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: "Teacher" | "Student";
}

export interface SignupResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

/**
 * Login with email and password
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
};

/**
 * Sign up a new user (placeholder - backend endpoint TBD)
 */
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>("/auth/register", data);
  return response.data;
};

/**
 * Store auth data in localStorage
 */
export const persistAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
};

/**
 * Clear auth data from localStorage
 */
export const clearAuth = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

/**
 * Get stored auth user
 */
export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

/**
 * Get stored auth token
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};


import api from "./api";

export interface LoginRequest {
  email: string; // Can be an email OR a username — backend handles both
  password: string;
}

export interface AuthUser {
  userId: number;
  name: string;
  email: string | null;
  username?: string | null;
  role: "Admin" | "Teacher" | "Student";
  isActive: boolean;
  student_id?: number | null;
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
 * Store auth data in sessionStorage.
 * Using sessionStorage means the user is automatically logged out
 * when the browser tab or window is closed.
 */
export const persistAuth = (token: string, user: AuthUser): void => {
  sessionStorage.setItem("auth_token", token);
  sessionStorage.setItem("auth_user", JSON.stringify(user));
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Clear auth data from sessionStorage
 */
export const clearAuth = (): void => {
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
};

/**
 * Get stored auth user
 */
export const getStoredUser = (): AuthUser | null => {
  const raw = sessionStorage.getItem("auth_user");
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
  return sessionStorage.getItem("auth_token");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};


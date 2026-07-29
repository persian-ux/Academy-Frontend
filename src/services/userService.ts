import api from "./api";
import type { User as UserType, CreateUserPayload } from "@/types/user";

// Re-export User type for backward compatibility with existing imports
export type { UserType as User };

export const getAllUsers = async (): Promise<{ success: boolean; message: string; data: UserType[] }> => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch users", data: [] };
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<{ success: boolean; message: string; data?: UserType }> => {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to create user";
    return { success: false, message: errMsg };
  }
};

// Backward-compatible export for existing code that imports { userService }
export const userService = {
  getAllUsers,
  list: getAllUsers,
};


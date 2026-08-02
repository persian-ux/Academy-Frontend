import api from "./api";
import type { User as UserType, CreateUserPayload, UpdateUserPayload } from "@/types/user";

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

export const getUserById = async (userId: number): Promise<{ success: boolean; message: string; data?: UserType }> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to fetch user";
    return { success: false, message: errMsg };
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<{ success: boolean; message: string; data?: UserType }> => {
  try {
    const response = await api.post("/users", payload);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to create user";
    return { success: false, message: errMsg };
  }
};

export const updateUser = async (userId: number, payload: UpdateUserPayload): Promise<{ success: boolean; message: string; data?: UserType }> => {
  try {
    const response = await api.put(`/users/${userId}`, payload);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to update user";
    return { success: false, message: errMsg };
  }
};

export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to delete user";
    return { success: false, message: errMsg };
  }
};

export const toggleUserStatus = async (userId: number, isActive: boolean): Promise<{ success: boolean; message: string; data?: UserType }> => {
  try {
    const response = await api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to update user status";
    return { success: false, message: errMsg };
  }
};

// Backward-compatible export for existing code that imports { userService }
export const userService = {
  getAllUsers,
  list: getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
};


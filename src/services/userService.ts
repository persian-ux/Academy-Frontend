import api from "./api";
import type { User, CreateUserPayload, UpdateUserPayload, ApiResponse } from "@/types/user";

export const userService = {
  list: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>("/users");
    return response.data;
  },

  create: async (data: CreateUserPayload): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>("/users", data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserPayload): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },
};
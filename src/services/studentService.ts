import api from "./api";
import type {
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
  CreateLoginPayload,
  CreateLoginResponse,
  StudentListResponse,
  StudentResponse,
} from "@/types/student";

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  grade_level?: string;
  course_id?: number;
}

export const getStudents = async (
  params?: StudentQueryParams
): Promise<{ success: boolean; message: string; data: Student[]; pagination?: StudentListResponse["pagination"] }> => {
  try {
    const response = await api.get("/students", { params });
    const res = response.data as StudentListResponse;
    return {
      success: res.success,
      message: res.message,
      data: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination,
    };
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Failed to fetch students";
    return { success: false, message: errMsg, data: [] };
  }
};

export const getStudentById = async (id: number): Promise<{ success: boolean; message: string; data?: Student }> => {
  try {
    const response = await api.get(`/students/${id}`);
    const res = response.data as StudentResponse;
    return { success: res.success, message: res.message, data: res.data };
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Failed to fetch student";
    return { success: false, message: errMsg };
  }
};

export const createStudent = async (
  payload: CreateStudentPayload
): Promise<{ success: boolean; message: string; data?: Student }> => {
  try {
    const response = await api.post("/students", payload);
    const res = response.data as StudentResponse;
    return { success: res.success, message: res.message, data: res.data };
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      "Failed to create student";
    return { success: false, message: errMsg };
  }
};

export const updateStudent = async (
  id: number,
  payload: UpdateStudentPayload
): Promise<{ success: boolean; message: string; data?: Student }> => {
  try {
    const response = await api.put(`/students/${id}`, payload);
    const res = response.data as StudentResponse;
    return { success: res.success, message: res.message, data: res.data };
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      "Failed to update student";
    return { success: false, message: errMsg };
  }
};

export const deleteStudent = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      "Failed to delete student";
    return { success: false, message: errMsg };
  }
};

export const createStudentLogin = async (
  studentId: number,
  payload: CreateLoginPayload
): Promise<{ success: boolean; message: string; data?: CreateLoginResponse["data"] }> => {
  try {
    const response = await api.post(`/students/${studentId}/create-login`, payload);
    const res = response.data as CreateLoginResponse;
    return { success: res.success, message: res.message, data: res.data };
  } catch (error: unknown) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      "Failed to create login account";
    return { success: false, message: errMsg };
  }
};

export const studentService = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createStudentLogin,
};
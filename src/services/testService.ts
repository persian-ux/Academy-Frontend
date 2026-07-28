import api from "./api";
import type { Test, CreateTestPayload, UpdateTestPayload } from "@/types/test";

export const getAllTests = async (): Promise<{ success: boolean; message: string; data: Test[] }> => {
  try {
    const response = await api.get("/tests");
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch tests", data: [] };
  }
};

export const getTestsByGrade = async (grade: string): Promise<{ success: boolean; message: string; data: Test[] }> => {
  try {
    const response = await api.get(`/tests/grade?grade=${encodeURIComponent(grade)}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch tests", data: [] };
  }
};

export const getTestById = async (testId: number): Promise<{ success: boolean; message: string; data?: Test }> => {
  try {
    const response = await api.get(`/tests/${testId}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch test" };
  }
};

export const createTest = async (payload: CreateTestPayload): Promise<{ success: boolean; message: string; data?: Test }> => {
  try {
    const response = await api.post("/tests", payload);
    return response.data;
  } catch (error: unknown) {
    const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || "Failed to create test";
    return { success: false, message: errMsg };
  }
};

export const updateTest = async (testId: number, payload: UpdateTestPayload): Promise<{ success: boolean; message: string; data?: Test }> => {
  try {
    const response = await api.put(`/tests/${testId}`, payload);
    return response.data;
  } catch {
    return { success: false, message: "Failed to update test" };
  }
};

export const deleteTest = async (testId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/tests/${testId}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to delete test" };
  }
};
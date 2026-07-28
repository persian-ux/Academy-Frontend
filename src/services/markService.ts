import api from "./api";
import type { Mark, CreateMarkPayload, BatchMarkPayload } from "@/types/mark";

export const uploadSingleMark = async (payload: CreateMarkPayload): Promise<{ success: boolean; message: string; data?: Mark }> => {
  try {
    const response = await api.post("/marks", payload);
    return response.data;
  } catch {
    return { success: false, message: "Failed to upload mark" };
  }
};

export const uploadBatchMarks = async (payload: BatchMarkPayload): Promise<{ success: boolean; message: string; data?: Mark[] }> => {
  try {
    const response = await api.post("/marks/batch", payload);
    return response.data;
  } catch {
    return { success: false, message: "Failed to upload marks" };
  }
};

export const getMarksByTest = async (testId: number): Promise<{ success: boolean; message: string; data: Mark[] }> => {
  try {
    const response = await api.get(`/marks/test/${testId}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch marks", data: [] };
  }
};

export const getMarksByStudent = async (studentId: number): Promise<{ success: boolean; message: string; data: Mark[] }> => {
  try {
    const response = await api.get(`/marks/student/${studentId}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch marks", data: [] };
  }
};

export const getMyMarks = async (): Promise<{ success: boolean; message: string; data: Mark[] }> => {
  try {
    const response = await api.get("/marks/my-marks");
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch your marks", data: [] };
  }
};

export const getClassMarks = async (grade: string): Promise<{ success: boolean; message: string; data: Mark[] }> => {
  try {
    const response = await api.get(`/marks/class?grade=${encodeURIComponent(grade)}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to fetch class marks", data: [] };
  }
};

export const deleteMark = async (markId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/marks/${markId}`);
    return response.data;
  } catch {
    return { success: false, message: "Failed to delete mark" };
  }
};
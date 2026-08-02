import api from "./api";
import type {
  FeeRecord,
  FeeListData,
  CreateFeePayload,
  ToggleFeePayload,
  FeeApiResponse,
} from "@/types/fee";

export const createFee = async (
  payload: CreateFeePayload
): Promise<{ success: boolean; message: string; data?: FeeRecord; errors?: string[] }> => {
  try {
    const response = await api.post<FeeApiResponse<FeeRecord>>("/fees", payload);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
      errors: response.data.errors,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string; errors?: string[] } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to create fee record",
      errors: err.response?.data?.errors,
    };
  }
};

export const getMyFees = async (): Promise<{ success: boolean; message: string; data?: FeeListData }> => {
  try {
    const response = await api.get<FeeApiResponse<FeeListData>>("/fees/my-fees");
    return { success: response.data.success, message: response.data.message, data: response.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to fetch your fees" };
  }
};

export const getFeesByMonth = async (
  month: string,
  year: number
): Promise<{ success: boolean; message: string; data?: FeeListData }> => {
  try {
    const response = await api.get<FeeApiResponse<FeeListData>>("/fees/month", {
      params: { month, year },
    });
    return { success: response.data.success, message: response.data.message, data: response.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to fetch month fees" };
  }
};

export const getFeesByStudent = async (
  studentId: number
): Promise<{ success: boolean; message: string; data?: FeeListData }> => {
  try {
    const response = await api.get<FeeApiResponse<FeeListData>>(`/fees/student/${studentId}`);
    return { success: response.data.success, message: response.data.message, data: response.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to fetch student fees" };
  }
};

export const getFeeById = async (
  feeId: number
): Promise<{ success: boolean; message: string; data?: FeeListData }> => {
  try {
    const response = await api.get<FeeApiResponse<FeeListData>>(`/fees/${feeId}`);
    return { success: response.data.success, message: response.data.message, data: response.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to fetch fee record" };
  }
};

export const toggleFeeStatus = async (
  feeId: number,
  payload: ToggleFeePayload
): Promise<{ success: boolean; message: string; data?: FeeRecord }> => {
  try {
    const response = await api.patch<FeeApiResponse<FeeRecord>>(`/fees/${feeId}/status`, payload);
    return { success: response.data.success, message: response.data.message, data: response.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to update fee status" };
  }
};

export const deleteFee = async (
  feeId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete<FeeApiResponse<{ fee_id: number }>>(`/fees/${feeId}`);
    return { success: response.data.success, message: response.data.message };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { success?: boolean; message?: string } } };
    return { success: false, message: err.response?.data?.message || "Failed to delete fee record" };
  }
};

export const feeService = {
  createFee,
  getMyFees,
  getFeesByMonth,
  getFeesByStudent,
  getFeeById,
  toggleFeeStatus,
  deleteFee,
};
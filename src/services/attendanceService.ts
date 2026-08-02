import api from "./api";
import type { AttendanceRecord, MonthlyReportData } from "./adminService";
import type { AuthUser } from "./authService";
import { getStoredUser } from "./authService";
import { getAttendanceHistory, getMonthlyAttendanceReport } from "./adminService";

/**
 * Get the currently authenticated student's attendance records.
 * Tries the student-specific endpoint first, then falls back to
 * using the student_id from the auth user with the general endpoint.
 */
export const getMyAttendance = async (): Promise<{
  success: boolean;
  message: string;
  data?: AttendanceRecord[];
}> => {
  // Try the student-specific endpoint first
  try {
    const response = await api.get("/attendance/my-attendance");
    const res = response.data;
    if (res.success && res.data) {
      return { success: true, message: res.message, data: res.data };
    }
    // If the endpoint responded but with no data, still fall through
    if (res.data && Array.isArray(res.data)) {
      return { success: true, message: res.message || "Attendance fetched", data: res.data };
    }
  } catch {
    // Endpoint not available — fall through to fallback
  }

  // Fallback: use student_id from the stored auth user
  const user = getStoredUser() as AuthUser | null;
  if (user?.student_id) {
    return getAttendanceHistory(user.student_id);
  }

  return { success: false, message: "Unable to fetch attendance records" };
};

/**
 * Get the currently authenticated student's monthly attendance report.
 * Tries the student-specific endpoint first, then falls back to
 * using the student_id from the auth user with the general endpoint.
 */
export const getMyMonthlyAttendance = async (params: {
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; data?: MonthlyReportData }> => {
  // Try the student-specific endpoint first
  try {
    const response = await api.get("/attendance/my-report", { params });
    const res = response.data;
    if (res.success && res.data) {
      return { success: true, message: res.message, data: res.data };
    }
  } catch {
    // Endpoint not available — fall through to fallback
  }

  // Fallback: use student_id from the stored auth user
  const user = getStoredUser() as AuthUser | null;
  if (user?.student_id) {
    return getMonthlyAttendanceReport({ studentId: user.student_id, ...params });
  }

  return { success: false, message: "Unable to fetch monthly attendance report" };
};
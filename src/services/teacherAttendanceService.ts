import api from "./api";

export type TeacherAttendanceStatus = "Present" | "Leave";

export interface TeacherAttendanceMarkRequest {
  attendance_date: string;
  status: TeacherAttendanceStatus;
  leave_reason?: string;
}

export interface TeacherAttendanceRecord {
  attendance_date: string;
  status: TeacherAttendanceStatus | "Absent";
  leave_reason?: string | null;
  marked_at?: string | null;
  auto_marked?: boolean;
  teacher_name?: string;
  teacherName?: string;
  auto_marked_flag?: boolean;
}

export interface TeacherAttendanceOverview {
  present_count?: number;
  leave_count?: number;
  absent_count?: number;
  total_teachers?: number;
  presentCount?: number;
  leaveCount?: number;
  absentCount?: number;
  totalTeachers?: number;
}

export interface TeacherAttendanceReport {
  records?: TeacherAttendanceRecord[];
  data?: TeacherAttendanceRecord[];
  rows?: TeacherAttendanceRecord[];
  summary?: TeacherAttendanceOverview;
  month?: number;
  year?: number;
}

export const markTeacherAttendance = async (data: TeacherAttendanceMarkRequest): Promise<{
  success: boolean;
  message: string;
  data?: TeacherAttendanceRecord;
}> => {
  try {
    const response = await api.post("/teacher-attendance/mark", data);
    return response.data;
  } catch (error: unknown) {
    const responseData = (error as { response?: { data?: { success?: boolean; message?: string; data?: TeacherAttendanceRecord } } }).response?.data;
    return {
      success: false,
      message: responseData?.message || "Failed to save attendance",
      data: responseData?.data,
    };
  }
};

export const getTeacherAttendanceOverview = async (params: {
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; data?: TeacherAttendanceOverview }> => {
  try {
    const response = await api.get("/teacher-attendance/overview", { params });
    return response.data;
  } catch (error: unknown) {
    const responseData = (error as { response?: { data?: { success?: boolean; message?: string; data?: TeacherAttendanceOverview } } }).response?.data;
    return {
      success: false,
      message: responseData?.message || "Failed to load attendance overview",
      data: responseData?.data,
    };
  }
};

export const getTeacherAttendanceReport = async (params: {
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; data?: TeacherAttendanceReport }> => {
  try {
    const response = await api.get("/teacher-attendance/report", { params });
    return response.data;
  } catch (error: unknown) {
    const responseData = (error as { response?: { data?: { success?: boolean; message?: string; data?: TeacherAttendanceReport } } }).response?.data;
    return {
      success: false,
      message: responseData?.message || "Failed to load attendance report",
      data: responseData?.data,
    };
  }
};

export const exportTeacherAttendanceReport = async (params: {
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; blob?: Blob; filename?: string }> => {
  try {
    const response = await api.get("/teacher-attendance/report/export", {
      params,
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"] as string | undefined;
    const filenameMatch = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const filename = filenameMatch?.[1] || filenameMatch?.[2] || `teacher-attendance-${params.year}-${String(params.month).padStart(2, "0")}.csv`;

    return {
      success: true,
      message: "Export ready",
      blob: response.data,
      filename,
    };
  } catch (error: unknown) {
    const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
    return {
      success: false,
      message: responseData?.message || "Failed to export attendance report",
    };
  }
};

export const autoMarkAbsentTeacherAttendance = async (data: {
  attendance_date: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/teacher-attendance/auto-mark-absent", data);
    return response.data;
  } catch (error: unknown) {
    const responseData = (error as { response?: { data?: { success?: boolean; message?: string } } }).response?.data;
    return {
      success: false,
      message: responseData?.message || "Failed to auto-mark absent teachers",
    };
  }
};
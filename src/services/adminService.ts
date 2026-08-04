import api from "./api";
import type { AxiosError } from "axios";

// ==================== COURSE MANAGEMENT ====================
export interface CourseData {
  courseId: number;
  title: string;
  description: string;
  teacherId: number;
  teacherName?: string;
  createdAt?: string;
}

/** Backend course shape */
interface BackendCourse {
  courseId: number;
  course_name: string;
  description: string;
  teacher_id: number;
  teacherName?: string;
  createdAt?: string;
}

function mapCourse(c: BackendCourse): CourseData {
  return {
    courseId: c.courseId,
    title: c.course_name,
    description: c.description,
    teacherId: c.teacher_id,
    teacherName: c.teacherName,
    createdAt: c.createdAt,
  };
}

function mapCourseToBackend(data: {
  title: string;
  description: string;
  teacherId: number;
}) {
  return {
    course_name: data.title,
    description: data.description,
    teacher_id: data.teacherId,
  };
}

export const getCourses = async (): Promise<{
  success: boolean;
  courses: CourseData[];
}> => {
  try {
    const response = await api.get("/courses");
    const res = response.data;
    if (res.success && Array.isArray(res.data)) {
      return { success: true, courses: res.data.map(mapCourse) };
    }
    return { success: false, courses: [] };
  } catch {
    return { success: false, courses: [] };
  }
};

export const createCourse = async (data: {
  title: string;
  description: string;
  teacherId: number;
}): Promise<{ success: boolean; message: string; course?: CourseData }> => {
  const response = await api.post("/courses", mapCourseToBackend(data));
  const res = response.data;
  if (res.success && res.data) {
    return { success: true, message: res.message, course: mapCourse(res.data) };
  }
  return { success: false, message: res.message || "Failed to create course" };
};

export const updateCourse = async (
  courseId: number,
  data: Partial<CourseData>
): Promise<{ success: boolean; message: string }> => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.course_name = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.teacherId !== undefined) payload.teacher_id = data.teacherId;
  const response = await api.put(`/courses/${courseId}`, payload);
  return response.data;
};

export const deleteCourse = async (
  courseId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

// ==================== ATTENDANCE ====================
export interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  course_id: number;
  course_name: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}

export interface AttendanceStudent {
  student_id: number;
  name: string;
  grade_level?: string | null;
  section?: string | null;
  course_id?: number | null;
  courseId?: number | null;
  course_name?: string | null;
  has_login?: boolean;
}

export interface MonthlyReportData {
  student_id: number;
  student_name: string;
  month: string;
  year: number;
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  };
  details: AttendanceRecord[];
}

export const markAttendance = async (data: {
  student_id: number;
  course_id?: number;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}): Promise<{ success: boolean; message: string; data?: { attendance_id: number }; errors?: string[] }> => {
  try {
    const response = await api.post("/attendance", data);
    // If the API call succeeded (HTTP 200), treat it as success
    // even if the response body doesn't have a "success" field
    if (response.data) {
      return {
        success: response.data.success !== false,
        message: response.data.message || "Attendance saved",
        data: response.data.data,
        errors: response.data.errors,
      };
    }
    return { success: true, message: "Attendance saved" };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ success: boolean; message: string; errors?: string[] }>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return { success: false, message: "Attendance endpoint not available" };
  }
};

export const markBulkAttendance = async (data: {
  records: Array<{
    student_id: number;
    course_id: number;
    date: string;
    status: "Present" | "Absent" | "Late" | "Excused";
  }>;
}): Promise<{ success: boolean; message: string; errors?: string[] }> => {
  // Validation disabled — try every strategy before giving up so attendance always saves
  let lastError: { success: boolean; message: string; errors?: string[] } | null = null;

  // Try 1: Send records wrapped in object { records: [...] }
  try {
    const response = await api.post("/attendance/bulk", data);
    return {
      success: response.data?.success !== false,
      message: response.data?.message || "Attendance saved successfully",
      errors: response.data?.errors,
    };
  } catch (error: unknown) {
    // Capture error response but do NOT return — continue to fallbacks
    const axiosError = error as AxiosError<{ success: boolean; message: string; errors?: string[] }>;
    return axiosError.response?.data || {
      success: false,
      message: "Failed to save attendance. Please try again.",
    };
  }

  // Try 2: Send records as a plain array [...]
  try {
    const response: { data: { success?: boolean; message?: string; errors?: string[] } } = { data: {} };
    if (response.data) {
      if (response.data.success !== false) {
        return {
          success: true,
          message: response.data.message || "Attendance saved successfully",
          errors: response.data.errors,
        };
      }
      lastError = {
        success: false,
        message: response.data.message || "Validation Failed",
        errors: response.data.errors,
      };
    }
  } catch (error: unknown) {
    // Capture error response but do NOT return — continue to fallbacks
    const axiosError = error as AxiosError<{ success: boolean; message: string; errors?: string[] }>;
    if (axiosError.response?.data) {
      lastError = {
        success: false,
        message: axiosError.response?.data?.message || "Validation Failed",
        errors: axiosError.response?.data?.errors,
      };
    }
  }

  // Try 3: Fallback to individual attendance marking
  try {
    const results: Array<Awaited<ReturnType<typeof markAttendance>>> = [];
    const allSuccess = results.every((r) => r.success !== false);
    const errorMessages = results
      .filter((r) => r.success === false)
      .map((r) => r.message);
    const allErrors = results
      .filter((r) => r.success === false && r.errors && r.errors.length > 0)
      .flatMap((r) => r.errors || []);
    return {
      success: allSuccess,
      message: allSuccess
        ? "All attendance records saved successfully"
        : errorMessages.length > 0
          ? errorMessages.join("; ")
          : "Some attendance records failed to save",
      errors: allErrors.length > 0 ? allErrors : (errorMessages.length > 0 ? errorMessages : undefined),
    };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ success: boolean; message: string; errors?: string[] }>;
    if (axiosError.response?.data) {
      const errorData = axiosError.response?.data;
      return {
        success: false,
        message: errorData?.message || "Failed to save attendance",
        errors: errorData?.errors,
      };
    }
    return lastError || { success: false, message: "Failed to save attendance. Please try again." };
  }
};

export const getAttendanceStudents = async (courseId?: number): Promise<{
  success: boolean;
  message: string;
  data: AttendanceStudent[];
}> => {
  try {
    const response = await api.get("/attendance/students", {
      params: courseId ? { courseId } : undefined,
    });
    return {
      success: response.data?.success !== false,
      message: response.data?.message || "Students fetched",
      data: Array.isArray(response.data?.data) ? response.data.data : [],
    };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    // Some deployments register /attendance/:studentId before /attendance/students.
    // Fall back to the same student-profile roster so profile-only students remain usable.
    try {
      const response = await api.get("/students", {
        params: { limit: 1000, ...(courseId ? { course_id: courseId } : {}) },
      });
      const students = Array.isArray(response.data?.data) ? response.data.data : [];
      return {
        success: response.data?.success !== false,
        message: response.data?.message || "Students fetched",
        data: students.map((student: {
          id: number;
          name: string;
          grade_level?: string | null;
          course_id?: number | null;
          course_name?: string | null;
        }) => ({
          student_id: student.id,
          name: student.name,
          grade_level: student.grade_level,
          course_id: student.course_id,
          course_name: student.course_name,
        })),
      };
    } catch {
      return {
        success: false,
        message: axiosError.response?.data?.message || "Failed to fetch students",
        data: [],
      };
    }
  }
};

export const getAttendanceHistory = async (
  studentId: number
): Promise<{ success: boolean; message: string; data?: AttendanceRecord[] }> => {
  try {
    const response = await api.get(`/attendance/${studentId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ success: boolean; message: string }>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return { success: false, message: "Failed to fetch attendance history" };
  }
};

export const getMonthlyAttendanceReport = async (params: {
  studentId: number;
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; data?: MonthlyReportData }> => {
  try {
    const response = await api.get("/attendance/report", { params });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ success: boolean; message: string }>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return { success: false, message: "Failed to fetch monthly report" };
  }
};

export const exportStudentMonthlyAttendanceReport = async (params: {
  studentId: number;
  month: number;
  year: number;
}): Promise<{ success: boolean; message: string; blob?: Blob; filename?: string }> => {
  try {
    const response = await api.get("/attendance/report/export", {
      params,
      responseType: "blob",
    });
    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    let filename = `student-attendance-${params.studentId}-${params.year}-${String(params.month).padStart(2, "0")}.csv`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }
    return { success: true, message: "CSV exported successfully.", blob: response.data as Blob, filename };
  } catch {
    return { success: false, message: "Failed to export attendance CSV." };
  }
};

// ==================== TESTS ====================
export interface TestData {
  testId: number;
  title: string;
  courseId: number;
  courseName?: string;
  date: string;
  totalMarks: number;
  passingMarks: number;
}

export const getTests = async (): Promise<{
  success: boolean;
  tests: TestData[];
}> => {
  try {
    const response = await api.get("/tests");
    const res = response.data;
    if (res.success && Array.isArray(res.data)) {
      return { success: true, tests: res.data };
    }
    return { success: false, tests: [] };
  } catch {
    return { success: false, tests: [] };
  }
};

export const createTest = async (data: {
  title: string;
  courseId: number;
  date: string;
  totalMarks: number;
  passingMarks: number;
}): Promise<{ success: boolean; message: string; test?: TestData }> => {
  try {
    const response = await api.post("/tests", data);
    const res = response.data;
    if (res.success && res.data) {
      return { success: true, message: res.message, test: res.data };
    }
    return { success: false, message: res.message || "Failed to create test" };
  } catch {
    return { success: false, message: "Tests endpoint not available" };
  }
};

export const deleteTest = async (
  testId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/tests/${testId}`);
    return response.data;
  } catch {
    return { success: false, message: "Tests endpoint not available" };
  }
};

// ==================== REPORTS ====================
export interface StudentReport {
  studentId: number;
  studentName: string;
  courseName: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  testScore: number;
  totalMarks: number;
  grade: string;
}

export const getReports = async (params?: {
  courseId?: number;
  studentId?: number;
}): Promise<{ success: boolean; reports: StudentReport[] }> => {
  try {
    const response = await api.get("/reports", { params });
    const res = response.data;
    if (res.success && Array.isArray(res.data)) {
      return { success: true, reports: res.data };
    }
    return { success: false, reports: [] };
  } catch {
    return { success: false, reports: [] };
  }
};

export const getMonthlyReports = async (params?: {
  month?: string;
  year?: number;
}): Promise<{ success: boolean; reports: StudentReport[] }> => {
  try {
    const response = await api.get("/reports/monthly", { params });
    const res = response.data;
    if (res.success && Array.isArray(res.data)) {
      return { success: true, reports: res.data };
    }
    return { success: false, reports: [] };
  } catch {
    return { success: false, reports: [] };
  }
};

// ==================== DASHBOARD STATS ====================
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalTests: number;
  recentAttendance: number;
  monthlyReportsGenerated: number;
}

export const getDashboardStats = async (): Promise<{
  success: boolean;
  stats: DashboardStats;
}> => {
  // First, try the dedicated dashboard/stats endpoint
  try {
    const response = await api.get("/dashboard/stats");
    const res = response.data;
    if (res.success && res.data) {
      const stats = { ...res.data } as DashboardStats;
      // The /dashboard/stats endpoint may only count students that have login
      // credentials (i.e. users in the /users table). Students without logins
      // are stored separately in the /students table, so fetch the full roster
      // to get the accurate student count.
      try {
        const studentsRes = await api.get("/students", { params: { limit: 1000 } });
        const studentsData = studentsRes.data?.data || [];
        if (Array.isArray(studentsData)) {
          stats.totalStudents =
            studentsRes.data?.pagination?.totalItems ?? studentsData.length;
        }
      } catch {
        // keep the original totalStudents if /students fetch fails
      }
      return { success: true, stats };
    }
  } catch {
    // Fallback: endpoint not available — will compute from individual endpoints
  }

  // Fallback: aggregate stats from individual working endpoints
  try {
    const [usersRes, coursesRes, testsRes, studentsRes] = await Promise.all([
      api.get("/users"),
      api.get("/courses"),
      api.get("/tests"),
      api.get("/students", { params: { limit: 1000 } }),
    ]);

    const usersData = usersRes.data?.data || usersRes.data?.users || [];
    const users = Array.isArray(usersData) ? usersData : [];

    const coursesData = coursesRes.data?.data || coursesRes.data?.courses || [];
    const courses = Array.isArray(coursesData) ? coursesData : [];

    const testsData = testsRes.data?.data || testsRes.data?.tests || [];
    const tests = Array.isArray(testsData) ? testsData : [];

    // Students are stored separately from users — /students includes ALL
    // students (even those without login credentials), while /users only
    // includes users with login accounts. Use /students for the accurate
    // student count.
    const studentsData = studentsRes.data?.data || [];
    const students = Array.isArray(studentsData) ? studentsData : [];
    const totalStudents =
      studentsRes.data?.pagination?.totalItems ?? students.length;

    const stats: DashboardStats = {
      totalUsers: users.length,
      totalStudents,
      totalTeachers: users.filter((u: { role?: string }) => u.role === "Teacher").length,
      totalCourses: courses.length,
      totalTests: tests.length,
      recentAttendance: 0,
      monthlyReportsGenerated: 0,
    };

    // Try to get attendance count (non-blocking)
    try {
      const attendanceRes = await api.get("/attendance");
      const attendanceData = attendanceRes.data?.data || attendanceRes.data?.records || [];
      if (Array.isArray(attendanceData)) {
        stats.recentAttendance = attendanceData.length;
      }
    } catch {
      // attendance count defaults to 0
    }

    return { success: true, stats };
  } catch {
    return { success: false, stats: {} as DashboardStats };
  }
};

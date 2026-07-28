import api from "./api";

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
  const response = await api.get("/courses");
  const res = response.data;
  if (res.success && Array.isArray(res.data)) {
    return { success: true, courses: res.data.map(mapCourse) };
  }
  return { success: false, courses: [] };
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
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  date: string;
  status: "present" | "absent" | "late";
}

export const getAttendance = async (params?: {
  courseId?: number;
  date?: string;
}): Promise<{ success: boolean; records: AttendanceRecord[] }> => {
  try {
    const response = await api.get("/attendance", { params });
    const res = response.data;
    if (res.success && Array.isArray(res.data)) {
      return { success: true, records: res.data };
    }
    return { success: false, records: [] };
  } catch {
    return { success: false, records: [] };
  }
};

export const markAttendance = async (data: {
  studentId: number;
  courseId: number;
  date: string;
  status: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/attendance", data);
    return response.data;
  } catch {
    return { success: false, message: "Attendance endpoint not available" };
  }
};

export const markBulkAttendance = async (
  records: {
    studentId: number;
    courseId: number;
    date: string;
    status: string;
  }[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/attendance/bulk", { records });
    return response.data;
  } catch {
    return { success: false, message: "Attendance endpoint not available" };
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
  try {
    const response = await api.get("/dashboard/stats");
    const res = response.data;
    if (res.success && res.data) {
      return { success: true, stats: res.data };
    }
    return { success: false, stats: {} as DashboardStats };
  } catch {
    return { success: false, stats: {} as DashboardStats };
  }
};
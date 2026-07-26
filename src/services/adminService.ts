import api from "./api";

// ==================== USER MANAGEMENT ====================
export interface UserData {
  userId: number;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Student";
  createdAt?: string;
}

export const getUsers = async (): Promise<{ success: boolean; users: UserData[] }> => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const createUser = async (data: { name: string; email: string; password: string; role: string }): Promise<{ success: boolean; message: string; user?: UserData }> => {
  const response = await api.post("/admin/users", data);
  return response.data;
};

export const updateUser = async (userId: number, data: Partial<UserData & { password?: string }>): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/admin/users/${userId}`, data);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// ==================== COURSE MANAGEMENT ====================
export interface CourseData {
  courseId: number;
  title: string;
  description: string;
  teacherId: number;
  teacherName?: string;
  createdAt?: string;
}

export const getCourses = async (): Promise<{ success: boolean; courses: CourseData[] }> => {
  const response = await api.get("/admin/courses");
  return response.data;
};

export const createCourse = async (data: { title: string; description: string; teacherId: number }): Promise<{ success: boolean; message: string; course?: CourseData }> => {
  const response = await api.post("/admin/courses", data);
  return response.data;
};

export const updateCourse = async (courseId: number, data: Partial<CourseData>): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/admin/courses/${courseId}`, data);
  return response.data;
};

export const deleteCourse = async (courseId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/courses/${courseId}`);
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

export const getAttendance = async (params?: { courseId?: number; date?: string }): Promise<{ success: boolean; records: AttendanceRecord[] }> => {
  const response = await api.get("/admin/attendance", { params });
  return response.data;
};

export const markAttendance = async (data: { studentId: number; courseId: number; date: string; status: string }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/admin/attendance", data);
  return response.data;
};

export const markBulkAttendance = async (records: { studentId: number; courseId: number; date: string; status: string }[]): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/admin/attendance/bulk", { records });
  return response.data;
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

export const getTests = async (): Promise<{ success: boolean; tests: TestData[] }> => {
  const response = await api.get("/admin/tests");
  return response.data;
};

export const createTest = async (data: { title: string; courseId: number; date: string; totalMarks: number; passingMarks: number }): Promise<{ success: boolean; message: string; test?: TestData }> => {
  const response = await api.post("/admin/tests", data);
  return response.data;
};

export const deleteTest = async (testId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/tests/${testId}`);
  return response.data;
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

export const getReports = async (params?: { courseId?: number; studentId?: number }): Promise<{ success: boolean; reports: StudentReport[] }> => {
  const response = await api.get("/admin/reports", { params });
  return response.data;
};

export const getMonthlyReports = async (params?: { month?: string; year?: number }): Promise<{ success: boolean; reports: StudentReport[] }> => {
  const response = await api.get("/admin/reports/monthly", { params });
  return response.data;
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

export const getDashboardStats = async (): Promise<{ success: boolean; stats: DashboardStats }> => {
  const response = await api.get("/admin/dashboard/stats");
  return response.data;
};
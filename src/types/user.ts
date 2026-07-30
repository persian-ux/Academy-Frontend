export type Role = "Admin" | "Teacher" | "Student";
export type GradeLevel = "8th" | "9th" | "10th" | "11th" | "12th";

export interface User {
  userId: number;
  name: string;
  email: string;
  role: Role;
  grade_level: GradeLevel | null;
  section?: string | null;
  courseId?: number | null;
  createdAt: string | null;
  isActive: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "Teacher" | "Student";
  grade_level?: GradeLevel | null;
  courseId?: number | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "Teacher" | "Student";
  grade_level?: GradeLevel | null;
  courseId?: number | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

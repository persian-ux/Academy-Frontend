import type { GradeLevel } from "./user";

export interface Student {
  id: number;
  name: string;
  father_name: string | null;
  phone: string | null;
  address: string | null;
  grade_level: GradeLevel | null;
  course_id: number | null;
  course_name: string | null;
  roll_no: string | null;
  date_of_birth: string | null;
  created_at: string | null;
}

export interface CreateStudentPayload {
  name: string;
  father_name?: string | null;
  phone?: string | null;
  address?: string | null;
  grade_level?: GradeLevel | null;
  course_id?: number | null;
  roll_no?: string | null;
  date_of_birth?: string | null;
}

export interface UpdateStudentPayload {
  name?: string;
  father_name?: string | null;
  phone?: string | null;
  address?: string | null;
  grade_level?: GradeLevel | null;
  course_id?: number | null;
  roll_no?: string | null;
  date_of_birth?: string | null;
}

export interface CreateLoginPayload {
  username: string;
  email?: string | null;
  password: string;
  courseId?: number | null;
}

export interface CreatedLoginAccount {
  userId: number;
  name: string;
  email: string | null;
  role: "Admin" | "Teacher" | "Student";
  grade_level: string | null;
  courseId: number | null;
  section: string | null;
  student_id: number;
  isActive: boolean;
  createdAt: string | null;
}

export interface StudentListResponse {
  success: boolean;
  message: string;
  data: Student[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface StudentResponse {
  success: boolean;
  message: string;
  data: Student;
}

export interface CreateLoginResponse {
  success: boolean;
  message: string;
  data: CreatedLoginAccount;
}
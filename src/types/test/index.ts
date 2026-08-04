export type GradeLevel = "8th" | "9th" | "10th" | "11th" | "12th";

export type TestStatus = "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

export interface Test {
  test_id: number;
  title: string;
  subject: string;
  grade: GradeLevel;
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  created_by: number;
  status: TestStatus;
  created_at: string | null;
  creator_name: string;
  creator_email: string;
}

export interface CreateTestPayload {
  title: string;
  subject: string;
  grade: GradeLevel;
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  status?: TestStatus;
}

export type UpdateTestPayload = Partial<CreateTestPayload>;

export interface TestApiResponse {
  success: boolean;
  message: string;
  data?: Test | Test[];
}

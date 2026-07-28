export interface Test {
  test_id: number;
  title: string;
  subject: string;
  grade: string;
  date: string;
  duration: number;
  created_by: number;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
  created_at: string;
  creator_name: string;
  creator_email: string;
}

export interface CreateTestPayload {
  title: string;
  subject: string;
  grade: string;
  date: string;
  duration: number;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
}

export interface UpdateTestPayload extends Partial<CreateTestPayload> {}

export interface TestApiResponse {
  success: boolean;
  message: string;
  data?: Test | Test[];
}
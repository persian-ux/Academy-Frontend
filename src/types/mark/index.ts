export interface Mark {
  mark_id: number;
  test_id: number;
  test_title: string;
  test_subject: string;
  test_date: string;
  student_id: number;
  student_name: string;
  marks_obtained: number;
  total_marks: number;
  uploaded_by_name: string;
}

export interface CreateMarkPayload {
  test_id: number;
  student_id: number;
  marks_obtained: number;
  total_marks: number;
}

export interface BatchMarkPayload {
  test_id: number;
  marks: Omit<CreateMarkPayload, "test_id">[];
}

export interface MarksApiResponse {
  success: boolean;
  message: string;
  data?: Mark | Mark[];
}
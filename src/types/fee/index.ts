export type FeeStatus = "Paid" | "Unpaid";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthName = (typeof MONTHS)[number];

export interface FeeRecord {
  fee_id: number;
  student_id: number;
  student_name: string;
  student_roll_no: string | null;
  month: string;
  year: number;
  amount: number;
  status: FeeStatus;
  updated_by: number | null;
  updated_by_name: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface FeeSummary {
  total_fees: number;
  paid_fees: number;
  unpaid_fees: number;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
}

export interface FeeListData {
  student_id?: number;
  student_name?: string;
  month?: string;
  year?: number;
  records: FeeRecord[];
  summary: FeeSummary;
}

export interface CreateFeePayload {
  student_id: number;
  month: string;
  year: number;
  amount: number;
  status?: FeeStatus;
}

export interface ToggleFeePayload {
  status: FeeStatus;
}

export interface FeeApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
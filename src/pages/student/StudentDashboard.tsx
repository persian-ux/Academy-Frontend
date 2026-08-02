import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  ClipboardCheck,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
  BookOpen,
  Percent,
  Trophy,
  Banknote,
  User,
} from "lucide-react";
import { getMyFees } from "@/services/feeService";
import { getMyMarks } from "@/services/markService";
import { getMyAttendance, getMyMonthlyAttendance } from "@/services/attendanceService";
import type { FeeListData } from "@/types/fee";
import type { Mark } from "@/types/mark";
import type { AttendanceRecord, MonthlyReportData } from "@/services/adminService";
import { useAppSelector } from "@/hooks/useAppStore";
import StatusBadge from "@/components/fees/StatusBadge";
import FeeSummaryCards from "@/components/fees/FeeSummaryCards";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  Present: "text-green-400 bg-green-500/10 border-green-500/30",
  Absent: "text-red-400 bg-red-500/10 border-red-500/30",
  Late: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Excused: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const ATTENDANCE_ICONS: Record<string, React.ReactNode> = {
  Present: <CheckCircle2 className="w-3.5 h-3.5" />,
  Absent: <XCircle className="w-3.5 h-3.5" />,
  Late: <Clock className="w-3.5 h-3.5" />,
  Excused: <AlertCircle className="w-3.5 h-3.5" />,
};

function AttendanceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        ATTENDANCE_COLORS[status as AttendanceStatus] || "text-gray-400 bg-gray-500/10 border-gray-500/30"
      }`}
    >
      {ATTENDANCE_ICONS[status]}
      <span className="ml-1">{status}</span>
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function getPercentageColor(percentage: number) {
  if (percentage >= 80) return "text-green-400";
  if (percentage >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getPercentageBg(percentage: number) {
  if (percentage >= 80) return "bg-green-500/10 border-green-500/30";
  if (percentage >= 60) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

export default function StudentDashboard() {
  const { user } = useAppSelector((state) => state.auth);

  // Fees state
  const [fees, setFees] = useState<FeeListData | null>(null);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesError, setFeesError] = useState("");

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  // Monthly attendance report state
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Marks state
  const [marks, setMarks] = useState<Mark[]>([]);
  const [marksLoading, setMarksLoading] = useState(true);
  const [marksError, setMarksError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      // Load fees
      try {
        const res = await getMyFees();
        if (!cancelled) {
          if (res.success && res.data) setFees(res.data);
          else setFeesError(res.message || "Failed to load fees");
        }
      } catch {
        if (!cancelled) setFeesError("Failed to load fees");
      } finally {
        if (!cancelled) setFeesLoading(false);
      }

      // Load attendance
      try {
        const res = await getMyAttendance();
        if (!cancelled) {
          if (res.success && res.data) setAttendanceRecords(res.data);
          else setAttendanceError(res.message || "Failed to load attendance");
        }
      } catch {
        if (!cancelled) setAttendanceError("Failed to load attendance");
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }

      // Load marks
      try {
        const res = await getMyMarks();
        if (!cancelled) {
          if (res.success) {
            const sorted = [...res.data].sort(
              (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
            );
            setMarks(sorted);
          } else {
            setMarksError(res.message);
          }
        }
      } catch {
        if (!cancelled) setMarksError("Failed to load marks");
      } finally {
        if (!cancelled) setMarksLoading(false);
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load monthly attendance report when month/year changes
  useEffect(() => {
    let cancelled = false;
    const loadMonthlyReport = async () => {
      setReportLoading(true);
      setReportError("");
      setMonthlyReport(null);
      try {
        const res = await getMyMonthlyAttendance({ month: reportMonth, year: reportYear });
        if (!cancelled) {
          if (res.success && res.data) setMonthlyReport(res.data);
          else setReportError(res.message || "Failed to load monthly report");
        }
      } catch {
        if (!cancelled) setReportError("Failed to load monthly report");
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    };
    loadMonthlyReport();
    return () => {
      cancelled = true;
    };
  }, [reportMonth, reportYear]);

  // ===== Derived: Attendance summary =====
  const attendanceSummary = useMemo(() => {
    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    attendanceRecords.forEach((r) => {
      summary.total++;
      if (r.status === "Present") summary.present++;
      else if (r.status === "Absent") summary.absent++;
      else if (r.status === "Late") summary.late++;
      else if (r.status === "Excused") summary.excused++;
    });
    return summary;
  }, [attendanceRecords]);

  const attendancePercentage =
    attendanceSummary.total > 0
      ? Math.round((attendanceSummary.present / attendanceSummary.total) * 1000) / 10
      : 0;

  const sortedAttendance = useMemo(() => {
    return [...attendanceRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [attendanceRecords]);

  // ===== Derived: Marks summary =====
  const marksSummary = useMemo(() => {
    const totalMarksObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMarksPossible = marks.reduce((sum, m) => sum + m.total_marks, 0);
    const overallPercentage =
      totalMarksPossible > 0 ? Math.round((totalMarksObtained / totalMarksPossible) * 1000) / 10 : 0;
    return { totalMarksObtained, totalMarksPossible, overallPercentage };
  }, [marks]);

  // Group marks by month+year
  const groupedMarks = useMemo(() => {
    const groups: Record<string, Mark[]> = {};
    marks.forEach((m) => {
      const date = new Date(m.test_date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups)
      .map(([key, items]) => ({
        key,
        year: Number(key.split("-")[0]),
        month: Number(key.split("-")[1]),
        monthName: MONTH_NAMES[Number(key.split("-")[1]) - 1],
        marks: items.sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()),
        totalObtained: items.reduce((sum, m) => sum + m.marks_obtained, 0),
        totalPossible: items.reduce((sum, m) => sum + m.total_marks, 0),
        avgPercentage:
          items.reduce((sum, m) => sum + m.marks_obtained, 0) /
          items.reduce((sum, m) => sum + m.total_marks, 0) *
          100,
      }))
      .sort((a, b) => Number(b.key.replace("-", "")) - Number(a.key.replace("-", "")));
  }, [marks]);

  // Which tab is active
  const [activeSection, setActiveSection] = useState<"fees" | "attendance" | "reports">("fees");

  const isRecentUnpaid = (fees?.summary.unpaid_fees ?? 0) > 0;

  return (
    <div className="min-h-screen pt-20 px-4 pb-8 md:px-8 md:pb-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome, {user?.name?.split(" ")[0] || "Student"}
              </h1>
              <p className="text-muted-foreground text-sm">
                Your dashboard — Fee Check, Attendance, and Monthly Test Reports
              </p>
            </div>
          </div>
          {isRecentUnpaid && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <XCircle className="w-4 h-4 shrink-0" />
              You have {fees?.summary.unpaid_fees ?? 0} unpaid fee record(s). Please check your fee section below.
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl bg-white/5 border border-white/10 w-fit flex-wrap">
          <button
            onClick={() => setActiveSection("fees")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === "fees"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Fee Check
          </button>
          <button
            onClick={() => setActiveSection("attendance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === "attendance"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Attendance Check
          </button>
          <button
            onClick={() => setActiveSection("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === "reports"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            Monthly Test Report
          </button>
        </div>

        {/* ==================== FEE CHECK SECTION ==================== */}
        {activeSection === "fees" && (
          <div className="space-y-6 animate-fade-in-up">
            <SectionCard
              title="Fee Check"
              subtitle="View your fee records and payment status"
              icon={<Wallet className="w-5 h-5 text-primary" />}
            >
              {feesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : feesError ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {feesError}
                </div>
              ) : fees ? (
                <>
                  <div className="mb-4">
                    <p className="text-white font-medium">{fees.student_name || "Student"}</p>
                    <p className="text-sm text-muted-foreground">Your complete fee history</p>
                  </div>

                  <FeeSummaryCards summary={fees.summary} />

                  {fees.records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
                      <Wallet className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No fee records available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="text-left p-4 text-muted-foreground font-medium text-sm">Month</th>
                            <th className="text-left p-4 text-muted-foreground font-medium text-sm">Year</th>
                            <th className="text-left p-4 text-muted-foreground font-medium text-sm">Amount</th>
                            <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
                            <th className="text-left p-4 text-muted-foreground font-medium text-sm">Paid At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fees.records.map((fee) => (
                            <tr key={fee.fee_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4 text-white text-sm font-medium">{fee.month}</td>
                              <td className="p-4 text-muted-foreground text-sm">{fee.year}</td>
                              <td className="p-4 text-white text-sm">Rs. {fee.amount.toLocaleString()}</td>
                              <td className="p-4"><StatusBadge status={fee.status} /></td>
                              <td className="p-4 text-muted-foreground text-sm">
                                {fee.paid_at ? new Date(fee.paid_at).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
                  <Banknote className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No fee information available</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ==================== ATTENDANCE CHECK SECTION ==================== */}
        {activeSection === "attendance" && (
          <div className="space-y-6 animate-fade-in-up">
            <SectionCard
              title="Attendance Check"
              subtitle="View your attendance history and monthly summary"
              icon={<ClipboardCheck className="w-5 h-5 text-primary" />}
            >
              {attendanceLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : attendanceError ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {attendanceError}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
                  <ClipboardCheck className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No attendance records available yet</p>
                </div>
              ) : (
                <>
                  {/* Attendance Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-muted-foreground">Present</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{attendanceSummary.present}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-muted-foreground">Absent</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{attendanceSummary.absent}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">Late</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{attendanceSummary.late}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-muted-foreground">Excused</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{attendanceSummary.excused}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Attendance %</span>
                      </div>
                      <p className={`text-2xl font-bold ${attendancePercentage >= 75 ? "text-green-400" : attendancePercentage >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {attendancePercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Attendance History Table */}
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Date
                            </div>
                          </th>
                          <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              Section
                            </div>
                          </th>
                          <th className="text-center p-4 text-muted-foreground font-medium text-sm">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAttendance.map((record) => (
                          <tr key={record.attendance_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white text-sm">{record.date}</td>
                            <td className="p-4 text-muted-foreground text-sm">{record.course_name}</td>
                            <td className="p-4 text-center">
                              <AttendanceStatusBadge status={record.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Monthly Attendance Report */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Monthly Attendance Report
                      </h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(reportMonth)}
                          onValueChange={(value) => setReportMonth(Number(value))}
                        >
                          <SelectTrigger className="w-32.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTH_NAMES.map((name, idx) => (
                              <SelectItem key={idx + 1} value={String(idx + 1)}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(reportYear)}
                          onValueChange={(value) => setReportYear(Number(value))}
                        >
                          <SelectTrigger className="w-25">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                              <SelectItem key={y} value={String(y)}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {reportLoading ? (
                      <div className="flex items-center justify-center h-32 rounded-xl border border-white/10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : reportError ? (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {reportError}
                      </div>
                    ) : monthlyReport ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-muted-foreground">Present</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{monthlyReport.summary.present}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-muted-foreground">Absent</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{monthlyReport.summary.absent}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">Late</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{monthlyReport.summary.late}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-blue-400" />
                              <span className="text-xs text-muted-foreground">Excused</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{monthlyReport.summary.excused}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{monthlyReport.summary.total}</p>
                          </div>
                        </div>

                        {monthlyReport.details.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Section</th>
                                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyReport.details.map((record) => (
                                  <tr key={record.attendance_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white text-sm">{record.date}</td>
                                    <td className="p-4 text-muted-foreground text-sm">{record.course_name}</td>
                                    <td className="p-4 text-center">
                                      <AttendanceStatusBadge status={record.status} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                            No attendance records for {MONTH_NAMES[reportMonth - 1]} {reportYear}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                        Select a month and year to view your monthly attendance report
                      </div>
                    )}
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        )}

        {/* ==================== MONTHLY TEST REPORT SECTION ==================== */}
        {activeSection === "reports" && (
          <div className="space-y-6 animate-fade-in-up">
            <SectionCard
              title="Monthly Test Report"
              subtitle="View your test performance grouped by month"
              icon={<FileText className="w-5 h-5 text-primary" />}
            >
              {marksLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : marksError ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {marksError}
                </div>
              ) : marks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
                  <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No test results available yet</p>
                </div>
              ) : (
                <>
                  {/* Overall Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Overall Percentage</span>
                      </div>
                      <p className={`text-2xl font-bold ${getPercentageColor(marksSummary.overallPercentage)}`}>
                        {marksSummary.overallPercentage}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Marks</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {marksSummary.totalMarksObtained} / {marksSummary.totalMarksPossible}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Tests Taken</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{marks.length}</p>
                    </div>
                  </div>

                  {/* Monthly Grouped Reports */}
                  <div className="space-y-6">
                    {groupedMarks.map((group) => {
                      const monthPercentage = group.totalPossible > 0
                        ? Math.round((group.totalObtained / group.totalPossible) * 1000) / 10
                        : 0;
                      return (
                        <div key={group.key} className="rounded-xl border border-white/10 overflow-hidden">
                          {/* Month Header */}
                          <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold text-white">
                                {group.monthName} {group.year}
                              </h3>
                              <span className="text-xs text-muted-foreground">
                                ({group.marks.length} test{group.marks.length !== 1 ? "s" : ""})
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {group.totalObtained} / {group.totalPossible} marks
                              </span>
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPercentageBg(monthPercentage)} ${getPercentageColor(monthPercentage)}`}
                              >
                                {monthPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Month Tests Table */}
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10">
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Test</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Subject</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs">Date</th>
                                <th className="text-center p-3 text-muted-foreground font-medium text-xs">Marks</th>
                                <th className="text-center p-3 text-muted-foreground font-medium text-xs">Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.marks.map((mark) => {
                                const percentage = (mark.marks_obtained / mark.total_marks) * 100;
                                return (
                                  <tr key={mark.mark_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-white text-sm font-medium">{mark.test_title}</td>
                                    <td className="p-3 text-muted-foreground text-sm">{mark.test_subject}</td>
                                    <td className="p-3 text-muted-foreground text-sm">
                                      {mark.test_date.split("T")[0]}
                                    </td>
                                    <td className="p-3 text-white text-sm text-center">
                                      {mark.marks_obtained} / {mark.total_marks}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPercentageBg(percentage)} ${getPercentageColor(percentage)}`}
                                      >
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
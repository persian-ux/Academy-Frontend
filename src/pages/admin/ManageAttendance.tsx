import { useState, useEffect } from "react";
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
  History,
  BarChart3,
  Calendar,
  BookOpen,
  Filter,
  GraduationCap,
} from "lucide-react";
import {
  markAttendance,
  getAttendanceHistory,
  getMonthlyAttendanceReport,
  getCourses,
  type CourseData,
  type AttendanceRecord,
  type MonthlyReportData,
} from "@/services/adminService";
import { userService } from "@/services/userService";
import type { User, GradeLevel } from "@/types/user";

type TabId = "mark" | "history" | "report";
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

const STATUS_OPTIONS: AttendanceStatus[] = ["Present", "Absent", "Late", "Excused"];

const GRADE_LEVELS: GradeLevel[] = ["8th", "9th", "10th", "11th", "12th"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: "text-green-400 bg-green-500/10 border-green-500/30",
  Absent: "text-red-400 bg-red-500/10 border-red-500/30",
  Late: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Excused: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const STATUS_BG: Record<string, string> = {
  Present: "bg-green-500/20 border-green-500/50",
  Absent: "bg-red-500/20 border-red-500/50",
  Late: "bg-yellow-500/20 border-yellow-500/50",
  Excused: "bg-blue-500/20 border-blue-500/50",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_COLORS[status as AttendanceStatus] || "text-gray-400 bg-gray-500/10 border-gray-500/30"
      }`}
    >
      {status === "Present" && <Check className="w-3 h-3 mr-1" />}
      {status === "Absent" && <X className="w-3 h-3 mr-1" />}
      {status === "Late" && <Clock className="w-3 h-3 mr-1" />}
      {status === "Excused" && <AlertCircle className="w-3 h-3 mr-1" />}
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${color} bg-opacity-10`}
    >
      <div className="p-2 rounded-lg bg-white/5">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-white">{count}</p>
      </div>
    </div>
  );
}

export default function ManageAttendance() {
  // Shared state
  const [activeTab, setActiveTab] = useState<TabId>("mark");
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Tab 1 - Mark Attendance
  const [markGrade, setMarkGrade] = useState<GradeLevel | "">("");
  const [markStudentId, setMarkStudentId] = useState<number>(0);
  const [markCourseId, setMarkCourseId] = useState<number>(0);
  const [markDate, setMarkDate] = useState(new Date().toISOString().split("T")[0]);
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>("Present");
  const [markSubmitting, setMarkSubmitting] = useState(false);
  const [markSuccess, setMarkSuccess] = useState("");
  const [markError, setMarkError] = useState("");
  const [markErrors, setMarkErrors] = useState<string[]>([]);

  // Tab 2 - Attendance History
  const [historyGrade, setHistoryGrade] = useState<GradeLevel | "">("");
  const [historyStudentId, setHistoryStudentId] = useState<number>(0);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySortAsc, setHistorySortAsc] = useState(false);

  // Tab 3 - Monthly Report
  const [reportGrade, setReportGrade] = useState<GradeLevel | "">("");
  const [reportStudentId, setReportStudentId] = useState<number>(0);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Derived: students filtered by selected grade
  const getStudentsByGrade = (grade: GradeLevel | "") => {
    if (!grade) return [];
    return allStudents.filter((s) => s.grade_level === grade);
  };

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [coursesRes, usersRes] = await Promise.all([
          getCourses(),
          userService.list(),
        ]);
        if (cancelled) return;
        if (coursesRes.success) setCourses(coursesRes.courses);
        if (usersRes.success && usersRes.data) {
          setAllStudents(usersRes.data.filter((u: User) => u.role === "Student"));
        }
      } catch {
        if (!cancelled) setGlobalError("Failed to load data");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============ TAB 1: Mark Attendance ============
  const handleMarkAttendance = async () => {
    if (!markStudentId || !markCourseId) {
      setMarkError("Please select a student, course, and grade");
      return;
    }
    setMarkSubmitting(true);
    setMarkError("");
    setMarkSuccess("");
    setMarkErrors([]);

    try {
      const res = await markAttendance({
        student_id: markStudentId,
        course_id: markCourseId,
        date: markDate,
        status: markStatus,
      });

      if (res.success) {
        const student = allStudents.find((s) => s.userId === markStudentId);
        const studentName = student?.name || "Unknown";
        setMarkSuccess(
          `Attendance marked for ${studentName} (${markGrade}) on ${markDate} as ${markStatus}`
        );
      } else {
        if (res.errors && res.errors.length > 0) {
          setMarkErrors(res.errors);
        } else {
          setMarkError(res.message || "Failed to mark attendance");
        }
      }
    } catch {
      setMarkError("Failed to mark attendance");
    } finally {
      setMarkSubmitting(false);
    }
  };

  // ============ TAB 2: Attendance History ============
  const handleLoadHistory = async () => {
    if (!historyStudentId) {
      setHistoryError("Please select a student");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryRecords([]);

    try {
      const res = await getAttendanceHistory(historyStudentId);
      if (res.success && res.data) {
        setHistoryRecords(res.data);
      } else {
        setHistoryError(res.message || "Failed to load attendance history");
      }
    } catch {
      setHistoryError("Failed to load attendance history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const getSortedHistory = () => {
    const sorted = [...historyRecords];
    sorted.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return historySortAsc ? cmp : -cmp;
    });
    return sorted;
  };

  // ============ TAB 3: Monthly Report ============
  const handleLoadReport = async () => {
    if (!reportStudentId) {
      setReportError("Please select a student");
      return;
    }
    setReportLoading(true);
    setReportError("");
    setReportData(null);

    try {
      const res = await getMonthlyAttendanceReport({
        studentId: reportStudentId,
        month: reportMonth,
        year: reportYear,
      });
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        setReportError(res.message || "Failed to load monthly report");
      }
    } catch {
      setReportError("Failed to load monthly report");
    } finally {
      setReportLoading(false);
    }
  };

  // ============ Tabs configuration ============
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "mark", label: "Mark Attendance", icon: <UserCheck className="w-4 h-4" /> },
    { id: "history", label: "Attendance History", icon: <History className="w-4 h-4" /> },
    { id: "report", label: "Monthly Report", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Attendance Management</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Mark attendance, view history, and generate reports - grade wise
        </p>
      </div>

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {globalError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: Mark Attendance ==================== */}
      {activeTab === "mark" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Mark Attendance - Grade Wise
            </h3>

            {/* Grade Selector */}
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2 font-medium">
                Select Grade
              </label>
              <div className="flex flex-wrap gap-3">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setMarkGrade(grade);
                      setMarkStudentId(0);
                      setMarkSuccess("");
                      setMarkError("");
                      setMarkErrors([]);
                    }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      markGrade === grade
                        ? "bg-primary text-white border-primary shadow-lg"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 inline mr-1.5" />
                    {grade} Class
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Student Select */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Student
                </label>
                <select
                  value={markStudentId}
                  onChange={(e) => {
                    setMarkStudentId(Number(e.target.value));
                    setMarkSuccess("");
                    setMarkError("");
                    setMarkErrors([]);
                  }}
                  disabled={!markGrade}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value={0}>
                    {markGrade ? `Select student from ${markGrade}` : "Select a grade first"}
                  </option>
                  {getStudentsByGrade(markGrade).map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                {markGrade && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getStudentsByGrade(markGrade).length} student(s) in {markGrade}
                  </p>
                )}
              </div>

              {/* Course Select */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Course
                </label>
                <select
                  value={markCourseId}
                  onChange={(e) => {
                    setMarkCourseId(Number(e.target.value));
                    setMarkSuccess("");
                    setMarkError("");
                    setMarkErrors([]);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                >
                  <option value={0}>Select a course</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={markDate}
                  onChange={(e) => {
                    setMarkDate(e.target.value);
                    setMarkSuccess("");
                    setMarkError("");
                    setMarkErrors([]);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Status Radio Buttons */}
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setMarkStatus(status);
                      setMarkSuccess("");
                      setMarkError("");
                      setMarkErrors([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      markStatus === status
                        ? `${STATUS_BG[status]} text-white`
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                    }`}
                  >
                    {status === "Present" && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {status === "Absent" && <X className="w-3.5 h-3.5 inline mr-1.5" />}
                    {status === "Late" && <Clock className="w-3.5 h-3.5 inline mr-1.5" />}
                    {status === "Excused" && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleMarkAttendance}
              disabled={markSubmitting || !markStudentId || !markCourseId || !markGrade}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Attendance
            </button>
          </div>

          {/* Success / Error Feedback */}
          {markSuccess && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 font-medium text-sm">Success</p>
                  <p className="text-green-300/80 text-sm mt-0.5">{markSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {markError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-red-500/20">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">Error</p>
                  <p className="text-red-300/80 text-sm mt-0.5">{markError}</p>
                </div>
              </div>
            </div>
          )}

          {markErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm mb-1">Validation Errors</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {markErrors.map((err, i) => (
                      <li key={i} className="text-red-300/80 text-sm">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: Attendance History ==================== */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Attendance History - Grade Wise
            </h3>

            {/* Grade Selector for History */}
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2 font-medium">
                Select Grade
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setHistoryGrade(grade);
                      setHistoryStudentId(0);
                      setHistoryRecords([]);
                      setHistoryError("");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      historyGrade === grade
                        ? "bg-primary text-white border-primary"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Select Student
                </label>
                <select
                  value={historyStudentId}
                  onChange={(e) => {
                    setHistoryStudentId(Number(e.target.value));
                    setHistoryRecords([]);
                    setHistoryError("");
                  }}
                  disabled={!historyGrade}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value={0}>
                    {historyGrade ? `Choose student from ${historyGrade}` : "Select a grade first"}
                  </option>
                  {getStudentsByGrade(historyGrade).map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLoadHistory}
                disabled={historyLoading || !historyStudentId}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {historyLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                Load History
              </button>
            </div>

            {historyError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {historyError}
              </div>
            )}
          </div>

          {/* History Table */}
          {historyRecords.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th
                      className="text-left p-4 text-muted-foreground font-medium text-sm cursor-pointer hover:text-white select-none"
                      onClick={() => setHistorySortAsc(!historySortAsc)}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Date
                        <span className="text-xs text-muted-foreground ml-1">
                          {historySortAsc ? "↑" : "↓"}
                        </span>
                      </div>
                    </th>
                    <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Course
                      </div>
                    </th>
                    <th className="text-center p-4 text-muted-foreground font-medium text-sm">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedHistory().map((record) => (
                    <tr
                      key={record.attendance_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-white text-sm">{record.date}</td>
                      <td className="p-4 text-white text-sm">
                        {record.course_name}
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {historyStudentId && !historyLoading && historyRecords.length === 0 && !historyError && (
            <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
              No attendance records found for this student.
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: Monthly Report ==================== */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Monthly Attendance Report - Grade Wise
            </h3>

            {/* Grade Selector for Report */}
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2 font-medium">
                Select Grade
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setReportGrade(grade);
                      setReportStudentId(0);
                      setReportData(null);
                      setReportError("");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      reportGrade === grade
                        ? "bg-primary text-white border-primary"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Student
                </label>
                <select
                  value={reportStudentId}
                  onChange={(e) => {
                    setReportStudentId(Number(e.target.value));
                    setReportData(null);
                    setReportError("");
                  }}
                  disabled={!reportGrade}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value={0}>
                    {reportGrade ? `Choose student from ${reportGrade}` : "Select a grade first"}
                  </option>
                  {getStudentsByGrade(reportGrade).map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Month
                </label>
                <select
                  value={reportMonth}
                  onChange={(e) => {
                    setReportMonth(Number(e.target.value));
                    setReportData(null);
                    setReportError("");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={reportYear}
                  onChange={(e) => {
                    setReportYear(Number(e.target.value));
                    setReportData(null);
                    setReportError("");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleLoadReport}
                  disabled={reportLoading || !reportStudentId}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {reportLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4" />
                  )}
                  Generate Report
                </button>
              </div>
            </div>

            {reportError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {reportError}
              </div>
            )}
          </div>

          {/* Report Results */}
          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <SummaryCard
                  label="Present"
                  count={reportData.summary.present}
                  color="border-green-500/30"
                  icon={<Check className="w-5 h-5 text-green-400" />}
                />
                <SummaryCard
                  label="Absent"
                  count={reportData.summary.absent}
                  color="border-red-500/30"
                  icon={<X className="w-5 h-5 text-red-400" />}
                />
                <SummaryCard
                  label="Late"
                  count={reportData.summary.late}
                  color="border-yellow-500/30"
                  icon={<Clock className="w-5 h-5 text-yellow-400" />}
                />
                <SummaryCard
                  label="Excused"
                  count={reportData.summary.excused}
                  color="border-blue-500/30"
                  icon={<AlertCircle className="w-5 h-5 text-blue-400" />}
                />
                <SummaryCard
                  label="Total"
                  count={reportData.summary.total}
                  color="border-white/20"
                  icon={<Calendar className="w-5 h-5 text-white" />}
                />
              </div>

              {/* Report Header */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white font-medium">
                  Report for {reportData.student_name} ({reportGrade}) - {reportData.month} {reportData.year}
                </p>
              </div>

              {/* Detail Table */}
              {reportData.details.length > 0 && (
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
                            Course
                          </div>
                        </th>
                        <th className="text-center p-4 text-muted-foreground font-medium text-sm">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.details.map((record) => (
                        <tr
                          key={record.attendance_id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 text-white text-sm">{record.date}</td>
                          <td className="p-4 text-white text-sm">
                            {record.course_name}
                          </td>
                          <td className="p-4 text-center">
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {reportStudentId && !reportLoading && !reportData && !reportError && (
            <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
              Select a student, month, and year, then click "Generate Report" to view the report.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
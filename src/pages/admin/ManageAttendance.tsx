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
  Users,
  Save,
} from "lucide-react";
import {
  markBulkAttendance,
  getAttendanceHistory,
  getMonthlyAttendanceReport,
  getCourses,
  type CourseData,
  type AttendanceRecord,
  type MonthlyReportData,
} from "@/services/adminService";
import { userService } from "@/services/userService";
import type { User, GradeLevel } from "@/types/user";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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

  // Tab 1 - Mark Attendance (Bulk)
  const [markGrade, setMarkGrade] = useState<GradeLevel | "">("");
  const [markSection, setMarkSection] = useState<string>("");
  const [markCourseId, setMarkCourseId] = useState<number>(0);
  const [markDate, setMarkDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceStatus>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // Tab 2 - Attendance History
  const [historyGrade, setHistoryGrade] = useState<GradeLevel | "">("");
  const [historySection, setHistorySection] = useState<string>("");
  const [historyStudentId, setHistoryStudentId] = useState<number>(0);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySortAsc, setHistorySortAsc] = useState(false);

  // Tab 3 - Monthly Report
  const [reportGrade, setReportGrade] = useState<GradeLevel | "">("");
  const [reportSection, setReportSection] = useState<string>("");
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

  // Get unique sections from students in the selected grade
  const getSectionsByGrade = (grade: GradeLevel | ""): string[] => {
    if (!grade) return [];
    const students = getStudentsByGrade(grade);
    const sections = new Set<string>();
    students.forEach((s) => {
      if (s.section) sections.add(s.section);
    });
    return Array.from(sections).sort();
  };

  // Get filtered students based on grade and section
  const getFilteredStudentsByGradeAndSection = (grade: GradeLevel | "", section: string): User[] => {
    const gradeStudents = getStudentsByGrade(grade);
    if (!section) return gradeStudents;
    return gradeStudents.filter((s) => s.section === section);
  };

  // Get the currently displayed students for the mark attendance tab
  const getMarkStudents = (): User[] => {
    return getFilteredStudentsByGradeAndSection(markGrade, markSection);
  };

  // Helper to initialize attendance records for given students
  const initAttendanceRecordsForStudents = (students: User[]) => {
    const newRecords: Record<number, AttendanceStatus> = {};
    students.forEach((s) => {
      newRecords[s.userId] = "Present";
    });
    setAttendanceRecords(newRecords);
    setBulkSuccess("");
    setBulkError("");
    setBulkErrors([]);
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

  // ============ TAB 1: Mark Attendance (Bulk) ============
  const handleBulkMarkAttendance = async () => {
    const students = getMarkStudents();
    if (students.length === 0) {
      setBulkError("No students found for the selected grade and section");
      return;
    }
    if (!markCourseId) {
      setBulkError("Please select a course/section");
      return;
    }

    setBulkSubmitting(true);
    setBulkError("");
    setBulkSuccess("");
    setBulkErrors([]);

    const records = students.map((student) => ({
      student_id: student.userId,
      course_id: markCourseId,
      date: markDate,
      status: attendanceRecords[student.userId] || "Present",
    }));

    try {
      const res = await markBulkAttendance({ records });
      if (res.success) {
        setBulkSuccess(
          `Attendance marked successfully for ${records.length} student(s) in ${markGrade}${markSection ? ` - ${markSection}` : ""} on ${markDate}`
        );
      } else {
        if (res.errors && res.errors.length > 0) {
          setBulkErrors(res.errors);
        } else {
          setBulkError(res.message || "Failed to mark attendance");
        }
      }
    } catch {
      setBulkError("Failed to mark attendance");
    } finally {
      setBulkSubmitting(false);
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

      {/* ==================== TAB 1: Mark Attendance (Bulk) ==================== */}
      {activeTab === "mark" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Mark Attendance - Grade & Section Wise
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
                      setMarkSection("");
                      setMarkCourseId(0);
                      setBulkSuccess("");
                      setBulkError("");
                      setBulkErrors([]);
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

            {markGrade && (
              <>
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Section Select */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">
                      <Filter className="w-3.5 h-3.5 inline mr-1" />
                      Select Section
                    </label>
                  <Select
                      value={markSection}
                      onValueChange={(value) => {
                        setMarkSection(value);
                        setMarkCourseId(0);
                        if (value) {
                          const students = getFilteredStudentsByGradeAndSection(markGrade, value);
                          initAttendanceRecordsForStudents(students);
                        } else {
                          setAttendanceRecords({});
                          setBulkSuccess("");
                          setBulkError("");
                          setBulkErrors([]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSectionsByGrade(markGrade).map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!markSection && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a section to view students
                      </p>
                    )}
                  </div>

                  {/* Course Select */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">
                      <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                      Select Course
                    </label>
                    <Select
                      value={markCourseId ? String(markCourseId) : undefined}
                      onValueChange={(value) => {
                        setMarkCourseId(Number(value));
                        setBulkSuccess("");
                        setBulkError("");
                        setBulkErrors([]);
                      }}
                      disabled={!markSection}
                    >
                      <SelectTrigger className="w-full disabled:opacity-50">
                        <SelectValue placeholder={markSection ? "Select a course" : "Select section first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.courseId} value={String(c.courseId)}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={markDate}
                      onChange={(e) => {
                        setMarkDate(e.target.value);
                        setBulkSuccess("");
                        setBulkError("");
                        setBulkErrors([]);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Student List with Status */}
                {markSection ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5 inline mr-1" />
                        {getMarkStudents().length} student(s) in {markGrade} - {markSection}
                      </p>
                    </div>

                    {getMarkStudents().length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-white/10 mb-6">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                              <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                                #
                              </th>
                              <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                                <Users className="w-3.5 h-3.5 inline mr-1" />
                                Student Name
                              </th>
                              <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                                Email
                              </th>
                              <th className="text-center p-3 text-muted-foreground font-medium text-sm">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getMarkStudents().map((student, index) => (
                              <tr
                                key={student.userId}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              >
                                <td className="p-3 text-white/60 text-sm">{index + 1}</td>
                                <td className="p-3 text-white text-sm font-medium">
                                  {student.name}
                                </td>
                                <td className="p-3 text-white/70 text-sm">
                                  {student.email}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {STATUS_OPTIONS.map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => {
                                          setAttendanceRecords((prev) => ({
                                            ...prev,
                                            [student.userId]: status,
                                          }));
                                          setBulkSuccess("");
                                          setBulkError("");
                                          setBulkErrors([]);
                                        }}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                          attendanceRecords[student.userId] === status
                                            ? `${STATUS_BG[status]} text-white shadow-sm`
                                            : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                                        }`}
                                        title={status}
                                      >
                                        {status === "Present" && <Check className="w-3 h-3" />}
                                        {status === "Absent" && <X className="w-3 h-3" />}
                                        {status === "Late" && <Clock className="w-3 h-3" />}
                                        {status === "Excused" && <AlertCircle className="w-3 h-3" />}
                                        <span className="hidden sm:inline">{status}</span>
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10 mb-6">
                        No students found in {markGrade} - {markSection}
                      </div>
                    )}

                    {/* Save Attendance Button */}
                    {getMarkStudents().length > 0 && (
                      <button
                        onClick={handleBulkMarkAttendance}
                        disabled={bulkSubmitting || !markCourseId}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Save Attendance
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                    Please select a section to view students and mark attendance
                  </div>
                )}
              </>
            )}
          </div>

          {/* Success / Error Feedback */}
          {bulkSuccess && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 font-medium text-sm">Success</p>
                  <p className="text-green-300/80 text-sm mt-0.5">{bulkSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {bulkError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-red-500/20">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">Error</p>
                  <p className="text-red-300/80 text-sm mt-0.5">{bulkError}</p>
                </div>
              </div>
            </div>
          )}

          {bulkErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm mb-1">Validation Errors</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {bulkErrors.map((err, i) => (
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
                      setHistorySection("");
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

            {historyGrade && (
              <div className="flex flex-wrap items-end gap-4 mb-4">
                {/* Section Filter */}
                <div className="w-full md:w-48">
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    <Filter className="w-3.5 h-3.5 inline mr-1" />
                    Filter by Section
                  </label>
                  <Select
                    value={historySection}
                    onValueChange={(value) => {
                      setHistorySection(value);
                      setHistoryStudentId(0);
                      setHistoryRecords([]);
                      setHistoryError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {getSectionsByGrade(historyGrade).map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Select */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Select Student
                  </label>
                  <Select
                    value={historyStudentId ? String(historyStudentId) : undefined}
                    onValueChange={(value) => {
                      setHistoryStudentId(Number(value));
                      setHistoryRecords([]);
                      setHistoryError("");
                    }}
                    disabled={!historyGrade}
                  >
                    <SelectTrigger className="w-full disabled:opacity-50">
                      <SelectValue placeholder={historyGrade ? `Choose student from ${historyGrade}` : "Select a grade first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredStudentsByGradeAndSection(historyGrade, historySection).length > 0 ? (
                        getFilteredStudentsByGradeAndSection(historyGrade, historySection).map((s) => (
                          <SelectItem key={s.userId} value={String(s.userId)}>
                            {s.name} ({s.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No students found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {historyGrade && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getFilteredStudentsByGradeAndSection(historyGrade, historySection).length} student(s)
                      {historySection ? ` in ${historySection}` : ` in ${historyGrade}`}
                    </p>
                  )}
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
            )}

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
                        Section
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
                      setReportSection("");
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

            {reportGrade && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                {/* Section Filter */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    <Filter className="w-3.5 h-3.5 inline mr-1" />
                    Section
                  </label>
                  <Select
                    value={reportSection}
                    onValueChange={(value) => {
                      setReportSection(value);
                      setReportStudentId(0);
                      setReportData(null);
                      setReportError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {getSectionsByGrade(reportGrade).map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Select */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Student
                  </label>
                  <Select
                    value={reportStudentId ? String(reportStudentId) : undefined}
                    onValueChange={(value) => {
                      setReportStudentId(Number(value));
                      setReportData(null);
                      setReportError("");
                    }}
                    disabled={!reportGrade}
                  >
                    <SelectTrigger className="w-full disabled:opacity-50">
                      <SelectValue placeholder={reportGrade ? `Choose student from ${reportGrade}` : "Select a grade first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredStudentsByGradeAndSection(reportGrade, reportSection).length > 0 ? (
                        getFilteredStudentsByGradeAndSection(reportGrade, reportSection).map((s) => (
                          <SelectItem key={s.userId} value={String(s.userId)}>
                            {s.name} ({s.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No students found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {reportGrade && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getFilteredStudentsByGradeAndSection(reportGrade, reportSection).length} student(s)
                      {reportSection ? ` in ${reportSection}` : ` in ${reportGrade}`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Month
                  </label>
                  <Select
                    value={String(reportMonth)}
                    onValueChange={(value) => {
                      setReportMonth(Number(value));
                      setReportData(null);
                      setReportError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
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
            )}

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
                            Section
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
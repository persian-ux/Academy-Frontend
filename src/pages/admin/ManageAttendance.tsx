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
  Download,
} from "lucide-react";
import {
  markBulkAttendance,
  getAttendanceHistory,
  getMonthlyAttendanceReport,
  exportStudentMonthlyAttendanceReport,
  getAttendanceStudents,
  getCourses,
  type AttendanceRecord,
  type AttendanceStudent,
  type CourseData,
  type MonthlyReportData,
} from "@/services/adminService";
import type { GradeLevel } from "@/types/user";
import { Checkbox } from "@/components/Checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type TabId = "mark" | "history" | "report";
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type DailySectionAttendance = { student: AttendanceStudent; record?: AttendanceRecord };

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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Present: <Check className="w-3.5 h-3.5" />,
  Absent: <X className="w-3.5 h-3.5" />,
  Late: <Clock className="w-3.5 h-3.5" />,
  Excused: <AlertCircle className="w-3.5 h-3.5" />,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_COLORS[status as AttendanceStatus] || "text-gray-400 bg-gray-500/10 border-gray-500/30"
      }`}
    >
      {STATUS_ICONS[status]}
      <span className="ml-1">{status}</span>
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
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${color} bg-opacity-10`}>
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
  const [allStudents, setAllStudents] = useState<AttendanceStudent[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [markStudents, setMarkStudents] = useState<AttendanceStudent[]>([]);
  const [markCourseId, setMarkCourseId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Tab 1 - Mark Attendance (Bulk)
  const [markGrade, setMarkGrade] = useState<GradeLevel | "">("");
  const [markSection, setMarkSection] = useState<string>("");
  const [markDate, setMarkDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceStatus>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // Track students who already have attendance marked for the selected date
  const [alreadyMarkedStudents, setAlreadyMarkedStudents] = useState<Set<number>>(new Set());
  const [existingAttendanceMap, setExistingAttendanceMap] = useState<Record<number, AttendanceStatus>>({});
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Tab 2 - Attendance History
  const [historyGrade, setHistoryGrade] = useState<GradeLevel | "">("");
  const [historySection, setHistorySection] = useState<string>("");
  const [historyStudents, setHistoryStudents] = useState<AttendanceStudent[]>([]);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [historyRows, setHistoryRows] = useState<DailySectionAttendance[]>([]);
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
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportError, setExportError] = useState("");

  // Derived: students filtered by selected grade (failsafe for null grade_level)
  const getStudentCourseId = (student: AttendanceStudent) => student.course_id ?? student.courseId ?? null;
  const getStudentSection = (student: AttendanceStudent) => student.section || student.course_name || "";
  const courseMatchesGrade = (course: CourseData, grade: GradeLevel) =>
    new RegExp(`\\b${grade.replace("th", "")}th\\b|\\b${grade.replace("th", "")}\\b`, "i").test(
      `${course.title} ${course.description}`
    );

  const getStudentsByGrade = (grade: GradeLevel | "") => {
    if (!grade) return [];
    return allStudents.filter((s) => !s.grade_level || s.grade_level === grade);
  };

  // Get unique sections from students in the selected grade
  const getSectionsByGrade = (grade: GradeLevel | ""): string[] => {
    if (!grade) return [];
    return courses
      .filter((course) => courseMatchesGrade(course, grade))
      .map((course) => course.title)
      .sort();
  };

  // Get filtered students based on grade and section
  const getFilteredStudentsByGradeAndSection = (grade: GradeLevel | "", section: string): AttendanceStudent[] => {
    const gradeStudents = getStudentsByGrade(grade);
    if (!section) return gradeStudents;
    return gradeStudents.filter((s) => getStudentSection(s) === section);
  };

  // Get the currently displayed students for the mark attendance tab
  const getMarkStudents = (): AttendanceStudent[] => {
    return markStudents;
  };

  // Helper to initialize attendance records for given students
  const initAttendanceRecordsForStudents = (students: AttendanceStudent[]) => {
    const newRecords: Record<number, AttendanceStatus> = {};
    students.forEach((s) => {
      newRecords[s.student_id] = "Present";
    });
    setAttendanceRecords(newRecords);
    setBulkSuccess("");
    setBulkError("");
    setBulkErrors([]);
  };

  // Normalize a date string to YYYY-MM-DD for reliable comparison
  const normalizeDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return dateStr.slice(0, 10);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Check which students already have attendance marked for the given date
  const checkExistingAttendance = async (students: AttendanceStudent[], date: string) => {
    const marked = new Set<number>();
    const statusMap: Record<number, AttendanceStatus> = {};
    await Promise.all(
      students.map(async (student) => {
        const res = await getAttendanceHistory(student.student_id);
        if (res.success && res.data) {
          const existing = res.data.find((record) => normalizeDate(record.date) === date);
          if (existing) {
            marked.add(student.student_id);
            statusMap[student.student_id] = existing.status;
          }
        }
      })
    );
    return { marked, statusMap };
  };

  // Check existing attendance for the currently loaded students on the given date
  const refreshExistingAttendance = async (students: AttendanceStudent[], date: string) => {
    if (!students.length || !date) {
      setAlreadyMarkedStudents(new Set());
      setExistingAttendanceMap({});
      return;
    }
    setCheckingExisting(true);
    try {
      const { marked, statusMap } = await checkExistingAttendance(students, date);
      setAlreadyMarkedStudents(marked);
      setExistingAttendanceMap(statusMap);
    } catch {
      setAlreadyMarkedStudents(new Set());
      setExistingAttendanceMap({});
    } finally {
      setCheckingExisting(false);
    }
  };

  const loadMarkStudents = async (grade: GradeLevel, section: string) => {
    const courseId = courses.find((course) => course.title === section)?.courseId ?? null;

    setMarkCourseId(courseId ?? null);
    if (!courseId) {
      setMarkStudents([]);
      initAttendanceRecordsForStudents([]);
      setAlreadyMarkedStudents(new Set());
      setExistingAttendanceMap({});
      return;
    }

    const response = await getAttendanceStudents(courseId);
    if (response.success) {
      const sectionStudents = response.data.filter(
        (student) => getStudentCourseId(student) === courseId && student.grade_level === grade
      );
      setMarkStudents(sectionStudents);
      initAttendanceRecordsForStudents(sectionStudents);
      // Check if any of these students already have attendance marked for the selected date
      void refreshExistingAttendance(sectionStudents, markDate);
    } else {
      setMarkStudents([]);
      setBulkError(response.message || "Failed to load students for this course.");
    }
  };

  const loadHistoryStudents = async (grade: GradeLevel, section: string, date: string) => {
    const courseId = courses.find((course) => course.title === section)?.courseId;
    if (!courseId) {
      setHistoryStudents([]);
      setHistoryRows([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    const response = await getAttendanceStudents(courseId);
    if (response.success) {
      const students = response.data.filter(
        (student) => getStudentCourseId(student) === courseId && student.grade_level === grade
      );
      setHistoryStudents(students);
      const histories = await Promise.all(students.map((student) => getAttendanceHistory(student.student_id)));
      setHistoryRows(
        students.map((student, index) => ({
          student,
          record: histories[index].data?.find(
            (record) => {
              const storedDate = record.date.slice(0, 10);
              const local = new Date(record.date);
              const localDate = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
              return storedDate === date || localDate === date;
            }
          ),
        }))
      );
    } else {
      setHistoryStudents([]);
      setHistoryRows([]);
      setHistoryError(response.message || "Failed to load students for this section.");
    }
    setHistoryLoading(false);
  };

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [studentsRes, coursesRes] = await Promise.all([getAttendanceStudents(), getCourses()]);
        if (cancelled) return;
        if (coursesRes.success) setCourses(coursesRes.courses);
        if (studentsRes.success) {
          setAllStudents(studentsRes.data);
        }
      } catch {
        if (!cancelled) setGlobalError("Failed to load data. Make sure the server is running.");
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
      setBulkError("The selected section is not assigned to a course.");
      return;
    }

    // Prevent re-marking attendance for students who already have it marked on this date
    const alreadyMarked = students.filter((s) => alreadyMarkedStudents.has(s.student_id));
    if (alreadyMarked.length > 0) {
      const markedNames = alreadyMarked.map((s) => s.name).join(", ");
      setBulkError(
        `Attendance is already marked for the following student(s) on ${markDate}: ${markedNames}. ` +
        "Please select a different date or use the History tab to view/edit existing records."
      );
      return;
    }

    setBulkSubmitting(true);
    setBulkError("");
    setBulkSuccess("");
    setBulkErrors([]);

    const records = students.map((student) => ({
      student_id: student.student_id,
      course_id: markCourseId,
      date: markDate,
      status: attendanceRecords[student.student_id] || "Present",
    }));

    try {
      const res = await markBulkAttendance({ records });
      if (res.success) {
        setBulkSuccess(
          `Attendance saved successfully for ${records.length} student(s) in ${markGrade}${markSection ? ` - ${markSection}` : ""} on ${markDate}`
        );
        // Clear the already-marked tracking after successful save
        setAlreadyMarkedStudents(new Set());
        setExistingAttendanceMap({});
      } else {
        if (res.errors && res.errors.length > 0) {
          setBulkErrors(res.errors);
        } else {
          setBulkError(res.message || "Failed to save attendance. Please try again.");
        }
      }
    } catch {
      setBulkError("Failed to save attendance. Please try again.");
    } finally {
      setBulkSubmitting(false);
    }
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

  const handleExportCsv = async () => {
    if (!reportStudentId || !reportData) return;
    setExportingCsv(true);
    setExportError("");
    try {
      const res = await exportStudentMonthlyAttendanceReport({
        studentId: reportStudentId,
        month: reportMonth,
        year: reportYear,
      });
      if (res.success && res.blob) {
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename || `student-attendance-${reportStudentId}-${reportYear}-${String(reportMonth).padStart(2, "0")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setExportError(res.message || "Failed to export CSV.");
      }
    } catch {
      setExportError("Failed to export CSV.");
    } finally {
      setExportingCsv(false);
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
          Mark attendance, view history, and generate reports
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
              Mark Attendance
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
                      setMarkStudents([]);
                      setMarkCourseId(null);
                      setAttendanceRecords({});
                      setBulkSuccess("");
                      setBulkError("");
                      setBulkErrors([]);
                      setAlreadyMarkedStudents(new Set());
                      setExistingAttendanceMap({});
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Section Select */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">
                      <Filter className="w-3.5 h-3.5 inline mr-1" />
                      Select Section
                    </label>
                    {getSectionsByGrade(markGrade).length > 0 ? (
                      <Select
                        value={markSection}
                        onValueChange={(value) => {
                          setMarkSection(value);
                          if (value) {
                            void loadMarkStudents(markGrade, value);
                          } else {
                            setMarkStudents([]);
                            setMarkCourseId(null);
                            setAttendanceRecords({});
                            setBulkSuccess("");
                            setBulkError("");
                            setBulkErrors([]);
                            setAlreadyMarkedStudents(new Set());
                            setExistingAttendanceMap({});
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
                    ) : (
                      <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm">
                        No sections available
                      </div>
                    )}
                    {!markSection && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a section to view students
                      </p>
                    )}
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
                        // Re-check existing attendance for the new date
                        if (markStudents.length > 0) {
                          void refreshExistingAttendance(markStudents, e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Warning banner: students already have attendance marked for the selected date */}
                {alreadyMarkedStudents.size > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-amber-500/20">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-amber-400 font-medium text-sm">Attendance Already Marked</p>
                        <p className="text-amber-300/80 text-sm mt-0.5">
                          {alreadyMarkedStudents.size} student(s) already have attendance marked for {markDate}.
                          These students will be skipped when saving. Select a different date to mark them.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student List with Status */}
                {markSection ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5 inline mr-1" />
                        {getMarkStudents().length} student(s) in {markGrade} - {markSection}
                        {checkingExisting && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-muted-foreground" />
                        )}
                      </p>
                    </div>

                    {getMarkStudents().length > 0 ? (
                      <div className="space-y-4">
                        {/* Student Table - Name | Class/Section | Present | Absent | Late | Excused */}
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10">
                                <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                                  <Users className="w-3.5 h-3.5 inline mr-1" />
                                  Student Name
                                </th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                                  <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
                                  Class / Section
                                </th>
                                {STATUS_OPTIONS.map((status) => (
                                  <th key={status} className="text-center p-3 text-muted-foreground font-medium text-sm min-w-22.5">
                                    <div className="flex items-center justify-center gap-1">
                                      {STATUS_ICONS[status]}
                                      <span>{status}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {getMarkStudents().map((student) => {
                                const currentStatus = attendanceRecords[student.student_id] || "Present";
                                const isAlreadyMarked = alreadyMarkedStudents.has(student.student_id);
                                const existingStatus = existingAttendanceMap[student.student_id];
                                return (
                                  <tr
                                    key={student.student_id}
                                    className={`border-b border-white/5 transition-colors ${
                                      isAlreadyMarked ? "bg-amber-500/5" : "hover:bg-white/5"
                                    }`}
                                  >
                                    {/* Left: Student Name */}
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-white text-sm font-medium">
                                          {student.name}
                                        </span>
                                        {isAlreadyMarked && (
                                          <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.25 rounded">
                                            Already marked
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Middle: Class / Section */}
                                    <td className="p-3">
                                      <span className="text-sm text-muted-foreground">
                                        {student.grade_level || markGrade}
                                        {student.section ? ` - ${student.section}` : ""}
                                      </span>
                                      {isAlreadyMarked && existingStatus && (
                                        <div className="mt-1">
                                          <StatusBadge status={existingStatus} />
                                        </div>
                                      )}
                                    </td>

                                    {/* Status checkboxes - only one can be checked per row */}
                                    {STATUS_OPTIONS.map((status) => {
                                      const isActive = currentStatus === status;
                                      return (
                                        <td key={status} className="p-3 text-center">
                                          <div className="flex justify-center">
                                            <Checkbox
                                              checked={isActive}
                                              onChange={() => {
                                                setAttendanceRecords((prev) => ({
                                                  ...prev,
                                                  [student.student_id]: status,
                                                }));
                                                setBulkSuccess("");
                                                setBulkError("");
                                                setBulkErrors([]);
                                              }}
                                              size="sm"
                                              disabled={isAlreadyMarked}
                                            />
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Save Attendance Button */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={handleBulkMarkAttendance}
                            disabled={bulkSubmitting || alreadyMarkedStudents.size === getMarkStudents().length}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Save className="w-4 h-4" />
                            Save Attendance
                          </button>
                          {alreadyMarkedStudents.size > 0 && alreadyMarkedStudents.size < getMarkStudents().length && (
                            <p className="text-xs text-muted-foreground">
                              {getMarkStudents().length - alreadyMarkedStudents.size} student(s) will be marked;{" "}
                              {alreadyMarkedStudents.size} already have attendance for this date.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10 mb-6">
                        No students found in {markGrade} - {markSection}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                    {getSectionsByGrade(markGrade).length === 0 ? (
                      <p>No sections found for {markGrade}. Please ensure students have a section assigned.</p>
                    ) : (
                      <p>Please select a section to view students and mark attendance</p>
                    )}
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
              Attendance History
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
                      setHistoryStudents([]);
                      setHistoryRows([]);
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
                      setHistoryRows([]);
                      setHistoryError("");
                      if (value) {
                        void loadHistoryStudents(historyGrade, value, historyDate);
                      } else {
                        setHistoryStudents([]);
                      }
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

                <div className="flex-1 min-w-50">
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(event) => {
                      const date = event.target.value;
                      setHistoryDate(date);
                      if (historyGrade && historySection) {
                        void loadHistoryStudents(historyGrade, historySection, date);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                  {historySection && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {historyStudents.length} student(s) in {historySection}
                    </p>
                  )}
                </div>
              </div>
            )}

            {historyError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {historyError}
              </div>
            )}
          </div>

          {/* History Table */}
          {historyRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                      Student
                    </th>
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
                  {historyRows.map(({ student, record }) => (
                    <tr
                      key={student.student_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-white text-sm">{student.name}</td>
                      <td className="p-4 text-white text-sm">{record?.date ? record.date.slice(0, 10) : historyDate}</td>
                      <td className="p-4 text-white text-sm">
                        {historySection}
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={record?.status || "Not marked"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {historySection && !historyLoading && historyRows.length === 0 && !historyError && (
            <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
              No students found in this section.
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
              Monthly Attendance Report
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
                          <SelectItem key={s.student_id} value={String(s.student_id)}>
                            {s.name}
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
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-white font-medium">
                  Report for {reportData.student_name} ({reportGrade}) - {reportData.month} {reportData.year}
                </p>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {exportingCsv ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export CSV
                  </button>
                  {exportError && (
                    <p className="text-xs text-red-400">{exportError}</p>
                  )}
                </div>
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

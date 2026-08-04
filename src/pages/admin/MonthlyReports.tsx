import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  User,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Percent,
  BookOpen,
  Trophy,
  FileText,
  Phone,
  GraduationCap,
  X,
  Download,
  IdCard,
  MapPin,
} from "lucide-react";
import { getStudents } from "@/services/studentService";
import {
  getMonthlyAttendanceReport,
  getAttendanceHistory,
  type MonthlyReportData,
  type AttendanceRecord,
} from "@/services/adminService";
import { getMarksByStudent } from "@/services/markService";
import type { Student } from "@/types/student";
import type { Mark } from "@/types/mark";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MONTHS = [
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
        ATTENDANCE_COLORS[status as AttendanceStatus] ||
        "text-gray-400 bg-gray-500/10 border-gray-500/30"
      }`}
    >
      {ATTENDANCE_ICONS[status]}
      <span className="ml-1">{status}</span>
    </span>
  );
}

function getPercentColor(percentage: number) {
  if (percentage >= 80) return "text-green-400";
  if (percentage >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getPercentBg(percentage: number) {
  if (percentage >= 80) return "bg-green-500/10 border-green-500/30";
  if (percentage >= 60) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function getGrade(percentage: number) {
  if (percentage >= 90) return { grade: "A+", color: "text-green-400" };
  if (percentage >= 80) return { grade: "A", color: "text-green-400" };
  if (percentage >= 70) return { grade: "B", color: "text-blue-400" };
  if (percentage >= 60) return { grade: "C", color: "text-yellow-400" };
  if (percentage >= 50) return { grade: "D", color: "text-orange-400" };
  return { grade: "F", color: "text-red-400" };
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="p-2 rounded-lg bg-white/5 text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-white font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClassName = "text-white",
  iconClassName = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <span className={iconClassName}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function MonthlyReports() {
  // ===== Student search state =====
  const [searchTerm, setSearchTerm] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // ===== Month / Year state =====
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // ===== Report data state =====
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [allMarks, setAllMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ===== Debounced student search =====
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setStudentResults([]);
        setDropdownOpen(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await getStudents({ search: searchTerm.trim(), limit: 20 });
        if (res.success) {
          setStudentResults(res.data);
          setDropdownOpen(true);
        } else {
          setStudentResults([]);
        }
      } catch {
        setStudentResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ===== Load monthly report + marks when student / month / year changes =====
  useEffect(() => {
    if (!selectedStudent) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setMonthlyReport(null);
      setAttendanceHistory([]);
      setAllMarks([]);

      const month = Number(selectedMonth);
      const year = Number(selectedYear);

      const [attendanceRes, historyRes, marksRes] = await Promise.all([
        getMonthlyAttendanceReport({ studentId: selectedStudent.id, month, year }),
        getAttendanceHistory(selectedStudent.id),
        getMarksByStudent(selectedStudent.id),
      ]);

      if (cancelled) return;

      // Monthly attendance report (preferred source for summary)
      if (attendanceRes.success && attendanceRes.data) {
        setMonthlyReport(attendanceRes.data);
      }

      // Attendance history (fallback for computing monthly summary client-side)
      if (historyRes.success && historyRes.data) {
        setAttendanceHistory(historyRes.data);
      }

      // All marks (filtered by month below)
      if (marksRes.success) {
        setAllMarks(Array.isArray(marksRes.data) ? marksRes.data : []);
      }

      // If both the report and history failed, show an error
      if (!(attendanceRes.success && attendanceRes.data) && !(historyRes.success && historyRes.data)) {
        setError("Failed to load monthly attendance report");
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedStudent, selectedMonth, selectedYear]);

  // ===== Derived: effective monthly report =====
  // Use the dedicated monthly report when available; otherwise compute from history.
  const effectiveMonthlyReport = useMemo((): MonthlyReportData | null => {
    if (monthlyReport) return monthlyReport;

    if (attendanceHistory.length === 0 || !selectedStudent) return null;

    const month = Number(selectedMonth);
    const year = Number(selectedYear);

    const details = attendanceHistory.filter((rec) => {
      const d = new Date(rec.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    if (details.length === 0) return null;

    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    details.forEach((rec) => {
      summary.total++;
      if (rec.status === "Present") summary.present++;
      else if (rec.status === "Absent") summary.absent++;
      else if (rec.status === "Late") summary.late++;
      else if (rec.status === "Excused") summary.excused++;
    });

    return {
      student_id: selectedStudent.id,
      student_name: selectedStudent.name,
      month: MONTHS[month - 1],
      year,
      summary,
      details,
    };
  }, [monthlyReport, attendanceHistory, selectedStudent, selectedMonth, selectedYear]);

  // ===== Derived: attendance stats =====
  const attendanceStats = useMemo(() => {
    if (!effectiveMonthlyReport) return null;
    const s = effectiveMonthlyReport.summary;
    const attended = s.present + s.late; // Late students did attend class
    const missed = s.absent;
    const leave = s.excused;
    const percentage = s.total > 0 ? (attended / s.total) * 100 : 0;
    return { ...s, attended, missed, leave, percentage };
  }, [effectiveMonthlyReport]);

  // ===== Derived: monthly test marks =====
  const monthlyTestMarks = useMemo(() => {
    const month = Number(selectedMonth);
    const year = Number(selectedYear);
    return allMarks
      .filter((m) => {
        const d = new Date(m.test_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
  }, [allMarks, selectedMonth, selectedYear]);

  const testStats = useMemo(() => {
    if (monthlyTestMarks.length === 0) return null;
    const obtained = monthlyTestMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const total = monthlyTestMarks.reduce((sum, m) => sum + m.total_marks, 0);
    const percentage = total > 0 ? (obtained / total) * 100 : 0;
    return { obtained, total, percentage };
  }, [monthlyTestMarks]);

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { obtained: number; total: number; tests: number }>();
    monthlyTestMarks.forEach((m) => {
      const key = m.test_subject || "General";
      const current = map.get(key) || { obtained: 0, total: 0, tests: 0 };
      current.obtained += m.marks_obtained;
      current.total += m.total_marks;
      current.tests += 1;
      map.set(key, current);
    });
    return Array.from(map.entries())
      .map(([subject, data]) => ({
        subject,
        ...data,
        percentage: data.total > 0 ? (data.obtained / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [monthlyTestMarks]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setMonthlyReport(null);
    setAttendanceHistory([]);
    setAllMarks([]);
    setError("");
  };

  const getMonthName = (m: string) => MONTHS[Number(m) - 1] || m;

  const handleExportFullReport = () => {
    if (!selectedStudent) return;
    const monthName = getMonthName(selectedMonth);
    const rows: string[][] = [];

    // ===== Student Academic Details =====
    rows.push(["MONTHLY STUDENT REPORT"]);
    rows.push(["Generated", new Date().toLocaleString()]);
    rows.push([]);
    rows.push(["ACADEMIC DETAILS"]);
    rows.push(["Student Name", selectedStudent.name]);
    rows.push(["Roll No", selectedStudent.roll_no ?? ""]);
    rows.push(["Grade Level", selectedStudent.grade_level ?? ""]);
    rows.push(["Section / Course", selectedStudent.course_name ?? ""]);
    rows.push(["Father Name", selectedStudent.father_name ?? ""]);
    rows.push(["Phone", selectedStudent.phone ?? ""]);
    rows.push(["Address", selectedStudent.address ?? ""]);
    rows.push([]);

    // ===== Attendance Summary =====
    rows.push(["ATTENDANCE SUMMARY"]);
    if (effectiveMonthlyReport) {
      rows.push(["Month", `${effectiveMonthlyReport.month} ${effectiveMonthlyReport.year}`]);
      rows.push(["Total Classes", String(effectiveMonthlyReport.summary.total)]);
      rows.push(["Attended", String(effectiveMonthlyReport.summary.present + effectiveMonthlyReport.summary.late)]);
      rows.push(["Missed", String(effectiveMonthlyReport.summary.absent)]);
      rows.push(["Leave Days", String(effectiveMonthlyReport.summary.excused)]);
      rows.push(["Attendance %", `${attendanceStats ? attendanceStats.percentage.toFixed(1) : "0.0"}%`]);
      rows.push([]);
      rows.push(["Date", "Section", "Status"]);
      effectiveMonthlyReport.details.forEach((record) => {
        rows.push([record.date.split("T")[0], record.course_name, record.status]);
      });
    } else {
      rows.push(["No attendance data available"]);
    }
    rows.push([]);

    // ===== Leave Details =====
    rows.push(["LEAVE DETAILS"]);
    if (attendanceStats && attendanceStats.leave > 0) {
      rows.push(["Official Leave Days", String(attendanceStats.leave)]);
    } else {
      rows.push(["No official leave records"]);
    }
    rows.push([]);

    // ===== Test Performance =====
    rows.push(["TEST PERFORMANCE"]);
    if (monthlyTestMarks.length > 0) {
      rows.push(["Overall Percentage", `${testStats ? testStats.percentage.toFixed(1) : "0.0"}%`]);
      rows.push(["Total Marks", `${testStats ? testStats.obtained : 0} / ${testStats ? testStats.total : 0}`]);
      rows.push(["Tests Taken", String(monthlyTestMarks.length)]);
      rows.push(["Monthly Grade", testStats ? getGrade(testStats.percentage).grade : "N/A"]);
      rows.push([]);
      rows.push(["Test", "Subject", "Date", "Marks Obtained", "Total Marks", "Percentage", "Grade"]);
      monthlyTestMarks.forEach((m) => {
        const percentage = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
        rows.push([
          m.test_title,
          m.test_subject,
          m.test_date.split("T")[0],
          String(m.marks_obtained),
          String(m.total_marks),
          `${percentage.toFixed(1)}%`,
          getGrade(percentage).grade,
        ]);
      });
    } else {
      rows.push(["No tests taken in this month"]);
    }

    const csv = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-report-${selectedStudent.name.replace(/\s+/g, "-")}-${monthName}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Monthly Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Search for a student to view their complete monthly report
          </p>
        </div>
        {selectedStudent && !loading && (
          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        )}
      </div>

      {/* ==================== STUDENT SEARCH BAR ==================== */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        {!selectedStudent ? (
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (studentResults.length > 0) setDropdownOpen(true);
                }}
                placeholder="Search student by name..."
                className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-10 py-3 text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
            </div>

            {dropdownOpen && studentResults.length > 0 && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl overflow-hidden">
                {studentResults.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 text-primary font-semibold text-sm shrink-0">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.roll_no ? `Roll No: ${student.roll_no} • ` : ""}
                        {student.course_name || student.grade_level || "Student"}
                      </p>
                    </div>
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {dropdownOpen && searchTerm.trim() && !searchLoading && studentResults.length === 0 && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No students found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Selected student chip */
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-semibold">
                {selectedStudent.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{selectedStudent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedStudent.roll_no ? `Roll No: ${selectedStudent.roll_no} • ` : ""}
                  {selectedStudent.course_name || selectedStudent.grade_level || "Student"} • ID: {selectedStudent.id}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearStudent}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
            >
              <X className="w-4 h-4" />
              Change Student
            </button>
          </div>
        )}
      </div>

      {/* ==================== MONTH / YEAR SELECTOR ==================== */}
      {selectedStudent && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Report Period:</span>
            </div>
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, idx) => (
                  <SelectItem key={idx} value={String(idx + 1).padStart(2, "0")}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground ml-auto">
              {getMonthName(selectedMonth)} {selectedYear} Report
            </div>
          </div>
        </div>
      )}

      {/* ==================== EMPTY STATE ==================== */}
      {!selectedStudent && (
        <div className="flex flex-col items-center justify-center h-72 rounded-xl border border-dashed border-white/10">
          <div className="p-4 rounded-full bg-white/5 mb-4">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Search for a Student</h3>
          <p className="text-sm text-muted-foreground max-w-md text-center px-4">
            Use the search bar above to find a student by name. Once selected, their complete
            monthly report will appear here.
          </p>
        </div>
      )}

      {/* ==================== REPORT CONTENT ==================== */}
      {selectedStudent && loading && (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {selectedStudent && !loading && error && !effectiveMonthlyReport && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {selectedStudent && !loading && (
        <div className="space-y-6 animate-fade-in-up">
          {/* ===== Student Academic Details ===== */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Academic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoRow icon={<IdCard className="w-4 h-4" />} label="Roll No" value={selectedStudent.roll_no} />
              <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Grade Level" value={selectedStudent.grade_level} />
              <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Section / Course" value={selectedStudent.course_name} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Father Name" value={selectedStudent.father_name} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedStudent.phone} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={selectedStudent.address} />
            </div>
          </div>

          {/* ===== Attendance Summary ===== */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Attendance Summary
              </h3>
            </div>

            {attendanceStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <StatCard
                    icon={<Calendar className="w-4 h-4" />}
                    label="Total Classes"
                    value={attendanceStats.total}
                    iconClassName="text-primary"
                  />
                  <StatCard
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Attended"
                    value={attendanceStats.attended}
                    valueClassName="text-green-400"
                    iconClassName="text-green-400"
                  />
                  <StatCard
                    icon={<XCircle className="w-4 h-4" />}
                    label="Missed"
                    value={attendanceStats.missed}
                    valueClassName="text-red-400"
                    iconClassName="text-red-400"
                  />
                  <StatCard
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Leave Days"
                    value={attendanceStats.leave}
                    valueClassName="text-blue-400"
                    iconClassName="text-blue-400"
                  />
                  <StatCard
                    icon={<Percent className="w-4 h-4" />}
                    label="Attendance %"
                    value={`${attendanceStats.percentage.toFixed(1)}%`}
                    valueClassName={getPercentColor(attendanceStats.percentage)}
                    iconClassName="text-primary"
                  />
                </div>

                {/* Attendance detail table */}
                {effectiveMonthlyReport && effectiveMonthlyReport.details.length > 0 ? (
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
                        {effectiveMonthlyReport.details.map((record) => (
                          <tr key={record.attendance_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white text-sm">{record.date.split("T")[0]}</td>
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
                    No attendance records for {getMonthName(selectedMonth)} {selectedYear}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                No attendance data available for {getMonthName(selectedMonth)} {selectedYear}
              </div>
            )}
          </div>

          {/* ===== Leave Details ===== */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Leave Details
            </h3>
            {attendanceStats && attendanceStats.leave > 0 ? (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/20">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {attendanceStats.leave} official leave day{attendanceStats.leave !== 1 ? "s" : ""} taken
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Excused absences during {getMonthName(selectedMonth)} {selectedYear}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground">
                  No official leave records for {getMonthName(selectedMonth)} {selectedYear}
                </p>
              </div>
            )}
          </div>

          {/* ===== Test Performance ===== */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Test Performance — {getMonthName(selectedMonth)} {selectedYear}
              </h3>
            </div>

            {monthlyTestMarks.length > 0 ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <StatCard
                    icon={<Trophy className="w-4 h-4" />}
                    label="Overall Percentage"
                    value={`${testStats?.percentage.toFixed(1) ?? "0.0"}%`}
                    valueClassName={getPercentColor(testStats?.percentage ?? 0)}
                  />
                  <StatCard
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Total Marks"
                    value={`${testStats?.obtained ?? 0} / ${testStats?.total ?? 0}`}
                  />
                  <StatCard
                    icon={<FileText className="w-4 h-4" />}
                    label="Tests Taken"
                    value={monthlyTestMarks.length}
                  />
                </div>

                {/* Grade */}
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Grade</p>
                      <span
                        className={`text-3xl font-bold ${
                          testStats ? getGrade(testStats.percentage).color : "text-muted-foreground"
                        }`}
                      >
                        {testStats ? getGrade(testStats.percentage).grade : "N/A"}
                      </span>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-2">Subject Performance Breakdown</p>
                      <div className="space-y-2">
                        {subjectBreakdown.map((subject) => (
                          <div key={subject.subject} className="flex items-center gap-3">
                            <span className="text-sm text-white w-40 truncate">{subject.subject}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${subject.percentage}%`,
                                  backgroundColor:
                                    subject.percentage >= 80
                                      ? "#22c55e"
                                      : subject.percentage >= 60
                                        ? "#eab308"
                                        : "#ef4444",
                                }}
                              />
                            </div>
                            <span className={`text-sm font-medium w-16 text-right ${getPercentColor(subject.percentage)}`}>
                              {subject.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tests table */}
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="text-left p-4 text-muted-foreground font-medium text-sm">Test</th>
                        <th className="text-left p-4 text-muted-foreground font-medium text-sm">Subject</th>
                        <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                        <th className="text-center p-4 text-muted-foreground font-medium text-sm">Score</th>
                        <th className="text-center p-4 text-muted-foreground font-medium text-sm">Percentage</th>
                        <th className="text-center p-4 text-muted-foreground font-medium text-sm">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyTestMarks.map((mark) => {
                        const percentage = mark.total_marks > 0 ? (mark.marks_obtained / mark.total_marks) * 100 : 0;
                        const grade = getGrade(percentage);
                        return (
                          <tr key={mark.mark_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white text-sm font-medium">{mark.test_title}</td>
                            <td className="p-4 text-muted-foreground text-sm">{mark.test_subject}</td>
                            <td className="p-4 text-muted-foreground text-sm">{mark.test_date.split("T")[0]}</td>
                            <td className="p-4 text-white text-sm text-center">
                              {mark.marks_obtained} / {mark.total_marks}
                            </td>
                            <td className="p-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPercentBg(percentage)} ${getPercentColor(percentage)}`}
                              >
                                {percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className={`p-4 text-center text-sm font-semibold ${grade.color}`}>
                              {grade.grade}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
                No tests taken in {getMonthName(selectedMonth)} {selectedYear}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
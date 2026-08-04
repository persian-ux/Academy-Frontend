import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, Users, CircleCheckBig, CircleAlert, CircleOff, CalendarDays, FileText } from "lucide-react";
import {
  exportTeacherAttendanceReport,
  getTeacherAttendanceOverview,
  getTeacherAttendanceReport,
  type TeacherAttendanceOverview,
  type TeacherAttendanceRecord,
  type TeacherAttendanceReport,
} from "@/services/teacherAttendanceService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

function toYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => currentYear - 2 + index).sort((a, b) => b - a);
}

function normalizeOverview(data?: TeacherAttendanceOverview | null) {
  return {
    present: data?.present_count ?? data?.presentCount ?? 0,
    leave: data?.leave_count ?? data?.leaveCount ?? 0,
    absent: data?.absent_count ?? data?.absentCount ?? 0,
    totalTeachers: data?.total_teachers ?? data?.totalTeachers ?? 0,
  };
}

function normalizeRecords(report?: TeacherAttendanceReport | TeacherAttendanceRecord[] | null) {
  if (!report) return [] as TeacherAttendanceRecord[];
  if (Array.isArray(report)) return report;
  return report.records ?? report.data ?? report.rows ?? [];
}

function statusClasses(status: string) {
  if (status === "Present") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "Leave") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-rose-500/10 text-rose-400 border-rose-500/20";
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-primary">{icon}</div>
      </div>
    </div>
  );
}

export default function TeacherAttendanceDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [overview, setOverview] = useState<TeacherAttendanceOverview | null>(null);
  const [report, setReport] = useState<TeacherAttendanceReport | TeacherAttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const loadData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [overviewResponse, reportResponse] = await Promise.all([
        getTeacherAttendanceOverview({ month: monthNumber, year: yearNumber }),
        getTeacherAttendanceReport({ month: monthNumber, year: yearNumber }),
      ]);

      if (overviewResponse.success) {
        setOverview(overviewResponse.data ?? null);
      } else {
        setOverview(null);
        setError(overviewResponse.message || "Failed to load attendance overview");
      }

      if (reportResponse.success) {
        setReport(reportResponse.data ?? null);
      } else {
        setReport(null);
        setError((current) => current || reportResponse.message || "Failed to load attendance report");
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Failed to load teacher attendance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [monthNumber, yearNumber]);

  useEffect(() => {
    void loadData(false);

    const intervalId = window.setInterval(() => {
      void loadData(true);
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const overviewData = normalizeOverview(overview);
  const records = normalizeRecords(report);
  const uniqueTeachers = useMemo(() => {
    if (overviewData.totalTeachers > 0) return overviewData.totalTeachers;
    return new Set(records.map((record) => record.teacher_name || record.teacherName || "Teacher")).size;
  }, [overviewData.totalTeachers, records]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const response = await exportTeacherAttendanceReport({ month: monthNumber, year: yearNumber });
      if (!response.success || !response.blob) {
        setError(response.message || "Failed to export CSV");
        return;
      }

      const url = window.URL.createObjectURL(response.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.filename || `teacher-attendance-${year}-${month}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const monthLabel = MONTHS[monthNumber - 1] || "Selected month";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Teacher Attendance Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly attendance overview, detailed records, and CSV export for {monthLabel} {year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 w-36 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 w-28 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {toYearOptions().map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => void loadData(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Present" value={overviewData.present} icon={<CircleCheckBig className="h-5 w-5" />} />
        <SummaryCard label="Leave" value={overviewData.leave} icon={<CircleAlert className="h-5 w-5" />} />
        <SummaryCard label="Absent" value={overviewData.absent} icon={<CircleOff className="h-5 w-5" />} />
        <SummaryCard label="Total teachers" value={uniqueTeachers} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card shadow-xl shadow-black/10">
        <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Monthly records</h2>
            <p className="text-sm text-muted-foreground">
              {lastUpdated ? `Last refreshed ${lastUpdated}` : "Waiting for the first refresh"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {records.length} record{records.length === 1 ? "" : "s"}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-white">No attendance records found</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              There are no teacher attendance entries for the selected month and year.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teacher name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leave reason</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Auto-marked</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marked time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {records.map((record, index) => (
                  <tr key={`${record.teacher_name || record.teacherName || "teacher"}-${record.attendance_date || index}`} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-sm text-white">{record.teacher_name || record.teacherName || "Teacher"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{record.attendance_date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{record.leave_reason || "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{record.auto_marked ?? record.auto_marked_flag ? "Yes" : "No"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {record.marked_at ? new Date(record.marked_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Loader2, Download, Calendar } from "lucide-react";
import { getMonthlyReports, type StudentReport } from "@/services/adminService";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthlyReports() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getMonthlyReports({ month: selectedMonth, year: Number(selectedYear) });
        if (cancelled) return;
        if (res.success) setReports(res.reports);
      } catch {
        if (!cancelled) setError("Failed to load monthly reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadReports();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear]);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: "text-green-400",
      B: "text-blue-400",
      C: "text-yellow-400",
      D: "text-orange-400",
      F: "text-red-400",
    };
    return colors[grade] || "text-muted-foreground";
  };

  const getMonthName = (m: string) => MONTHS[Number(m) - 1] || m;

  const handleExport = () => {
    const monthName = getMonthName(selectedMonth);
    const headers = ["Student", "Course", "Classes", "Attended", "Attendance %", "Test Score", "Total Marks", "Grade"];
    const rows = reports.map((r) => [r.studentName, r.courseName, r.totalClasses, r.attendedClasses, r.attendancePercentage.toFixed(1) + "%", r.testScore, r.totalMarks, r.grade]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${monthName}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Monthly Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">Generate and view monthly performance reports</p>
        </div>
        {reports.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Month:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          >
            {MONTHS.map((name, idx) => (
              <option key={idx} value={String(idx + 1).padStart(2, "0")}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground ml-auto">
            {getMonthName(selectedMonth)} {selectedYear} Report
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-muted-foreground">Average Attendance</p>
              <p className="text-2xl font-bold text-primary">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + r.attendancePercentage, 0) / reports.length).toFixed(1) + "%"
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-primary">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + (r.testScore / r.totalMarks) * 100, 0) / reports.length).toFixed(1) + "%"
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Student</th>
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Course</th>
                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Classes</th>
                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Attended</th>
                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Attendance %</th>
                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Score</th>
                  <th className="text-center p-4 text-muted-foreground font-medium text-sm">Grade</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white text-sm">{r.studentName}</td>
                    <td className="p-4 text-muted-foreground text-sm">{r.courseName}</td>
                    <td className="p-4 text-white text-sm text-center">{r.totalClasses}</td>
                    <td className="p-4 text-white text-sm text-center">{r.attendedClasses}</td>
                    <td className="p-4 text-sm text-center">
                      <span className={r.attendancePercentage >= 75 ? "text-green-400" : "text-red-400"}>
                        {r.attendancePercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-white text-sm text-center">{r.testScore}/{r.totalMarks}</td>
                    <td className="p-4 text-sm text-center font-semibold">
                      <span className={getGradeColor(r.grade)}>{r.grade}</span>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No reports for {getMonthName(selectedMonth)} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
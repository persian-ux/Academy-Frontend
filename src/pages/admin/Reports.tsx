import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import { getReports, getCourses, type StudentReport, type CourseData } from "@/services/adminService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Reports() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [error, setError] = useState("");

  const selectedCourseTitle = courses.find((c) => c.courseId === selectedCourse)?.title || "";

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [reportsRes, coursesRes] = await Promise.all([
          getReports(
            selectedCourse
              ? {
                  courseId: selectedCourse,
                  courseTitle: selectedCourseTitle,
                }
              : undefined
          ),
          getCourses(),
        ]);
        if (cancelled) return;
        if (reportsRes.success) setReports(reportsRes.reports);
        if (coursesRes.success) setCourses(coursesRes.courses);
      } catch {
        if (!cancelled) setError("Failed to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [selectedCourse, selectedCourseTitle]);

  const getTestPercentage = (r: StudentReport) => {
    if (r.totalMarks <= 0) return 0;
    return (r.testScore / r.totalMarks) * 100;
  };

  const handleExport = () => {
    const headers = ["Student", "Class", "Section", "Attendance %", "Test Performance %"];
    const rows = reports.map((r) => [
      r.studentName,
      r.grade_level ?? "",
      r.courseName,
      r.attendancePercentage.toFixed(1) + "%",
      getTestPercentage(r).toFixed(1) + "%",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">Student performance and attendance reports</p>
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
        <label className="block text-sm text-muted-foreground mb-1">Filter by Section</label>
        <Select
          value={String(selectedCourse)}
          onValueChange={(value) => setSelectedCourse(Number(value))}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Sections</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.courseId} value={String(c.courseId)}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedCourse === 0
            ? "Showing all students sorted by grade level (ascending)."
            : `Showing students in ${selectedCourseTitle} with complete details.`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Student</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Class</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Section</th>
                <th className="text-center p-4 text-muted-foreground font-medium text-sm">Attendance %</th>
                <th className="text-center p-4 text-muted-foreground font-medium text-sm">Test Performance %</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, idx) => {
                const testPct = getTestPercentage(r);
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white text-sm">{r.studentName}</td>
                    <td className="p-4 text-muted-foreground text-sm">{r.grade_level || "—"}</td>
                    <td className="p-4 text-muted-foreground text-sm">{r.courseName}</td>
                    <td className="p-4 text-sm text-center">
                      <span className={r.attendancePercentage >= 75 ? "text-green-400" : "text-red-400"}>
                        {r.attendancePercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-sm text-center">
                      <span className={testPct >= 50 ? "text-green-400" : "text-red-400"}>
                        {testPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No reports available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
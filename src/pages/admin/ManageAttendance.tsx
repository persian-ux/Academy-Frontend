import { useState, useEffect } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { getAttendance, getCourses, getUsers, markBulkAttendance, type CourseData, type UserData } from "@/services/adminService";

export default function ManageAttendance() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [students, setStudents] = useState<UserData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, "present" | "absent" | "late">>({});

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [coursesRes, usersRes] = await Promise.all([getCourses(), getUsers()]);
        if (cancelled) return;
        if (coursesRes.success) setCourses(coursesRes.courses);
        if (usersRes.success) setStudents(usersRes.users.filter((u) => u.role === "Student"));
      } catch {
        if (!cancelled) setError("Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedCourse || !selectedDate) return;
    let cancelled = false;
    const loadAttendance = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getAttendance({ courseId: selectedCourse, date: selectedDate });
        if (cancelled) return;
        if (res.success) {
          const map: Record<number, "present" | "absent" | "late"> = {};
          res.records.forEach((r) => { map[r.studentId] = r.status; });
          setAttendanceMap(map);
        }
      } catch {
        if (!cancelled) setError("Failed to load attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAttendance();
    return () => { cancelled = true; };
  }, [selectedCourse, selectedDate]);

  const setStatus = (studentId: number, status: "present" | "absent" | "late") => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const bulkData = students.map((s) => ({
        studentId: s.userId,
        courseId: selectedCourse,
        date: selectedDate,
        status: attendanceMap[s.userId] || "absent",
      }));
      const res = await markBulkAttendance(bulkData);
      if (res.success) {
        setSuccess("Attendance saved successfully");
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <Check className="w-4 h-4 text-green-400" />;
      case "absent": return <X className="w-4 h-4 text-red-400" />;
      case "late": return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getStatusButton = (studentId: number, status: "present" | "absent" | "late") => {
    const current = attendanceMap[studentId];
    const selected = current === status;
    const base = "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ";
    const styles: Record<string, string> = {
      present: selected
        ? "bg-green-500/20 text-green-400 border-green-500/50"
        : "bg-white/5 text-muted-foreground border-white/10 hover:border-green-500/30",
      absent: selected
        ? "bg-red-500/20 text-red-400 border-red-500/50"
        : "bg-white/5 text-muted-foreground border-white/10 hover:border-red-500/30",
      late: selected
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
        : "bg-white/5 text-muted-foreground border-white/10 hover:border-yellow-500/30",
    };
    return (
      <button
        onClick={() => setStatus(studentId, status)}
        className={`${base} ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Attendance</h2>
        <p className="text-muted-foreground text-sm mt-1">Mark and manage student attendance</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">{success}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          >
            <option value={0}>Select a course</option>
            {courses.map((c) => (
              <option key={c.courseId} value={c.courseId}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSave}
            disabled={!selectedCourse || submitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Attendance
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : selectedCourse ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Student</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Email</th>
                <th className="text-center p-4 text-muted-foreground font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm">{s.name}</td>
                  <td className="p-4 text-muted-foreground text-sm">{s.email}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusButton(s.userId, "present")}
                      {getStatusButton(s.userId, "absent")}
                      {getStatusButton(s.userId, "late")}
                      {attendanceMap[s.userId] && (
                        <span className="ml-2">{getStatusIcon(attendanceMap[s.userId])}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground rounded-xl border border-white/10">
          Select a course and date to manage attendance
        </div>
      )}
    </div>
  );
}
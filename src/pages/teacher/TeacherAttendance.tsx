import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Save, SunMoon, BadgeAlert } from "lucide-react";
import { useAppSelector } from "@/hooks/useAppStore";
import { markTeacherAttendance, type TeacherAttendanceRecord, type TeacherAttendanceStatus } from "@/services/teacherAttendanceService";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusPill({ status }: { status: TeacherAttendanceStatus | "Absent" }) {
  const classes =
    status === "Present"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : status === "Leave"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}

export default function TeacherAttendance() {
  const { user } = useAppSelector((state) => state.auth);
  const [attendanceDate, setAttendanceDate] = useState(() => toDateInputValue(new Date()));
  const [status, setStatus] = useState<TeacherAttendanceStatus>("Present");
  const [leaveReason, setLeaveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedRecord, setSavedRecord] = useState<TeacherAttendanceRecord | null>(null);

  useEffect(() => {
    setError("");
    setSuccess("");
    setSavedRecord(null);
  }, [attendanceDate]);

  // Validation disabled — leave reason is no longer required to save attendance
  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!attendanceDate) return false;
    return true;
  }, [attendanceDate, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!attendanceDate) {
      setError("Please choose an attendance date.");
      return;
    }

    // Leave reason validation disabled — attendance saves regardless

    setSubmitting(true);
    try {
      const response = await markTeacherAttendance({
        attendance_date: attendanceDate,
        status,
        leave_reason: status === "Leave" ? leaveReason.trim() : undefined,
      });

      if (response.success) {
        setSavedRecord({
          attendance_date: attendanceDate,
          status,
          leave_reason: status === "Leave" ? leaveReason.trim() : null,
          marked_at: response.data?.marked_at ?? new Date().toISOString(),
          auto_marked: response.data?.auto_marked ?? false,
          teacher_name: response.data?.teacher_name ?? user?.name,
        });
        setSuccess(response.message || "Attendance saved successfully.");
      } else {
        setError(response.message || "Unable to save attendance.");
      }
    } catch {
      setError("Unable to save attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mark your status for today in a few seconds.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-xl shadow-black/10">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <CalendarDays className="h-4 w-4 text-primary" />
                Attendance date
              </span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
            </label>

            <div className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <SunMoon className="h-4 w-4 text-primary" />
                Status
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                {(["Present", "Leave"] as TeacherAttendanceStatus[]).map((option) => {
                  const active = status === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {status === "Leave" && (
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <BadgeAlert className="h-4 w-4 text-primary" />
                Leave reason
              </span>
              <textarea
                value={leaveReason}
                onChange={(event) => setLeaveReason(event.target.value)}
                rows={3}
                placeholder="Add a short reason for your leave"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
            </label>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? "Saving attendance..." : "Save attendance"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Current saved status</p>
            <p className="text-sm text-muted-foreground">Latest submission for {formatDisplayDate(attendanceDate)}</p>
          </div>
          {savedRecord ? <StatusPill status={savedRecord.status} /> : <span className="text-sm text-muted-foreground">No submission yet</span>}
        </div>

        {savedRecord && (
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Teacher</p>
              <p className="mt-1 text-white">{savedRecord.teacher_name || user?.name || "Teacher"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Marked at</p>
              <p className="mt-1 text-white">{savedRecord.marked_at ? new Date(savedRecord.marked_at).toLocaleString() : "Just now"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Leave reason</p>
              <p className="mt-1 text-white">{savedRecord.leave_reason || "Not applicable"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Loader2,
  Users as UsersIcon,
  Pencil,
  Trash2,
  MoreVertical,
  Search,
  Eye,
  KeyRound,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { getStudents, deleteStudent, type StudentQueryParams } from "@/services/studentService";
import { getAllUsers } from "@/services/userService";
import { getCourses, type CourseData } from "@/services/adminService";
import type { Student } from "@/types/student";
import type { User } from "@/types/user";
import type { GradeLevel } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const GRADE_LEVELS: GradeLevel[] = ["8th", "9th", "10th", "11th", "12th"];

export default function ManageStudents() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Delete confirmation
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Build a set of student IDs that have a linked login account
  const linkedStudentIds = useMemo(() => {
    const ids = new Set<number>();
    users.forEach((u) => {
      if (u.student_id != null) ids.add(u.student_id);
    });
    return ids;
  }, [users]);

  // Map student_id -> user (for showing username/email)
  const studentUserMap = useMemo(() => {
    const map = new Map<number, User>();
    users.forEach((u) => {
      if (u.student_id != null) map.set(u.student_id, u);
    });
    return map;
  }, [users]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: StudentQueryParams = { page, limit };
    if (search.trim()) params.search = search.trim();
    if (gradeFilter) params.grade_level = gradeFilter;
    if (courseFilter) params.course_id = Number(courseFilter);

    try {
      const res = await getStudents(params);
      if (res.success) {
        setStudents(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalItems);
        } else {
          setTotalPages(1);
          setTotalItems(res.data.length);
        }
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, gradeFilter, courseFilter]);

  const loadUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res.success) setUsers(res.data);
    } catch {
      // silent
    }
  };

  const loadCourses = async () => {
    try {
      const res = await getCourses();
      if (res.success) setCourses(res.courses);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadUsers();
    loadCourses();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, gradeFilter, courseFilter]);

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      const res = await deleteStudent(deletingStudent.id);
      if (res.success) {
        showToast("success", `Student "${deletingStudent.name}" deleted successfully`);
        setDeletingStudent(null);
        loadStudents();
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to delete student");
      }
    } catch {
      showToast("error", "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const hasLogin = (student: Student) => linkedStudentIds.has(student.id);

  const courseName = (student: Student) =>
    student.course_name || courses.find((c) => c.courseId === student.course_id)?.title || "—";

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border transition-all ${
            toast.type === "success"
              ? "bg-green-500/20 border-green-500/30 text-green-400"
              : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Students</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create students without login accounts, then create logins later
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/students/create")}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{totalItems}</p>
          <p className="text-sm text-muted-foreground">Total Students</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">
            {students.filter((s) => hasLogin(s)).length}
          </p>
          <p className="text-sm text-muted-foreground">With Login (this page)</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">
            {students.filter((s) => !hasLogin(s)).length}
          </p>
          <p className="text-sm text-muted-foreground">Without Login (this page)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={gradeFilter || undefined} onValueChange={(v) => setGradeFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g} Grade
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter || undefined} onValueChange={(v) => setCourseFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.courseId} value={String(c.courseId)}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(gradeFilter || courseFilter || search) && (
            <button
              onClick={() => {
                setSearch("");
                setGradeFilter("");
                setCourseFilter("");
              }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Name</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Father Name</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Phone</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Grade</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Course</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Roll No</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Login Status</th>
                <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const linked = hasLogin(student);
                const linkedUser = studentUserMap.get(student.id);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-white text-sm font-medium">{student.name}</td>
                    <td className="p-4 text-muted-foreground text-sm">{student.father_name || "—"}</td>
                    <td className="p-4 text-muted-foreground text-sm">{student.phone || "—"}</td>
                    <td className="p-4 text-muted-foreground text-sm">{student.grade_level || "—"}</td>
                    <td className="p-4 text-muted-foreground text-sm">{courseName(student)}</td>
                    <td className="p-4 text-muted-foreground text-sm">{student.roll_no || "—"}</td>
                    <td className="p-4">
                      {linked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Login Created
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <KeyRound className="w-3 h-3" />
                          No Login
                        </span>
                      )}
                      {linkedUser && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {linkedUser.username || linkedUser.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-muted-foreground font-normal">
                              {student.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/admin/students/${student.id}`)}>
                              <Eye className="w-4 h-4 text-blue-400" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/students/${student.id}/edit`)}>
                              <Pencil className="w-4 h-4 text-blue-400" />
                              <span>Edit Student</span>
                            </DropdownMenuItem>
                            {!linked && (
                              <DropdownMenuItem onClick={() => navigate(`/admin/students/${student.id}/create-login`)}>
                                <KeyRound className="w-4 h-4 text-green-400" />
                                <span>Create Login</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingStudent(student)}
                              className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                              <span>Delete Student</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2" />
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({totalItems} students)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Delete Student</h3>
              <button
                onClick={() => setDeletingStudent(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to <span className="text-red-400 font-medium">delete</span>{" "}
              <span className="text-white font-medium">{deletingStudent.name}</span>?
              {hasLogin(deletingStudent) && (
                <span className="block mt-2 text-yellow-400">
                  This student has a linked login account which may also be affected.
                </span>
              )}
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={deleting}
                className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Trash2 className="w-4 h-4" />
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
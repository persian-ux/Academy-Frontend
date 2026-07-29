import { useState, useEffect } from "react";
import { Plus, X, Loader2, Users as UsersIcon, Shield, GraduationCap, UserCheck } from "lucide-react";
import { getAllUsers, createUser } from "@/services/userService";
import { getCourses, type CourseData } from "@/services/adminService";
import type { User } from "@/services/userService";
import type { GradeLevel } from "@/types/user";

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Admin: {
    label: "Admin",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: <Shield className="w-3 h-3" />,
  },
  Teacher: {
    label: "Teacher",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <GraduationCap className="w-3 h-3" />,
  },
  Student: {
    label: "Student",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <UserCheck className="w-3 h-3" />,
  },
};

const GRADE_LEVELS: GradeLevel[] = ["8th", "9th", "10th", "11th", "12th"];

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create user modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student" as "Teacher" | "Student",
    grade_level: "" as GradeLevel | "",
    courseId: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllUsers();
      if (res.success) {
        setUsers(res.data);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = async () => {
    setForm({ name: "", email: "", password: "", role: "Student", grade_level: "", courseId: 0 });
    setFormError("");
    // Load courses for the course selector
    try {
      const res = await getCourses();
      if (res.success) setCourses(res.courses);
    } catch {
      // silent
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const payload: {
        name: string;
        email: string;
        password: string;
        role: "Teacher" | "Student";
        grade_level?: GradeLevel | null;
      } = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === "Student") {
        payload.grade_level = form.grade_level || null;
      }

      const res = await createUser(payload);
      if (res.success) {
        showToast("success", `User "${form.name}" created successfully as ${form.role}`);
        setShowModal(false);
        loadUsers();
      } else {
        setFormError(res.message);
      }
    } catch {
      setFormError("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-white">Manage Users</h2>
          <p className="text-muted-foreground text-sm mt-1">View all registered users and their roles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">
            {users.filter((u) => u.role === "Teacher").length}
          </p>
          <p className="text-sm text-muted-foreground">Teachers</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">
            {users.filter((u) => u.role === "Student").length}
          </p>
          <p className="text-sm text-muted-foreground">Students</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">Name</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">Email</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">Role</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">Grade Level</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.user_id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="p-4 text-white text-sm font-medium">{user.name}</td>
                <td className="p-4 text-muted-foreground text-sm">{user.email}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      roleConfig[user.role]?.color || "bg-white/10 text-white"
                    }`}
                  >
                    {roleConfig[user.role]?.icon}
                    {roleConfig[user.role]?.label || user.role}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground text-sm">
                  {user.grade_level || "—"}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2" />
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New User</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Role</label>
                <div className="flex gap-3">
                  {(["Student", "Teacher"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role, grade_level: role === "Teacher" ? "" : form.grade_level })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.role === role
                          ? role === "Student"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                      }`}
                    >
                      {role === "Student" ? (
                        <UserCheck className="w-4 h-4 inline mr-1.5" />
                      ) : (
                        <GraduationCap className="w-4 h-4 inline mr-1.5" />
                      )}
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              {/* Grade Level & Course - only for Students */}
              {form.role === "Student" && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Grade Level</label>
                    <select
                      value={form.grade_level}
                      onChange={(e) => setForm({ ...form, grade_level: e.target.value as GradeLevel })}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">Select grade level</option>
                      {GRADE_LEVELS.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade} Grade
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Assign Course</label>
                    <select
                      value={form.courseId}
                      onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    >
                      <option value={0}>Select a course (optional)</option>
                      {courses
                        .filter((c) => !form.grade_level || c.title.toLowerCase().includes(form.grade_level.toLowerCase().replace("th", "")))
                        .map((c) => (
                          <option key={c.courseId} value={c.courseId}>
                            {c.title} {c.teacherName ? `- ${c.teacherName}` : ""}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {courses.length > 0
                        ? `${courses.filter((c) => !form.grade_level || c.title.toLowerCase().includes(form.grade_level.toLowerCase().replace("th", ""))).length} course(s) available`
                        : "No courses available. Create courses first."}
                    </p>
                  </div>
                </>
              )}

              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

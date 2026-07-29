import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Loader2,
  Users as UsersIcon,
  Shield,
  GraduationCap,
  UserCheck,
  Pencil,
  Trash2,
  MoreVertical,
  Power,
  PowerOff,
} from "lucide-react";
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "@/services/userService";
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

  // Create/Edit user modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  // 3-dot dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle state
  const [togglingId, setTogglingId] = useState<number | null>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const loadCourses = async () => {
    try {
      const res = await getCourses();
      if (res.success) setCourses(res.courses);
    } catch {
      // silent
    }
  };

  const openCreateModal = async () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "Student", grade_level: "", courseId: 0 });
    setFormError("");
    await loadCourses();
    setShowModal(true);
  };

  const openEditModal = async (user: User) => {
    setOpenMenuId(null);
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role === "Admin" ? "Teacher" : (user.role as "Teacher" | "Student"),
      grade_level: user.grade_level || "",
      courseId: 0,
    });
    setFormError("");
    await loadCourses();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        // Update existing user
        const payload: {
          name: string;
          email: string;
          role: "Teacher" | "Student";
          grade_level?: GradeLevel | null;
          password?: string;
        } = {
          name: form.name,
          email: form.email,
          role: form.role,
        };

        if (form.role === "Student") {
          payload.grade_level = form.grade_level || null;
        } else {
          payload.grade_level = null;
        }

        // Only send password if user entered a new one
        if (form.password.trim() !== "") {
          payload.password = form.password;
        }

        const res = await updateUser(editingUser.user_id, payload);
        if (res.success) {
          showToast("success", `User "${form.name}" updated successfully`);
          setShowModal(false);
          loadUsers();
        } else {
          setFormError(res.message);
        }
      } else {
        // Create new user
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
      }
    } catch {
      setFormError(editingUser ? "Failed to update user" : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    setFormError("");
    try {
      const res = await deleteUser(deletingUser.user_id);
      if (res.success) {
        showToast("success", `User "${deletingUser.name}" deleted permanently`);
        setDeletingUser(null);
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to delete user");
      }
    } catch {
      showToast("error", "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setOpenMenuId(null);
    setTogglingId(user.user_id);
    try {
      const newStatus = !user.is_active;
      const res = await toggleUserStatus(user.user_id, newStatus);
      if (res.success) {
        showToast("success", `User "${user.name}" is now ${newStatus ? "active" : "inactive"}`);
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to update user status");
      }
    } catch {
      showToast("error", "Failed to update user status");
    } finally {
      setTogglingId(null);
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
          <p className="text-muted-foreground text-sm mt-1">View, edit, activate/deactivate, and delete users</p>
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
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
              <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
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
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      user.is_active === false
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-green-500/20 text-green-400 border-green-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.is_active === false ? "bg-red-400" : "bg-green-400"
                      }`}
                    />
                    {user.is_active === false ? "Inactive" : "Active"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.user_id ? null : user.user_id)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                      title="More actions"
                      disabled={togglingId === user.user_id}
                    >
                      {togglingId === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </button>

                    {/* 3-dot Dropdown Menu */}
                    {openMenuId === user.user_id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 z-50 w-48 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden"
                      >
                        <button
                          onClick={() => openEditModal(user)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors text-left"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                          Edit User
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors text-left"
                        >
                          {user.is_active === false ? (
                            <>
                              <Power className="w-4 h-4 text-green-400" />
                              Activate User
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-4 h-4 text-yellow-400" />
                              Deactivate User
                            </>
                          )}
                        </button>
                        <div className="border-t border-white/10" />
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeletingUser(user);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Permanently Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2" />
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? "Edit User" : "Create New User"}
              </h3>
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
                <label className="block text-sm text-muted-foreground mb-1">
                  Password {editingUser && <span className="text-xs">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  {...(editingUser ? {} : { required: true, minLength: 6 })}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder={editingUser ? "Enter new password to change" : "Min 6 characters"}
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
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Delete User</h3>
              <button
                onClick={() => setDeletingUser(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to <span className="text-red-400 font-medium">permanently delete</span>{" "}
              <span className="text-white font-medium">{deletingUser.name}</span> ({deletingUser.email})?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
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
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
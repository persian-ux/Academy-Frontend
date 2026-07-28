import { useState, useEffect, useRef } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { userService } from "@/services/userService";
import type { User, GradeLevel } from "@/types/user";

type RoleFilter = "All" | "Student" | "Teacher";

const GRADE_LEVELS: GradeLevel[] = ["8th", "9th", "10th", "11th", "12th"];

const ROLE_BADGE_COLORS: Record<string, string> = {
  Admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Teacher: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Student: "bg-green-500/20 text-green-400 border-green-500/30",
};

const initialFormState = {
  name: "",
  email: "",
  password: "",
  role: "Student" as "Teacher" | "Student",
  grade_level: null as GradeLevel | null,
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const loadedRef = useRef(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load users on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await userService.list();
        if (res.success && res.data) {
          setUsers(res.data);
        } else {
          setError(res.message || "Failed to load users");
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to load users";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await userService.list();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      // Silently fail on refresh, error will show on initial load
    }
  };

  // Filter & search
  const filteredUsers = users.filter((u) => {
    const roleMatch = roleFilter === "All" || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const searchMatch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return roleMatch && searchMatch;
  });

  // --- Modal handlers ---
  const openCreate = () => {
    setEditingUser(null);
    setForm(initialFormState);
    setFormErrors([]);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role === "Admin" ? "Teacher" : u.role,
      grade_level: u.grade_level,
    });
    setFormErrors([]);
    setShowModal(true);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!form.name || form.name.trim().length < 2) {
      errors.push("Name is required and must be at least 2 characters");
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.push("A valid email is required");
    }
    if (!editingUser && (!form.password || form.password.length < 6)) {
      errors.push("Password is required and must be at least 6 characters");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors([]);
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: {
          name: string;
          email: string;
          password?: string;
          role: "Teacher" | "Student";
          grade_level: GradeLevel | null;
        } = {
          name: form.name,
          email: form.email,
          role: form.role,
          grade_level: form.grade_level,
        };
        if (form.password) payload.password = form.password;

        const res = await userService.update(editingUser.userId, payload);
        if (!res.success) {
          if (res.errors) {
            setFormErrors(res.errors);
          } else {
            setFormErrors([res.message || "Update failed"]);
          }
          return;
        }
      } else {
        const res = await userService.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          grade_level: form.grade_level,
        });
        if (!res.success) {
          if (res.errors) {
            setFormErrors(res.errors);
          } else {
            setFormErrors([res.message || "Create failed"]);
          }
          return;
        }
      }
      setShowModal(false);
      await refreshUsers();
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: { data?: { message?: string; errors?: string[] } };
        }
      )?.response?.data;
      if (msg?.errors) {
        setFormErrors(msg.errors);
      } else {
        setFormErrors([msg?.message || "Operation failed"]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete handler ---
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await userService.delete(deleteTarget.userId);
      if (res.success) {
        setDeleteTarget(null);
        await refreshUsers();
      } else {
        setError(res.message || "Delete failed");
        setDeleteTarget(null);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Delete failed";
      setError(msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // --- Role badge ---
  const getRoleBadge = (role: string) => {
    const base = "px-2.5 py-0.5 text-xs font-semibold rounded-full border";
    return `${base} ${ROLE_BADGE_COLORS[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`;
  };

  // --- Role badge helper component ---
  const RoleBadge = ({ role }: { role: string }) => (
    <span className={getRoleBadge(role)}>{role}</span>
  );

  const counts = {
    All: users.length,
    Student: users.filter((u) => u.role === "Student").length,
    Teacher: users.filter((u) => u.role === "Teacher").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Users</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create, edit, and manage all users
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 overflow-x-auto">
          {(["All", "Student", "Teacher"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                roleFilter === filter
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {filter === "All" ? "All" : `${filter}s`}
              <span className="ml-1.5 text-xs opacity-60">
                ({counts[filter]})
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">
                  Created At
                </th>
                <th className="text-right p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.userId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white text-sm font-mono">
                    {u.userId}
                  </td>
                  <td className="p-4 text-white text-sm font-medium">
                    {u.name}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {u.email}
                  </td>
                  <td className="p-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {u.grade_level || "—"}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm hidden md:table-cell">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white mr-1"
                      title="Edit user"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? "No users match your search"
                      : roleFilter !== "All"
                        ? `No ${roleFilter.toLowerCase()} users found`
                        : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? "Edit User" : "Create User"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5 font-medium">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5 font-medium">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5 font-medium">
                  Password{" "}
                  {editingUser && (
                    <span className="text-xs text-muted-foreground/60 font-normal">
                      (leave blank to keep current)
                    </span>
                  )}
                  {!editingUser && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={
                    editingUser
                      ? "Leave blank to keep"
                      : "At least 6 characters"
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5 font-medium">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const newRole = e.target.value as "Teacher" | "Student";
                    setForm({
                      ...form,
                      role: newRole,
                      grade_level:
                        newRole === "Student" ? form.grade_level : null,
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors text-sm appearance-none cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="Student" className="bg-[#1a1f2e] text-white" style={{ background: "#1a1f2e", color: "#ffffff" }}>Student</option>
                  <option value="Teacher" className="bg-[#1a1f2e] text-white" style={{ background: "#1a1f2e", color: "#ffffff" }}>Teacher</option>
                </select>
              </div>

              {/* Grade Level (conditional on Student role) */}
              {form.role === "Student" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5 font-medium">
                    Grade Level
                  </label>
                  <select
                    value={form.grade_level || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        grade_level: (e.target.value || null) as
                          | GradeLevel
                          | null,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors text-sm appearance-none cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" className="bg-[#1a1f2e] text-white" style={{ background: "#1a1f2e", color: "#ffffff" }}>Select grade level</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g} className="bg-[#1a1f2e] text-white" style={{ background: "#1a1f2e", color: "#ffffff" }}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Validation errors */}
              {formErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <ul className="list-disc list-inside space-y-1">
                    {formErrors.map((err, i) => (
                      <li key={i} className="text-sm text-red-400">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors rounded-lg"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete User
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Are you sure you want to delete this user?
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
              <p className="text-white text-sm font-medium">
                {deleteTarget.name}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {deleteTarget.email} — {deleteTarget.role}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors rounded-lg"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
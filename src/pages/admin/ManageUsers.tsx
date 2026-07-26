import { useState, useEffect } from "react";
import { UserPlus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, type UserData } from "@/services/adminService";

export default function ManageUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Student" as "Admin" | "Teacher" | "Student" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getUsers();
        if (cancelled) return;
        if (res.success) setUsers(res.users);
      } catch {
        if (!cancelled) setError("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUsers();
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "Student" });
    setShowModal(true);
    setError("");
  };

  const openEdit = (u: UserData) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingUser) {
        const res = await updateUser(editingUser.userId, form);
        if (!res.success) setError(res.message);
      } else {
        const res = await createUser(form);
        if (!res.success) setError(res.message);
      }
      setShowModal(false);
      const res = await getUsers();
      if (res.success) setUsers(res.users);
    } catch {
      setError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setError("");
      const res = await deleteUser(userId);
      if (res.success) {
        const usersRes = await getUsers();
        if (usersRes.success) setUsers(usersRes.users);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Delete failed");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Admin: "bg-purple-500/20 text-purple-400",
      Teacher: "bg-blue-500/20 text-blue-400",
      Student: "bg-green-500/20 text-green-400",
    };
    return `px-2 py-0.5 text-xs font-semibold rounded-full ${colors[role] || "bg-gray-500/20 text-gray-400"}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Users</h2>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and manage all users</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">ID</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Name</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Email</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Role</th>
                <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm">{u.userId}</td>
                  <td className="p-4 text-white text-sm">{u.name}</td>
                  <td className="p-4 text-muted-foreground text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className={getRoleBadge(u.role)}>{u.role}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white mr-1"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.userId)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? "Edit User" : "Create User"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
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
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "Admin" | "Teacher" | "Student" })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
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
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Loader2, Users as UsersIcon, Shield, GraduationCap, UserCheck } from "lucide-react";
import { getAllUsers } from "@/services/userService";
import type { User } from "@/services/userService";

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

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Users</h2>
        <p className="text-muted-foreground text-sm mt-1">View all registered users and their roles</p>
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
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { getStudentById, createStudentLogin } from "@/services/studentService";
import { getAllUsers } from "@/services/userService";
import type { Student } from "@/types/student";
import type { User } from "@/types/user";

export default function CreateStudentLogin() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudentById(Number(id));
        if (res.success && res.data) {
          setStudent(res.data);
          // Pre-fill username suggestion
          const safeName = res.data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          setForm((f) => ({ ...f, username: `${safeName}${res.data?.id || ""}` }));
        } else {
          setError(res.message || "Failed to load student");
        }
      } catch {
        setError("Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await getAllUsers();
        if (res.success) setUsers(res.data);
      } catch {
        // silent
      }
    };
    loadUsers();
  }, []);

  const alreadyHasLogin = student
    ? users.some((u) => u.student_id === student.id)
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setError("");

    if (!student) return;

    if (!form.username.trim()) {
      setFormError("Username is required");
      return;
    }
    if (!form.password) {
      setFormError("Password is required");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createStudentLogin(student.id, {
        username: form.username.trim(),
        email: form.email.trim() || null,
        password: form.password,
        courseId: student.course_id ?? null,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate(`/admin/students/${student.id}`), 1500);
      } else {
        setError(res.message || "Failed to create login account");
      }
    } catch {
      setError("Failed to create login account");
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

  if (error && !student) {
    return (
      <div className="max-w-md">
        <button
          onClick={() => navigate("/admin/students")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <button
        onClick={() => navigate(`/admin/students/${student?.id}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Student
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Create Login Account</h2>
          <p className="text-muted-foreground text-sm mt-1">
            For student: <span className="text-white font-medium">{student?.name}</span>
          </p>
        </div>
      </div>

      {alreadyHasLogin && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          This student already has a login account.
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Login account created successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Username *</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            placeholder="ali45"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Student will use this to sign in.
          </p>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Email <span className="text-xs">(optional)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            placeholder="ali@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Confirm Password *</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            placeholder="Re-enter password"
          />
        </div>

        {formError && <p className="text-red-400 text-sm">{formError}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/students/${student?.id}`)}
            className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || success || alreadyHasLogin}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Create Login
          </button>
        </div>
      </form>
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  KeyRound,
  CheckCircle2,
  User as UserIcon,
  Phone,
  MapPin,
  Calendar,
  Hash,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { getStudentById } from "@/services/studentService";
import { getAllUsers } from "@/services/userService";
import { getCourses, type CourseData } from "@/services/adminService";
import type { Student } from "@/types/student";
import type { User } from "@/types/user";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="p-2 rounded-lg bg-white/5 text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-white font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const linkedUser = useMemo(() => {
    if (!student) return null;
    return users.find((u) => u.student_id === student.id) || null;
  }, [student, users]);

  const hasLogin = Boolean(linkedUser);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudentById(Number(id));
        if (res.success && res.data) {
          setStudent(res.data);
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
    const loadCourses = async () => {
      try {
        const res = await getCourses();
        if (res.success) setCourses(res.courses);
      } catch {
        // silent
      }
    };
    loadUsers();
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div>
        <button
          onClick={() => navigate("/admin/students")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error || "Student not found"}
        </div>
      </div>
    );
  }

  const courseName =
    student.course_name ||
    courses.find((c) => c.courseId === student.course_id)?.title ||
    "—";

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate("/admin/students")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{student.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Student ID: {student.id}
            {student.roll_no && ` • Roll No: ${student.roll_no}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/students/${student.id}/edit`)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg transition-colors text-sm border border-white/10"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          {!hasLogin && (
            <button
              onClick={() => navigate(`/admin/students/${student.id}/create-login`)}
              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-colors text-sm border border-green-500/30"
            >
              <KeyRound className="w-4 h-4" />
              Create Login
            </button>
          )}
        </div>
      </div>

      {/* Login Status Card */}
      <div
        className={`p-4 rounded-xl border mb-6 ${
          hasLogin
            ? "bg-green-500/10 border-green-500/30"
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {hasLogin ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <KeyRound className="w-5 h-5 text-yellow-400" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${hasLogin ? "text-green-400" : "text-yellow-400"}`}>
              {hasLogin ? "Login Account Created" : "No Login Account"}
            </p>
            {hasLogin && linkedUser ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Username: {linkedUser.username || "—"} • Email: {linkedUser.email || "—"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a login account so this student can sign in.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Student Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Father Name" value={student.father_name} />
        <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={student.phone} />
        <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Grade Level" value={student.grade_level} />
        <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={courseName} />
        <InfoRow icon={<Hash className="w-4 h-4" />} label="Roll No" value={student.roll_no} />
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Date of Birth"
          value={student.date_of_birth ? student.date_of_birth.split("T")[0] : null}
        />
        <div className="sm:col-span-2">
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={student.address} />
        </div>
      </div>
    </div>
  );
}
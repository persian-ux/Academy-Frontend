import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createStudent, updateStudent, getStudentById } from "@/services/studentService";
import { getCourses, type CourseData } from "@/services/adminService";
import type { GradeLevel } from "@/types/user";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const GRADE_LEVELS: GradeLevel[] = ["8th", "9th", "10th", "11th", "12th"];

interface StudentFormState {
  name: string;
  father_name: string;
  phone: string;
  address: string;
  grade_level: string;
  course_id: string;
  roll_no: string;
  date_of_birth: string;
}

const emptyForm: StudentFormState = {
  name: "",
  father_name: "",
  phone: "",
  address: "",
  grade_level: "",
  course_id: "",
  roll_no: "",
  date_of_birth: "",
};

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await getCourses();
        if (res.success) setCourses(res.courses);
      } catch {
        // silent
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    const loadStudent = async () => {
      setLoading(true);
      try {
        const res = await getStudentById(Number(id));
        if (res.success && res.data) {
          const s = res.data;
          setForm({
            name: s.name || "",
            father_name: s.father_name || "",
            phone: s.phone || "",
            address: s.address || "",
            grade_level: s.grade_level || "",
            course_id: s.course_id ? String(s.course_id) : "",
            roll_no: s.roll_no || "",
            date_of_birth: s.date_of_birth ? s.date_of_birth.split("T")[0] : "",
          });
        } else {
          setError(res.message || "Failed to load student");
        }
      } catch {
        setError("Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      father_name: form.father_name.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      grade_level: (form.grade_level || null) as GradeLevel | null,
      course_id: form.course_id ? Number(form.course_id) : null,
      roll_no: form.roll_no.trim() || null,
      date_of_birth: form.date_of_birth || null,
    };

    try {
      if (isEdit && id) {
        const res = await updateStudent(Number(id), payload);
        if (res.success) {
          navigate("/admin/students");
        } else {
          setError(res.message || "Failed to update student");
        }
      } else {
        const res = await createStudent(payload);
        if (res.success) {
          navigate("/admin/students");
        } else {
          setError(res.message || "Failed to create student");
        }
      }
    } catch {
      setError(isEdit ? "Failed to update student" : "Failed to create student");
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
    <div className="max-w-2xl">
      <button
        onClick={() => navigate("/admin/students")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      <h2 className="text-2xl font-bold text-white mb-1">
        {isEdit ? "Edit Student" : "Add New Student"}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {isEdit
          ? "Update student information. No login account is needed."
          : "Create a student record. You can create a login account later."}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
              placeholder="Ali"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Father Name</label>
            <input
              type="text"
              value={form.father_name}
              onChange={(e) => setForm({ ...form, father_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
              placeholder="Ahmed Ali"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
              placeholder="03001234567"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Roll No</label>
            <input
              type="text"
              value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
              placeholder="9-A-001"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Grade Level</label>
            <Select
              value={form.grade_level || undefined}
              onValueChange={(value) => setForm({ ...form, grade_level: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade} Grade
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Course</label>
            <Select
              value={form.course_id || undefined}
              onValueChange={(value) => setForm({ ...form, course_id: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course (optional)" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.courseId} value={String(c.courseId)}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            placeholder="123 Main St, Karachi"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/students")}
            className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "Update Student" : "Create Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
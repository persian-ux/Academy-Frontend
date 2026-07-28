import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { getCourses, createCourse, updateCourse, deleteCourse, type CourseData } from "@/services/adminService";
import { userService } from "@/services/userService";
import type { User } from "@/types/user";

export default function ManageCourses() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [form, setForm] = useState({ title: "", description: "", teacherId: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [coursesRes, usersRes] = await Promise.all([
          getCourses(),
          userService.list(),
        ]);
        if (cancelled) return;
        if (coursesRes.success) setCourses(coursesRes.courses);
        if (usersRes.success && usersRes.data) {
          setTeachers(usersRes.data.filter((u: User) => u.role === "Teacher"));
        }
      } catch {
        if (!cancelled) setError("Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: "", description: "", teacherId: teachers[0]?.userId || 0 });
    setShowModal(true);
    setError("");
  };

  const openEdit = (c: CourseData) => {
    setEditingCourse(c);
    setForm({ title: c.title, description: c.description, teacherId: c.teacherId });
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingCourse) {
        const res = await updateCourse(editingCourse.courseId, form);
        if (!res.success) setError(res.message);
      } else {
        const res = await createCourse(form);
        if (!res.success) setError(res.message);
      }
      setShowModal(false);
      // Reload data after successful operation
      const [coursesRes, usersRes] = await Promise.all([
        getCourses(),
        userService.list(),
      ]);
      if (coursesRes.success) setCourses(coursesRes.courses);
      if (usersRes.success && usersRes.data) {
        setTeachers(usersRes.data.filter((u: User) => u.role === "Teacher"));
      }
    } catch {
      setError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      setError("");
      const res = await deleteCourse(courseId);
      if (res.success) {
        const [coursesRes, usersRes] = await Promise.all([
          getCourses(),
          userService.list(),
        ]);
        if (coursesRes.success) setCourses(coursesRes.courses);
        if (usersRes.success && usersRes.data) {
          setTeachers(usersRes.data.filter((u: User) => u.role === "Teacher"));
        }
      } else {
        setError(res.message);
      }
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Courses</h2>
          <p className="text-muted-foreground text-sm mt-1">Create and manage courses & classes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.courseId} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(course)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(course.courseId)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
              {course.teacherName && (
                <div className="text-xs text-muted-foreground">
                  Teacher: <span className="text-white/70">{course.teacherName}</span>
                </div>
              )}
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              No courses found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingCourse ? "Edit Course" : "Create Course"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Assigned Teacher</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                >
                  <option value={0}>Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCourse ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
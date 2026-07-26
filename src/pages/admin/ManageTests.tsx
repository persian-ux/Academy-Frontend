import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { getTests, getCourses, createTest, deleteTest, type TestData, type CourseData } from "@/services/adminService";

export default function ManageTests() {
  const [tests, setTests] = useState<TestData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", courseId: 0, date: new Date().toISOString().split("T")[0], totalMarks: 100, passingMarks: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [testsRes, coursesRes] = await Promise.all([getTests(), getCourses()]);
        if (cancelled) return;
        if (testsRes.success) setTests(testsRes.tests);
        if (coursesRes.success) setCourses(coursesRes.courses);
      } catch {
        if (!cancelled) setError("Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setForm({ title: "", courseId: courses[0]?.courseId || 0, date: new Date().toISOString().split("T")[0], totalMarks: 100, passingMarks: 50 });
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await createTest(form);
      if (res.success) {
        setShowModal(false);
        const [testsRes, coursesRes] = await Promise.all([getTests(), getCourses()]);
        if (testsRes.success) setTests(testsRes.tests);
        if (coursesRes.success) setCourses(coursesRes.courses);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testId: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      setError("");
      const res = await deleteTest(testId);
      if (res.success) {
        const [testsRes, coursesRes] = await Promise.all([getTests(), getCourses()]);
        if (testsRes.success) setTests(testsRes.tests);
        if (coursesRes.success) setCourses(coursesRes.courses);
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
          <h2 className="text-2xl font-bold text-white">Manage Tests</h2>
          <p className="text-muted-foreground text-sm mt-1">Create and manage tests & exams</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Test
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
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
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Title</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Course</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Total Marks</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Passing</th>
                <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.testId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm font-medium">{test.title}</td>
                  <td className="p-4 text-muted-foreground text-sm">{test.courseName || `Course #${test.courseId}`}</td>
                  <td className="p-4 text-muted-foreground text-sm">{test.date}</td>
                  <td className="p-4 text-white text-sm">{test.totalMarks}</td>
                  <td className="p-4 text-white text-sm">{test.passingMarks}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(test.testId)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No tests found</td>
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
              <h3 className="text-lg font-semibold text-white">Create Test</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Course</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                >
                  <option value={0}>Select course</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Total Marks</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.totalMarks}
                    onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Passing Marks</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.passingMarks}
                    onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
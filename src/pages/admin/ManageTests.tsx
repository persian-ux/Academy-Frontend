import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2, Edit, Search, FileSpreadsheet, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAllTests,
  getTestsByGrade,
  createTest as createTestApi,
  updateTest as updateTestApi,
  deleteTest as deleteTestApi,
} from "@/services/testService";
import type { Test, CreateTestPayload } from "@/types/test";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const GRADES = ["8th", "9th", "10th", "11th", "12th"];
const SUBJECTS = ["Science", "Mathematics", "English", "Urdu", "Physics", "Chemistry", "Biology", "Computer Science", "Islamiat", "Pak Studies"];
const STATUSES: Test["status"][] = ["Scheduled", "Ongoing", "Completed", "Cancelled"];

const statusColors: Record<Test["status"], string> = {
  Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
  Completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const defaultForm: CreateTestPayload = {
  title: "",
  subject: "Science",
  grade: "8th",
  date: new Date().toISOString().split("T")[0],
  duration: 60,
  status: "Scheduled",
};

export default function ManageTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [form, setForm] = useState<CreateTestPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = gradeFilter === "all" ? await getAllTests() : await getTestsByGrade(gradeFilter);
      if (res.success) {
        setTests(res.data);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [gradeFilter]);

  const openCreate = () => {
    setEditingTest(null);
    setForm(defaultForm);
    setShowModal(true);
    setError("");
  };

  const openEdit = (test: Test) => {
    setEditingTest(test);
    setForm({
      title: test.title,
      subject: test.subject,
      grade: test.grade,
      date: test.date.split("T")[0],
      duration: test.duration,
      status: test.status,
    });
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingTest) {
        const res = await updateTestApi(editingTest.test_id, form);
        if (res.success) {
          showToast("success", "Test updated successfully");
          setShowModal(false);
          loadTests();
        } else {
          setError(res.message);
        }
      } else {
        const res = await createTestApi(form);
        if (res.success) {
          showToast("success", "Test created successfully");
          setShowModal(false);
          loadTests();
        } else {
          setError(res.message);
        }
      }
    } catch {
      setError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTest) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteTestApi(deletingTest.test_id);
      if (res.success) {
        showToast("success", "Test deleted successfully");
        setDeletingTest(null);
        loadTests();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const viewMarks = (testId: number) => {
    navigate(`/admin/upload-marks?testId=${testId}`);
  };

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Tests</h2>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and manage tests for all grades</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Test
        </button>
      </div>

      {/* Grade Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Filter by grade:</span>
          {["all", ...GRADES].map((grade) => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                gradeFilter === grade
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white border border-transparent hover:border-white/10"
              }`}
            >
              {grade === "all" ? "All Grades" : grade}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No tests yet</p>
          <button
            onClick={openCreate}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Create your first test
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Title</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Subject</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Grade</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Duration</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Creator</th>
                <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.test_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white text-sm font-medium">{test.title}</td>
                  <td className="p-4 text-muted-foreground text-sm">{test.subject}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white">
                      {test.grade}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{test.date.split("T")[0]}</td>
                  <td className="p-4 text-muted-foreground text-sm">{test.duration} min</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[test.status]}`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{test.creator_name}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-muted-foreground font-normal">
                            {test.title}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(test)}>
                            <Edit className="w-4 h-4 text-blue-400" />
                            <span>Edit Test</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => viewMarks(test.test_id)}>
                            <FileSpreadsheet className="w-4 h-4 text-primary" />
                            <span>Upload Marks</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingTest(test)}
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>Delete Test</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Delete Test</h3>
              <button
                onClick={() => setDeletingTest(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to <span className="text-red-400 font-medium">permanently delete</span>{" "}
              <span className="text-white font-medium">{deletingTest.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingTest(null)}
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingTest ? "Edit Test" : "Create New Test"}
              </h3>
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
                  placeholder="e.g. 8th Grade Science Midterm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Subject</label>
                  <Select
                    value={form.subject}
                    onValueChange={(value) => setForm({ ...form, subject: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Grade</label>
                  <Select
                    value={form.grade}
                    onValueChange={(value) => setForm({ ...form, grade: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g} Grade</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as Test["status"] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTest ? "Update Test" : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
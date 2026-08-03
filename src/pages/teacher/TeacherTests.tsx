import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Edit,
  Search,
  FileSpreadsheet,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllTests, getTestsByGrade, deleteTest as deleteTestApi } from "@/services/testService";
import type { Test, TestStatus } from "@/types/test";
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
import { Input } from "@/components/ui/input";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const GRADES: Test["grade"][] = ["8th", "9th", "10th", "11th", "12th"];

const statusColors: Record<TestStatus, string> = {
  Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ongoing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Completed: "bg-green-500/20 text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TeacherTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  const loadTests = async () => {
    setLoading(true);
    setError("");
    try {
      const res =
        gradeFilter === "all"
          ? await getAllTests()
          : await getTestsByGrade(gradeFilter);
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
    const load = async () => {
      await loadTests();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeFilter]);

  // Client-side search filter (title + subject)
  const filteredTests = useMemo(() => {
    if (!searchTerm.trim()) return tests;
    const term = searchTerm.toLowerCase();
    return tests.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term)
    );
  }, [tests, searchTerm]);

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
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    navigate("/teacher/tests/new");
  };

  const openEdit = (test: Test) => {
    navigate(`/teacher/tests/${test.test_id}/edit`);
  };

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Tests</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage tests for all grades
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Test
        </button>
      </div>

      {/* Grade Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter by grade:</span>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
          />
        </div>
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
      ) : filteredTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No tests found</p>
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
                <th className="text-left p-4 text-muted-foreground font-medium text-sm">Created By</th>
                <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr
                  key={test.test_id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white text-sm font-medium">{test.title}</td>
                  <td className="p-4 text-muted-foreground text-sm">{test.subject}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white">
                      {test.grade}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {test.date.split("T")[0]}
                  </td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTest}
        title="Delete Test"
        description={
          deletingTest
            ? `Are you sure you want to permanently delete "${deletingTest.title}"? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTest(null)}
      />
    </div>
  );
}

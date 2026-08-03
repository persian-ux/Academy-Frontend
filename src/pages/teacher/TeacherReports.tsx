import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  GraduationCap,
} from "lucide-react";
import { getAllTests } from "@/services/testService";
import {
  getClassMarks,
  uploadSingleMark,
  deleteMark as deleteMarkApi,
} from "@/services/markService";
import type { Test } from "@/types/test";
import type { Mark } from "@/types/mark";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const GRADES: Test["grade"][] = ["8th", "9th", "10th", "11th", "12th"];

interface EditForm {
  marks_obtained: string;
  total_marks: string;
}

export default function TeacherReports() {
  const [tests, setTests] = useState<Test[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>("8th");
  const [testFilter, setTestFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMarkId, setEditingMarkId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    marks_obtained: "",
    total_marks: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingMark, setDeletingMark] = useState<Mark | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Load all tests (for the test filter dropdown)
  useEffect(() => {
    const loadTests = async () => {
      try {
        const res = await getAllTests();
        if (res.success) {
          setTests(res.data);
        } else {
          showToast("error", res.message);
        }
      } catch {
        showToast("error", "Failed to load tests");
      }
    };
    loadTests();
  }, []);

  // Load class marks when grade changes
  useEffect(() => {
    const loadClassMarks = async () => {
      setLoadingMarks(true);
      try {
        const res = await getClassMarks(gradeFilter);
        if (res.success) {
          setMarks(res.data);
        } else {
          showToast("error", res.message);
        }
      } catch {
        showToast("error", "Failed to load class marks");
      } finally {
        setLoadingMarks(false);
        setLoading(false);
      }
    };
    loadClassMarks();
  }, [gradeFilter]);

  // Client-side filters: by test and by student name
  const filteredMarks = useMemo(() => {
    return marks.filter((m) => {
      const matchesTest = testFilter === "all" || String(m.test_id) === testFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        m.student_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTest && matchesSearch;
    });
  }, [marks, testFilter, searchTerm]);

  const startEdit = (mark: Mark) => {
    setEditingMarkId(mark.mark_id);
    setEditForm({
      marks_obtained: String(mark.marks_obtained),
      total_marks: String(mark.total_marks),
    });
  };

  const cancelEdit = () => {
    setEditingMarkId(null);
    setEditForm({ marks_obtained: "", total_marks: "" });
  };

  const saveEdit = async () => {
    if (editingMarkId === null) return;
    const mark = marks.find((m) => m.mark_id === editingMarkId);
    if (!mark) return;

    const obtained = Number(editForm.marks_obtained);
    const total = Number(editForm.total_marks);

    if (isNaN(obtained) || obtained < 0) {
      showToast("error", "Marks obtained must be a valid non-negative number");
      return;
    }
    if (isNaN(total) || total <= 0) {
      showToast("error", "Total marks must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const res = await uploadSingleMark({
        test_id: mark.test_id,
        student_id: mark.student_id,
        marks_obtained: obtained,
        total_marks: total,
      });
      if (res.success) {
        showToast("success", "Mark updated successfully");
        // Update the local marks list
        setMarks((prev) =>
          prev.map((m) =>
            m.mark_id === mark.mark_id
              ? { ...m, marks_obtained: obtained, total_marks: total }
              : m
          )
        );
        setEditingMarkId(null);
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to update mark");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMark) return;
    setDeleting(true);
    try {
      const res = await deleteMarkApi(deletingMark.mark_id);
      if (res.success) {
        showToast("success", "Mark deleted successfully");
        setMarks((prev) => prev.filter((m) => m.mark_id !== deletingMark.mark_id));
        setDeletingMark(null);
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to delete mark");
    } finally {
      setDeleting(false);
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
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Reports / Marks</h2>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage class-wide marks by grade
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Grade:</span>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Test:</span>
          <Select value={testFilter} onValueChange={setTestFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All tests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {tests.map((t) => (
                <SelectItem key={t.test_id} value={String(t.test_id)}>
                  {t.title} ({t.subject})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {loadingMarks ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredMarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
          <GraduationCap className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No marks records found</p>
          <p className="text-muted-foreground text-sm mt-1">
            Try selecting a different grade or test.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left p-3 text-muted-foreground font-medium text-sm">Student</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-sm">Roll No</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-sm">Test</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-sm">Subject</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-sm">Date</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-sm">Marks Obtained</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-sm">Total Marks</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-sm">%</th>
                <th className="text-center p-3 text-muted-foreground font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((mark) => {
                const percentage =
                  mark.total_marks > 0
                    ? (mark.marks_obtained / mark.total_marks) * 100
                    : 0;
                const isEditing = editingMarkId === mark.mark_id;
                return (
                  <tr
                    key={mark.mark_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-white text-sm font-medium">
                      {mark.student_name}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {mark.student_roll_no ?? "N/A"}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {mark.test_title}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {mark.test_subject}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {mark.test_date.split("T")[0]}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editForm.marks_obtained}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              marks_obtained: e.target.value,
                            })
                          }
                          className="w-20 ml-auto bg-white/5 border-white/10 text-white text-right focus:border-primary"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {mark.marks_obtained}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={1}
                          value={editForm.total_marks}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              total_marks: e.target.value,
                            })
                          }
                          className="w-20 ml-auto bg-white/5 border-white/10 text-white text-right focus:border-primary"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {mark.total_marks}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          percentage >= 80
                            ? "text-green-400"
                            : percentage >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveEdit}
                            disabled={saving}
                            className="h-7 w-7 p-0 text-green-400 hover:text-green-300"
                            title="Save"
                          >
                            {saving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(mark)}
                            className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingMark(mark)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingMark}
        title="Delete Mark"
        description={
          deletingMark
            ? `Are you sure you want to delete the mark record for "${deletingMark.student_name}"? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingMark(null)}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  X,
  Save,
  Users as UsersIcon,
  AlertCircle,
} from "lucide-react";
import { getAllTests } from "@/services/testService";
import {
  getMarksByTest,
  getClassMarks,
  uploadSingleMark,
  uploadBatchMarks,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Toast from "@/components/Toast";

interface StudentRow {
  student_id: string;
  student_name: string;
  student_roll_no: string;
  marks_obtained: string;
  total_marks: string;
  mark_id?: number;
}

export default function TeacherUploadMarks() {
  const [searchParams] = useSearchParams();
  const preselectedTestId = searchParams.get("testId");
  const navigate = useNavigate();

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(
    preselectedTestId ? Number(preselectedTestId) : null
  );
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Load all tests on mount
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
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);

  const selectedTest = tests.find((t) => t.test_id === selectedTestId);

  // Load existing students who already have marks for this test
  const loadExistingStudents = async () => {
    if (!selectedTestId) return;
    setLoadingStudents(true);
    try {
      const res = await getMarksByTest(selectedTestId);
      if (res.success) {
        const rows: StudentRow[] = res.data.map((m: Mark) => ({
          student_id: String(m.student_id),
          student_name: m.student_name,
          student_roll_no: m.student_roll_no ?? "",
          marks_obtained: String(m.marks_obtained),
          total_marks: String(m.total_marks),
          mark_id: m.mark_id,
        }));
        setStudents(rows);
        showToast("info", `${rows.length} existing student(s) loaded`);
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to load existing students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load all students in the grade who have marks (broader view)
  const loadGradeStudents = async () => {
    if (!selectedTest) return;
    setLoadingStudents(true);
    try {
      const res = await getClassMarks(selectedTest.grade);
      if (res.success) {
        // Merge: keep existing students, add new ones from grade
        const existingIds = new Set(students.map((s) => s.student_id));
        const newRows: StudentRow[] = [];
        for (const m of res.data as Mark[]) {
          if (!existingIds.has(String(m.student_id))) {
            newRows.push({
              student_id: String(m.student_id),
              student_name: m.student_name,
              student_roll_no: m.student_roll_no ?? "",
              marks_obtained: String(m.marks_obtained),
              total_marks: String(m.total_marks),
              mark_id: m.mark_id,
            });
          }
        }
        setStudents((prev) => [...prev, ...newRows]);
        showToast("info", `${newRows.length} additional student(s) loaded from grade`);
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to load grade students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const addStudentRow = () => {
    setStudents((prev) => [
      ...prev,
      {
        student_id: "",
        student_name: "",
        student_roll_no: "",
        marks_obtained: "",
        total_marks: "100",
      },
    ]);
  };

  const removeStudentRow = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStudentField = (
    index: number,
    field: keyof StudentRow,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSingleUpload = async (index: number) => {
    const row = students[index];
    if (!row || !selectedTestId) return;
    const studentId = Number(row.student_id);
    const obtained = Number(row.marks_obtained);
    const total = Number(row.total_marks);

    if (!studentId || isNaN(studentId)) {
      showToast("error", "Please enter a valid student ID");
      return;
    }
    if (isNaN(obtained) || obtained < 0) {
      showToast("error", "Marks obtained must be a valid non-negative number");
      return;
    }
    if (isNaN(total) || total <= 0) {
      showToast("error", "Total marks must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await uploadSingleMark({
        test_id: selectedTestId,
        student_id: studentId,
        marks_obtained: obtained,
        total_marks: total,
      });
      if (res.success) {
        showToast("success", "Mark uploaded successfully");
        // Update the row with the returned mark_id if available
        if (res.data?.mark_id) {
          setStudents((prev) =>
            prev.map((s, i) =>
              i === index ? { ...s, mark_id: res.data!.mark_id } : s
            )
          );
        }
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to upload mark");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchUpload = async () => {
    if (!selectedTestId) return;

    const validRows = students.filter(
      (s) =>
        s.student_id &&
        s.student_id.trim() !== "" &&
        s.marks_obtained &&
        s.marks_obtained.trim() !== "" &&
        s.total_marks &&
        s.total_marks.trim() !== ""
    );

    if (validRows.length === 0) {
      showToast("error", "No marks to upload. Fill in at least one student's marks.");
      return;
    }

    const marksPayload = validRows.map((s) => ({
      student_id: Number(s.student_id),
      marks_obtained: Number(s.marks_obtained),
      total_marks: Number(s.total_marks),
    }));

    setSubmitting(true);
    try {
      const res = await uploadBatchMarks({
        test_id: selectedTestId,
        marks: marksPayload,
      });
      if (res.success) {
        showToast("success", `${validRows.length} mark(s) uploaded successfully`);
        // Reload existing students to refresh mark_ids
        loadExistingStudents();
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to upload marks");
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
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Marks</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Upload marks for a test
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/teacher/reports")}
        >
          <X className="w-4 h-4" />
          Back to Reports
        </Button>
      </div>

      {/* Test Selector */}
      <div className="mb-6">
        <label className="block text-sm text-muted-foreground mb-2">
          Select Test
        </label>
        <Select
          value={selectedTestId ? String(selectedTestId) : undefined}
          onValueChange={(value) => {
            setSelectedTestId(Number(value));
            setStudents([]);
          }}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="-- Choose a test --" />
          </SelectTrigger>
          <SelectContent>
            {tests.map((test) => (
              <SelectItem key={test.test_id} value={String(test.test_id)}>
                {test.title} ({test.grade} - {test.subject})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Test Details */}
      {selectedTest && (
        <Card className="bg-card border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{selectedTest.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Subject</span>
                <span className="text-white">{selectedTest.subject}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Grade</span>
                <span className="text-white">{selectedTest.grade}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Date</span>
                <span className="text-white">{selectedTest.date.split("T")[0]}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Duration</span>
                <span className="text-white">{selectedTest.duration} min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Table */}
      {selectedTestId && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Students</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadExistingStudents}
                disabled={loadingStudents}
              >
                {loadingStudents ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UsersIcon className="w-4 h-4" />
                )}
                Load Existing Students
              </Button>
              {selectedTest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadGradeStudents}
                  disabled={loadingStudents}
                >
                  <UsersIcon className="w-4 h-4" />
                  Load Grade Students
                </Button>
              )}
              <Button size="sm" onClick={addStudentRow}>
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
              <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No students loaded yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Click "Load Existing Students" or "Add Student" to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left p-3 text-muted-foreground font-medium text-sm">#</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-sm">Student ID</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-sm">Name</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-sm">Roll No</th>
                      <th className="text-right p-3 text-muted-foreground font-medium text-sm">Marks Obtained</th>
                      <th className="text-right p-3 text-muted-foreground font-medium text-sm">Total Marks</th>
                      <th className="text-center p-3 text-muted-foreground font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 text-muted-foreground text-sm">{idx + 1}</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Student ID"
                            value={student.student_id}
                            onChange={(e) =>
                              updateStudentField(idx, "student_id", e.target.value)
                            }
                            className="w-24 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="text"
                            placeholder="Student name"
                            value={student.student_name}
                            onChange={(e) =>
                              updateStudentField(idx, "student_name", e.target.value)
                            }
                            className="w-40 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="text"
                            placeholder="Roll No"
                            value={student.student_roll_no ?? ""}
                            onChange={(e) =>
                              updateStudentField(idx, "student_roll_no", e.target.value)
                            }
                            className="w-24 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={student.marks_obtained}
                            onChange={(e) =>
                              updateStudentField(idx, "marks_obtained", e.target.value)
                            }
                            className="w-24 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary text-sm text-right"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={1}
                            placeholder="100"
                            value={student.total_marks}
                            onChange={(e) =>
                              updateStudentField(idx, "total_marks", e.target.value)
                            }
                            className="w-24 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary text-sm text-right"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {student.mark_id ? (
                              <span className="text-xs text-green-400">Saved</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">New</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSingleUpload(idx)}
                              disabled={submitting}
                              className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                              title="Save this row"
                            >
                              {submitting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStudentRow(idx)}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                              title="Remove row"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Batch Upload */}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleBatchUpload}
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Batch Upload All
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

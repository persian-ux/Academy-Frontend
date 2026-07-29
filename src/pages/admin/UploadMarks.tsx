import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Upload, Check, AlertCircle, Users as UsersIcon } from "lucide-react";
import { getAllTests } from "@/services/testService";
import { getAllUsers } from "@/services/userService";
import { uploadSingleMark, uploadBatchMarks, getMarksByTest } from "@/services/markService";
import type { Test } from "@/types/test";
import type { Mark } from "@/types/mark";
import type { User } from "@/services/userService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function UploadMarks() {
  const [searchParams] = useSearchParams();
  const preselectedTestId = searchParams.get("testId");

  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(
    preselectedTestId ? Number(preselectedTestId) : null
  );
  const [existingMarks, setExistingMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);

  // Single upload state
  const [singleStudentId, setSingleStudentId] = useState<number>(0);
  const [singleMarks, setSingleMarks] = useState({ marks_obtained: "", total_marks: "" });

  // Batch upload state
  const [batchMarks, setBatchMarks] = useState<Record<number, { marks_obtained: string; total_marks: string }>>({});

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"single" | "batch">("batch");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [testsRes, usersRes] = await Promise.all([getAllTests(), getAllUsers()]);
        if (testsRes.success) setTests(testsRes.data);
        if (usersRes.success) setStudents(usersRes.data.filter((u) => u.role === "Student"));
      } catch {
        showToast("error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadExistingMarks = async () => {
    if (!selectedTestId) return;
    setLoadingMarks(true);
    try {
      const res = await getMarksByTest(selectedTestId);
      if (res.success) {
        setExistingMarks(res.data);
        // Pre-fill batch marks with existing values
        const batch: Record<number, { marks_obtained: string; total_marks: string }> = {};
        for (const mark of res.data) {
          batch[mark.student_id] = {
            marks_obtained: String(mark.marks_obtained),
            total_marks: String(mark.total_marks),
          };
        }
        setBatchMarks(batch);
      }
    } catch {
      // silent
    } finally {
      setLoadingMarks(false);
    }
  };

  useEffect(() => {
    if (selectedTestId) {
      loadExistingMarks();
    }
  }, [selectedTestId]);

  const selectedTest = tests.find((t) => t.test_id === selectedTestId);
  const gradeStudents = selectedTest
    ? students.filter((s) => s.grade_level === selectedTest.grade)
    : [];

  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId || !singleStudentId) return;
    setSubmitting(true);
    try {
      const res = await uploadSingleMark({
        test_id: selectedTestId,
        student_id: singleStudentId,
        marks_obtained: Number(singleMarks.marks_obtained),
        total_marks: Number(singleMarks.total_marks),
      });
      if (res.success) {
        showToast("success", "Marks uploaded successfully");
        setSingleMarks({ marks_obtained: "", total_marks: "" });
        loadExistingMarks();
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to upload marks");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchUpload = async () => {
    if (!selectedTestId) return;
    const marks = gradeStudents
      .filter((s) => batchMarks[s.user_id]?.marks_obtained && batchMarks[s.user_id]?.total_marks)
      .map((s) => ({
        student_id: s.user_id,
        marks_obtained: Number(batchMarks[s.user_id].marks_obtained),
        total_marks: Number(batchMarks[s.user_id].total_marks),
      }));

    if (marks.length === 0) {
      showToast("error", "No marks to upload. Fill in at least one student's marks.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await uploadBatchMarks({ test_id: selectedTestId, marks });
      if (res.success) {
        showToast("success", `${marks.length} marks uploaded successfully`);
        loadExistingMarks();
      } else {
        showToast("error", res.message);
      }
    } catch {
      showToast("error", "Failed to upload marks");
    } finally {
      setSubmitting(false);
    }
  };

  const updateBatchEntry = (studentId: number, field: "marks_obtained" | "total_marks", value: string) => {
    setBatchMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId] || { marks_obtained: "", total_marks: "" }, [field]: value },
    }));
  };

  const getExistingMark = (studentId: number): Mark | undefined => {
    return existingMarks.find((m) => m.student_id === studentId);
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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Upload Marks</h2>
        <p className="text-muted-foreground text-sm mt-1">Upload marks for tests by grade</p>
      </div>

      {/* Test Selector */}
      <div className="mb-6">
        <label className="block text-sm text-muted-foreground mb-2">Select Test</label>
        <Select
          value={selectedTestId ? String(selectedTestId) : undefined}
          onValueChange={(value) => {
            setSelectedTestId(Number(value));
            setBatchMarks({});
            setExistingMarks([]);
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

      {selectedTest && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Test</span>
              <span className="text-sm text-white font-medium">{selectedTest.title}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Grade</span>
              <span className="text-sm text-white">{selectedTest.grade}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Subject</span>
              <span className="text-sm text-white">{selectedTest.subject}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Students in Grade</span>
              <span className="text-sm text-white">{gradeStudents.length}</span>
            </div>
          </div>
        </div>
      )}

      {selectedTestId && gradeStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10 mb-6">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No students found for grade {selectedTest?.grade}</p>
        </div>
      )}

      {selectedTestId && gradeStudents.length > 0 && (
        <>
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("batch")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "batch"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white border border-transparent"
              }`}
            >
              <UsersIcon className="w-4 h-4 inline mr-1.5" />
              Batch Upload
            </button>
            <button
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "single"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white border border-transparent"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1.5" />
              Single Upload
            </button>
          </div>

          {/* Single Upload */}
          {activeTab === "single" && (
            <form onSubmit={handleSingleUpload} className="p-6 rounded-xl bg-white/5 border border-white/10 max-w-md">
              <h3 className="text-white font-semibold mb-4">Single Student Upload</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Student</label>
                  <Select
                    value={singleStudentId ? String(singleStudentId) : undefined}
                    onValueChange={(value) => setSingleStudentId(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeStudents.map((s) => (
                        <SelectItem key={s.user_id} value={String(s.user_id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Marks Obtained</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={singleMarks.marks_obtained}
                      onChange={(e) => setSingleMarks({ ...singleMarks, marks_obtained: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Total Marks</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={singleMarks.total_marks}
                      onChange={(e) => setSingleMarks({ ...singleMarks, total_marks: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !singleStudentId}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Marks
                </button>
              </div>
            </form>
          )}

          {/* Batch Upload */}
          {activeTab === "batch" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Batch Upload - {gradeStudents.length} students
                </h3>
                <button
                  onClick={handleBatchUpload}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload All
                </button>
              </div>

              {loadingMarks ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">#</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Student</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Roll No</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Marks Obtained</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Total Marks</th>
                        <th className="text-center p-3 text-muted-foreground font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeStudents.map((student, idx) => {
                        const existing = getExistingMark(student.user_id);
                        const entry = batchMarks[student.user_id];
                        return (
                          <tr key={student.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 text-muted-foreground text-sm">{idx + 1}</td>
                            <td className="p-3 text-white text-sm font-medium">{student.name}</td>
                            <td className="p-3 text-muted-foreground text-sm">{student.email.split("@")[0]}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={entry?.marks_obtained ?? ""}
                                onChange={(e) => updateBatchEntry(student.user_id, "marks_obtained", e.target.value)}
                                className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm"
                                placeholder={existing ? String(existing.marks_obtained) : "Marks"}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={1}
                                value={entry?.total_marks ?? ""}
                                onChange={(e) => updateBatchEntry(student.user_id, "total_marks", e.target.value)}
                                className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm"
                                placeholder={existing ? String(existing.total_marks) : "Total"}
                              />
                            </td>
                            <td className="p-3 text-center">
                              {existing ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                  <Check className="w-3 h-3" /> Uploaded
                                </span>
                              ) : entry?.marks_obtained ? (
                                <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                                  <AlertCircle className="w-3 h-3" /> Ready
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleBatchUpload}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload All Marks
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
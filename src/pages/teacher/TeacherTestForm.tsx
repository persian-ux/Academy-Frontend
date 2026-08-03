import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Loader2, Save } from "lucide-react";
import {
  createTest as createTestApi,
  updateTest as updateTestApi,
  getTestById,
} from "@/services/testService";
import type { Test, CreateTestPayload, TestStatus } from "@/types/test";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Toast from "@/components/Toast";

const GRADES: Test["grade"][] = ["8th", "9th", "10th", "11th", "12th"];
const SUBJECTS = [
  "Science",
  "Mathematics",
  "English",
  "Urdu",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Islamiat",
  "Pak Studies",
];
const STATUSES: TestStatus[] = ["Scheduled", "Ongoing", "Completed", "Cancelled"];

const defaultForm: CreateTestPayload = {
  title: "",
  subject: "Science",
  grade: "8th",
  date: new Date().toISOString().split("T")[0],
  duration: 60,
};

export default function TeacherTestForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<CreateTestPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Load test data if editing
  useEffect(() => {
    if (!isEdit) return;

    const loadTest = async () => {
      setLoading(true);
      try {
        const res = await getTestById(Number(id));
        if (res.success && res.data) {
          const test = res.data;
          setForm({
            title: test.title,
            subject: test.subject,
            grade: test.grade,
            date: test.date.split("T")[0],
            duration: test.duration,
            status: test.status,
          });
        } else {
          showToast("error", res.message || "Test not found");
          navigate("/teacher/tests");
        }
      } catch {
        showToast("error", "Failed to load test");
        navigate("/teacher/tests");
      } finally {
        setLoading(false);
      }
    };
    loadTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.grade) return "Grade is required";
    if (!form.date) return "Date is required";
    if (!form.duration || form.duration <= 0) return "Duration must be greater than 0";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateTestApi(Number(id), form);
        if (res.success) {
          showToast("success", "Test updated successfully");
          setTimeout(() => navigate("/teacher/tests"), 1500);
        } else {
          showToast("error", res.message);
        }
      } else {
        const res = await createTestApi(form);
        if (res.success) {
          showToast("success", "Test created successfully");
          setTimeout(() => navigate("/teacher/tests"), 1500);
        } else {
          showToast("error", res.message);
        }
      }
    } catch {
      showToast("error", "Operation failed");
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
          <h2 className="text-2xl font-bold text-white">
            {isEdit ? "Edit Test" : "Create New Test"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isEdit ? "Update test details" : "Fill in the details to create a new test"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/teacher/tests")}
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm text-muted-foreground">
            Test Title *
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="e.g. 8th Grade Science Midterm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary"
            required
          />
        </div>

        {/* Subject + Grade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="subject" className="text-sm text-muted-foreground">
              Subject *
            </Label>
            <Select
              value={form.subject}
              onValueChange={(value) => setForm({ ...form, subject: value })}
            >
              <SelectTrigger
                id="subject"
                className="mt-1 bg-white/5 border-white/10 text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="grade" className="text-sm text-muted-foreground">
              Grade *
            </Label>
            <Select
              value={form.grade}
              onValueChange={(value) =>
                setForm({ ...form, grade: value as Test["grade"] })
              }
            >
              <SelectTrigger
                id="grade"
                className="mt-1 bg-white/5 border-white/10 text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g} Grade
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date + Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date" className="text-sm text-muted-foreground">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 bg-white/5 border-white/10 text-white focus:border-primary"
              required
            />
          </div>

          <div>
            <Label htmlFor="duration" className="text-sm text-muted-foreground">
              Duration (minutes) *
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              placeholder="60"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary"
              required
            />
          </div>
        </div>

        {/* Status (optional on create) */}
        <div>
          <Label htmlFor="status" className="text-sm text-muted-foreground">
            Status {isEdit ? "*" : "(optional)"}
          </Label>
          <Select
            value={form.status ?? ""}
            onValueChange={(value) =>
              setForm({ ...form, status: value as TestStatus })
            }
          >
            <SelectTrigger
              id="status"
              className="mt-1 bg-white/5 border-white/10 text-white"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/teacher/tests")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "Update Test" : "Create Test"}
          </Button>
        </div>
      </form>
    </div>
  );
}

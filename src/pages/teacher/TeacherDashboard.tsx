import { useState, useEffect } from "react";
import { Loader2, FileText, BarChart3, ClipboardCheck, GraduationCap } from "lucide-react";
import { getAllTests } from "@/services/testService";
import { getClassMarks } from "@/services/markService";
import type { Test, TestStatus } from "@/types/test";
import type { Mark } from "@/types/mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Toast from "@/components/Toast";

const GRADES: Test["grade"][] = ["8th", "9th", "10th", "11th", "12th"];

const statusLabels: Record<TestStatus, string> = {
  Scheduled: "Scheduled",
  Ongoing: "Ongoing",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const statusColors: Record<TestStatus, string> = {
  Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ongoing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Completed: "bg-green-500/20 text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function TeacherDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("8th");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Load all tests once on mount
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

  // Load class marks for the selected grade
  useEffect(() => {
    const loadClassMarks = async () => {
      try {
        const res = await getClassMarks(selectedGrade);
        if (res.success) {
          setMarks(res.data);
        } else {
          showToast("error", res.message);
        }
      } catch {
        showToast("error", "Failed to load class marks");
      } finally {
        setLoading(false);
      }
    };
    loadClassMarks();
  }, [selectedGrade]);

  // Compute summary stats
  const totalTests = tests.length;
  const testsByStatus = tests.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<TestStatus, number>
  );
  const totalMarksRecords = marks.length;

  const statCards: StatCard[] = [
    {
      label: "Total Tests",
      value: totalTests,
      icon: <FileText className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Marks Records",
      value: totalMarksRecords,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Scheduled",
      value: testsByStatus.Scheduled ?? 0,
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Ongoing",
      value: testsByStatus.Ongoing ?? 0,
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Completed",
      value: testsByStatus.Completed ?? 0,
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Cancelled",
      value: testsByStatus.Cancelled ?? 0,
      icon: <ClipboardCheck className="w-6 h-6" />,
      color: "from-red-500 to-red-600",
    },
  ];

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

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Teacher Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your tests and class marks
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, idx) => (
          <Card
            key={idx}
            className="bg-card border-white/10 hover:border-primary/30 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-20`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tests by Status */}
      <Card className="bg-card border-white/10 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Tests by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["Scheduled", "Ongoing", "Completed", "Cancelled"] as TestStatus[]).map(
              (status) => (
                <div
                  key={status}
                  className={`p-4 rounded-xl border ${statusColors[status]} flex items-center justify-between`}
                >
                  <span className="text-sm font-medium">{statusLabels[status]}</span>
                  <span className="text-2xl font-bold">
                    {testsByStatus[status] ?? 0}
                  </span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Class Marks by Grade */}
      <Card className="bg-card border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Class Marks by Grade</CardTitle>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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
        </CardHeader>
        <CardContent>
          {marks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <GraduationCap className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No marks records found for {selectedGrade} grade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                      Student
                    </th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                      Test
                    </th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-sm">
                      Subject
                    </th>
                    <th className="text-right p-3 text-muted-foreground font-medium text-sm">
                      Marks
                    </th>
                    <th className="text-right p-3 text-muted-foreground font-medium text-sm">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark) => {
                    const percentage =
                      mark.total_marks > 0
                        ? (mark.marks_obtained / mark.total_marks) * 100
                        : 0;
                    return (
                      <tr
                        key={mark.mark_id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 text-white text-sm font-medium">
                          {mark.student_name}
                        </td>
                        <td className="p-3 text-muted-foreground text-sm">
                          {mark.test_title}
                        </td>
                        <td className="p-3 text-muted-foreground text-sm">
                          {mark.test_subject}
                        </td>
                        <td className="p-3 text-right text-muted-foreground text-sm">
                          {mark.marks_obtained} / {mark.total_marks}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

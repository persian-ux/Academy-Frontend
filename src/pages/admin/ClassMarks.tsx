import { useState, useEffect } from "react";
import { Loader2, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getAllTests } from "@/services/testService";
import { getMarksByTest } from "@/services/markService";
import type { Test } from "@/types/test";
import type { Mark } from "@/types/mark";

const GRADES = ["8th", "9th", "10th", "11th", "12th"];

interface TestSummary {
  test: Test;
  marks: Mark[];
  average: number;
  highest: number;
  lowest: number;
}

export default function ClassMarks() {
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllTests();
      if (!res.success) {
        setError(res.message);
        setLoading(false);
        return;
      }

      let filteredTests = res.data;
      if (gradeFilter !== "all") {
        filteredTests = res.data.filter((t) => t.grade === gradeFilter);
      }
      // Load marks for each test
      const summaries: TestSummary[] = [];
      for (const test of filteredTests) {
        const marksRes = await getMarksByTest(test.test_id);
        if (marksRes.success && marksRes.data.length > 0) {
          const marks = marksRes.data;
          const scores = marks.map((m) => m.marks_obtained);
          summaries.push({
            test,
            marks,
            average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
          });
        } else {
          summaries.push({
            test,
            marks: [],
            average: 0,
            highest: 0,
            lowest: 0,
          });
        }
      }
      setTestSummaries(summaries);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Class Marks</h2>
        <p className="text-muted-foreground text-sm mt-1">View marks grouped by test with summary statistics</p>
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
      ) : testSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
          <Search className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No marks data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {testSummaries.map((summary) => (
            <div
              key={summary.test.test_id}
              className="rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Test Header */}
              <div className="bg-white/5 p-4 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-white font-semibold">{summary.test.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      {summary.test.subject} &middot; {summary.test.grade} &middot; {summary.test.date.split("T")[0]}
                    </p>
                  </div>
                  {summary.marks.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" /> Avg: {summary.average}
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <TrendingUp className="w-4 h-4" /> High: {summary.highest}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <TrendingDown className="w-4 h-4" /> Low: {summary.lowest}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Marks Table */}
              {summary.marks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Student</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Marks</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Percentage</th>
                        <th className="text-left p-3 text-muted-foreground font-medium text-sm">Uploaded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.marks.map((mark) => {
                        const percentage = (mark.marks_obtained / mark.total_marks) * 100;
                        const colorClass =
                          percentage >= 80
                            ? "text-green-400"
                            : percentage >= 60
                            ? "text-yellow-400"
                            : "text-red-400";
                        return (
                          <tr
                            key={mark.mark_id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-3 text-white text-sm font-medium">{mark.student_name}</td>
                            <td className="p-3 text-muted-foreground text-sm">
                              {mark.marks_obtained} / {mark.total_marks}
                            </td>
                            <td className={`p-3 text-sm font-medium ${colorClass}`}>
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="p-3 text-muted-foreground text-sm">{mark.uploaded_by_name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Minus className="w-5 h-5 mx-auto mb-1" />
                  No marks uploaded yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
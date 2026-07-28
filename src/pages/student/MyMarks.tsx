import { useState, useEffect } from "react";
import { Loader2, BookOpen, Calendar, Percent, Trophy } from "lucide-react";
import { getMyMarks } from "@/services/markService";
import type { Mark } from "@/types/mark";

export default function MyMarks() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMarks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMyMarks();
        if (res.success) {
          // Sort newest first
          const sorted = [...res.data].sort(
            (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
          );
          setMarks(sorted);
        } else {
          setError(res.message);
        }
      } catch {
        setError("Failed to load your marks");
      } finally {
        setLoading(false);
      }
    };
    loadMarks();
  }, []);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500/10 border-green-500/30";
    if (percentage >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const overallPercentage =
    marks.length > 0
      ? Math.round(
          (marks.reduce((sum, m) => sum + m.marks_obtained, 0) /
            marks.reduce((sum, m) => sum + m.total_marks, 0)) *
            100 *
            10
        ) / 10
      : 0;

  const totalMarksObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
  const totalMarksPossible = marks.reduce((sum, m) => sum + m.total_marks, 0);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-4 md:px-8 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Marks</h1>
          <p className="text-muted-foreground">View your test results and performance</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {marks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Overall Percentage</span>
              </div>
              <p className={`text-2xl font-bold ${getPercentageColor(overallPercentage)}`}>
                {overallPercentage}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Marks</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {totalMarksObtained} / {totalMarksPossible}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Tests Taken</span>
              </div>
              <p className="text-2xl font-bold text-white">{marks.length}</p>
            </div>
          </div>
        )}

        {/* Marks Table */}
        {marks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
            <Percent className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No marks available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Test</th>
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Subject</th>
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Marks</th>
                  <th className="text-left p-4 text-muted-foreground font-medium text-sm">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark) => {
                  const percentage = (mark.marks_obtained / mark.total_marks) * 100;
                  return (
                    <tr
                      key={mark.mark_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-white text-sm font-medium">{mark.test_title}</td>
                      <td className="p-4 text-muted-foreground text-sm">{mark.test_subject}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {mark.test_date.split("T")[0]}
                      </td>
                      <td className="p-4 text-white text-sm">
                        {mark.marks_obtained} / {mark.total_marks}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPercentageBg(percentage)} ${getPercentageColor(percentage)}`}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
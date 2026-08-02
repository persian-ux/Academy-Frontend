import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, RefreshCw, Calendar, User, X, CheckCircle2, XCircle } from "lucide-react";
import { getStudents } from "@/services/studentService";
import {
  createFee,
  getFeesByMonth,
  getFeesByStudent,
  toggleFeeStatus,
  deleteFee,
} from "@/services/feeService";
import type { Student } from "@/types/student";
import type { FeeRecord, FeeListData, FeeStatus } from "@/types/fee";
import { MONTHS } from "@/types/fee";
import StatusBadge from "@/components/fees/StatusBadge";
import FeeSummaryCards from "@/components/fees/FeeSummaryCards";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CURRENT_YEAR = new Date().getFullYear();

export default function ManageFees() {
  // Students for dropdowns
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Create fee form state
  const [formStudentId, setFormStudentId] = useState("");
  const [formMonth, setFormMonth] = useState("");
  const [formYear, setFormYear] = useState(String(CURRENT_YEAR));
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState<FeeStatus>("Unpaid");
  const [creating, setCreating] = useState(false);

  // Student fee records view
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentFees, setStudentFees] = useState<FeeListData | null>(null);
  const [studentFeesLoading, setStudentFeesLoading] = useState(false);

  // Monthly records view
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [monthFees, setMonthFees] = useState<FeeListData | null>(null);
  const [monthFeesLoading, setMonthFeesLoading] = useState(false);

  // Toggle / delete state
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getStudents({ limit: 1000 });
        if (!cancelled) {
          if (res.success) {
            setStudents(res.data);
          } else {
            showToast("error", res.message || "Failed to load students");
          }
        }
      } catch {
        if (!cancelled) {
          showToast("error", "Failed to load students");
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetCreateForm = () => {
    setFormStudentId("");
    setFormMonth("");
    setFormYear(String(CURRENT_YEAR));
    setFormAmount("");
    setFormStatus("Unpaid");
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formMonth || !formYear || !formAmount) {
      showToast("error", "Please fill in all required fields");
      return;
    }
    const yearNum = Number(formYear);
    if (yearNum < 2000 || yearNum > 2100) {
      showToast("error", "Year must be between 2000 and 2100");
      return;
    }
    const amountNum = Number(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("error", "Amount must be a positive number");
      return;
    }

    setCreating(true);
    try {
      const res = await createFee({
        student_id: Number(formStudentId),
        month: formMonth,
        year: yearNum,
        amount: amountNum,
        status: formStatus,
      });
      if (res.success) {
        showToast("success", res.message || "Fee record created successfully");
        resetCreateForm();
        // Refresh views if relevant
        if (selectedStudentId && Number(selectedStudentId) === Number(formStudentId)) {
          loadStudentFees(Number(formStudentId));
        }
        if (monthFilter && Number(yearFilter) === yearNum) {
          loadMonthFees(monthFilter, yearNum);
        }
      } else {
        const msg = res.message || "Failed to create fee record";
        if (msg.toLowerCase().includes("already exists")) {
          showToast("error", `${msg} Use the toggle button to update its status instead.`);
        } else {
          showToast("error", msg);
        }
      }
    } catch {
      showToast("error", "Failed to create fee record");
    } finally {
      setCreating(false);
    }
  };

  const loadStudentFees = async (studentId: number) => {
    setStudentFeesLoading(true);
    try {
      const res = await getFeesByStudent(studentId);
      if (res.success && res.data) {
        setStudentFees(res.data);
      } else {
        setStudentFees(null);
        showToast("error", res.message || "Failed to load student fees");
      }
    } catch {
      setStudentFees(null);
      showToast("error", "Failed to load student fees");
    } finally {
      setStudentFeesLoading(false);
    }
  };

  const handleStudentSelect = (value: string) => {
    setSelectedStudentId(value);
    if (value) {
      loadStudentFees(Number(value));
    } else {
      setStudentFees(null);
    }
  };

  const loadMonthFees = async (month: string, year: number) => {
    setMonthFeesLoading(true);
    try {
      const res = await getFeesByMonth(month, year);
      if (res.success && res.data) {
        setMonthFees(res.data);
      } else {
        setMonthFees(null);
        showToast("error", res.message || "Failed to load month fees");
      }
    } catch {
      setMonthFees(null);
      showToast("error", "Failed to load month fees");
    } finally {
      setMonthFeesLoading(false);
    }
  };

  const handleViewMonth = () => {
    if (!monthFilter) {
      showToast("error", "Please select a month");
      return;
    }
    const yearNum = Number(yearFilter);
    if (yearNum < 2000 || yearNum > 2100) {
      showToast("error", "Year must be between 2000 and 2100");
      return;
    }
    loadMonthFees(monthFilter, yearNum);
  };

  const handleToggle = async (fee: FeeRecord) => {
    setTogglingId(fee.fee_id);
    const newStatus: FeeStatus = fee.status === "Paid" ? "Unpaid" : "Paid";
    try {
      const res = await toggleFeeStatus(fee.fee_id, { status: newStatus });
      if (res.success) {
        showToast("success", res.message || `Fee marked as ${newStatus}`);
        // Refresh both views
        if (selectedStudentId) {
          loadStudentFees(Number(selectedStudentId));
        }
        if (monthFilter) {
          loadMonthFees(monthFilter, Number(yearFilter));
        }
      } else {
        showToast("error", res.message || "Failed to update fee status");
      }
    } catch {
      showToast("error", "Failed to update fee status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingFee) return;
    setDeleting(true);
    try {
      const res = await deleteFee(deletingFee.fee_id);
      if (res.success) {
        showToast("success", res.message || "Fee record deleted successfully");
        setDeletingFee(null);
        if (selectedStudentId) {
          loadStudentFees(Number(selectedStudentId));
        }
        if (monthFilter) {
          loadMonthFees(monthFilter, Number(yearFilter));
        }
      } else {
        showToast("error", res.message || "Failed to delete fee record");
      }
    } catch {
      showToast("error", "Failed to delete fee record");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const renderToggleButton = (fee: FeeRecord) => (
    <button
      onClick={() => handleToggle(fee)}
      disabled={togglingId === fee.fee_id}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
        fee.status === "Paid"
          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
          : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
      }`}
    >
      {togglingId === fee.fee_id ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : fee.status === "Paid" ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      {fee.status === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}
    </button>
  );

  const renderDeleteButton = (fee: FeeRecord) => (
    <button
      onClick={() => setDeletingFee(fee)}
      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
      title="Delete fee record"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );

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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Fee Management</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create, toggle, and manage student fee records
          </p>
        </div>
      </div>

      {/* ===== Create Fee Form ===== */}
      <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create Fee Record
        </h3>
        <form onSubmit={handleCreateFee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Student *</label>
            <Select value={formStudentId || undefined} onValueChange={setFormStudentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={studentsLoading ? "Loading..." : "Select student"} />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} {s.roll_no ? `(${s.roll_no})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Month *</label>
            <Select value={formMonth || undefined} onValueChange={setFormMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Year *</label>
            <input
              type="number"
              value={formYear}
              onChange={(e) => setFormYear(e.target.value)}
              min={2000}
              max={2100}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Amount (Rs.) *</label>
            <input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              min={1}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Status</label>
            <Select value={formStatus} onValueChange={(v) => setFormStatus(v as FeeStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              <Plus className="w-4 h-4" />
              Create Fee
            </button>
          </div>
        </form>
      </div>

      {/* ===== Student Fee Records View ===== */}
      <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Student Fee Records
        </h3>
        <div className="max-w-md mb-4">
          <Select value={selectedStudentId || undefined} onValueChange={handleStudentSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={studentsLoading ? "Loading..." : "Select a student to view fees"} />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} {s.roll_no ? `(${s.roll_no})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {studentFeesLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : studentFees ? (
          <>
            <div className="mb-4">
              <p className="text-white font-medium">
                {studentFees.student_name || "Student"}
              </p>
              <p className="text-sm text-muted-foreground">Complete fee history</p>
            </div>
            <FeeSummaryCards summary={studentFees.summary} />
            {studentFees.records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-white/10">
                <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No fee records for this student yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Month</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Year</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Paid At</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Updated By</th>
                      <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentFees.records.map((fee) => (
                      <tr key={fee.fee_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white text-sm font-medium">{fee.month}</td>
                        <td className="p-4 text-muted-foreground text-sm">{fee.year}</td>
                        <td className="p-4 text-white text-sm">Rs. {fee.amount.toLocaleString()}</td>
                        <td className="p-4"><StatusBadge status={fee.status} /></td>
                        <td className="p-4 text-muted-foreground text-sm">{formatDate(fee.paid_at)}</td>
                        <td className="p-4 text-muted-foreground text-sm">{fee.updated_by_name || "—"}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {renderToggleButton(fee)}
                            {renderDeleteButton(fee)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-white/10">
            <User className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Select a student to view their fee records</p>
          </div>
        )}
      </div>

      {/* ===== Monthly Records View ===== */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Monthly Records
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-4 max-w-2xl">
          <Select value={monthFilter || undefined} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            min={2000}
            max={2100}
            className="w-full sm:w-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleViewMonth}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            View Records
          </button>
        </div>

        {monthFeesLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : monthFees ? (
          <>
            <div className="mb-4">
              <p className="text-white font-medium">
                {monthFees.month} {monthFees.year} — All Students
              </p>
            </div>
            <FeeSummaryCards summary={monthFees.summary} />
            {monthFees.records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-white/10">
                <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No fee records for this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Student</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Roll No</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Paid At</th>
                      <th className="text-right p-4 text-muted-foreground font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthFees.records.map((fee) => (
                      <tr key={fee.fee_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white text-sm font-medium">{fee.student_name}</td>
                        <td className="p-4 text-muted-foreground text-sm">{fee.student_roll_no || "—"}</td>
                        <td className="p-4 text-white text-sm">Rs. {fee.amount.toLocaleString()}</td>
                        <td className="p-4"><StatusBadge status={fee.status} /></td>
                        <td className="p-4 text-muted-foreground text-sm">{formatDate(fee.paid_at)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {renderToggleButton(fee)}
                            {renderDeleteButton(fee)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-white/10">
            <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Select a month and year to view records</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Delete Fee Record</h3>
              <button
                onClick={() => setDeletingFee(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to <span className="text-red-400 font-medium">delete</span> the fee
              record for <span className="text-white font-medium">{deletingFee.student_name}</span> for{" "}
              <span className="text-white font-medium">{deletingFee.month} {deletingFee.year}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingFee(null)}
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
    </div>
  );
}
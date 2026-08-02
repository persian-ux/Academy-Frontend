import { useState, useEffect } from "react";
import { Loader2, Wallet, Calendar } from "lucide-react";
import { getMyFees } from "@/services/feeService";
import type { FeeListData } from "@/types/fee";
import StatusBadge from "@/components/fees/StatusBadge";
import FeeSummaryCards from "@/components/fees/FeeSummaryCards";

export default function MyFees() {
  const [fees, setFees] = useState<FeeListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getMyFees();
        if (!cancelled) {
          if (res.success && res.data) {
            setFees(res.data);
          } else {
            setError(res.message || "Failed to load your fees");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load your fees");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Fees</h1>
          <p className="text-muted-foreground">View your fee records and payment status</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {fees && (
          <>
            <div className="mb-4">
              <p className="text-white font-medium">{fees.student_name || "Student"}</p>
              <p className="text-sm text-muted-foreground">Your complete fee history</p>
            </div>

            <FeeSummaryCards summary={fees.summary} />

            {fees.records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
                <Wallet className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No fee records available yet</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {fees.records.map((fee) => (
                      <tr key={fee.fee_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white text-sm font-medium">{fee.month}</td>
                        <td className="p-4 text-muted-foreground text-sm">{fee.year}</td>
                        <td className="p-4 text-white text-sm">Rs. {fee.amount.toLocaleString()}</td>
                        <td className="p-4"><StatusBadge status={fee.status} /></td>
                        <td className="p-4 text-muted-foreground text-sm">{formatDate(fee.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!fees && !error && (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/10">
            <Calendar className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No fee information available</p>
          </div>
        )}
      </div>
    </div>
  );
}
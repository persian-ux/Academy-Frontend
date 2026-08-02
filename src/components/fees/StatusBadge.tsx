import { CheckCircle2, XCircle } from "lucide-react";
import type { FeeStatus } from "@/types/fee";

interface StatusBadgeProps {
  status: FeeStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isPaid = status === "Paid";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isPaid
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30"
      }`}
    >
      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}
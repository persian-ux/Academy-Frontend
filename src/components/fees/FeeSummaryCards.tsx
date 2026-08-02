import { Wallet, CheckCircle2, XCircle, Banknote, TrendingUp, TrendingDown } from "lucide-react";
import type { FeeSummary } from "@/types/fee";

interface FeeSummaryCardsProps {
  summary: FeeSummary;
}

export default function FeeSummaryCards({ summary }: FeeSummaryCardsProps) {
  const cards = [
    { label: "Total Fees", value: summary.total_fees, icon: <Wallet className="w-5 h-5 text-primary" /> },
    { label: "Paid Fees", value: summary.paid_fees, icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
    { label: "Unpaid Fees", value: summary.unpaid_fees, icon: <XCircle className="w-5 h-5 text-red-400" /> },
    { label: "Total Amount", value: `Rs. ${summary.total_amount.toLocaleString()}`, icon: <Banknote className="w-5 h-5 text-primary" /> },
    { label: "Paid Amount", value: `Rs. ${summary.paid_amount.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 text-green-400" /> },
    { label: "Unpaid Amount", value: `Rs. ${summary.unpaid_amount.toLocaleString()}`, icon: <TrendingDown className="w-5 h-5 text-red-400" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            {card.icon}
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
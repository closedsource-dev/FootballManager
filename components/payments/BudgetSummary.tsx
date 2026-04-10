import type { BudgetSummary } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface BudgetSummaryProps {
  summary: BudgetSummary;
}

export default function BudgetSummaryCard({ summary }: BudgetSummaryProps) {
  const { fmt } = useCurrency();
  const isPositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Added</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{fmt(summary.total_collected)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Removed</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{fmt(summary.total_expenses)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
        <p className={`text-2xl font-bold ${isPositive ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
          {fmt(summary.balance)}
        </p>
      </div>
    </div>
  );
}

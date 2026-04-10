import type { PaymentWithPlayer, PaymentType } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PaymentHistoryProps {
  payments: PaymentWithPlayer[];
}

const typeBadge: Record<PaymentType, string> = {
  add_money: "bg-green-100 text-green-800",
  remove_money: "bg-red-100 text-red-800",
};

const typeLabel: Record<PaymentType, string> = {
  add_money: "Added",
  remove_money: "Removed",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const { fmt } = useCurrency();
  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 divide-y dark:divide-gray-700">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[payment.type]}`}>
              {typeLabel[payment.type]}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {payment.player_name || payment.category_name || "General fund"} · {formatDate(payment.paid_at)}
              {payment.description ? ` · ${payment.description}` : ""}
            </p>
          </div>
          <span className={`text-sm font-semibold shrink-0 ${payment.type === "add_money" ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
            {payment.type === "add_money" ? "+" : "−"}{fmt(payment.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

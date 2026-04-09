"use client";

import { useState } from "react";
import type { Payment, PaymentType } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PaymentFormProps {
  balance: number;
  onSubmit: (p: Omit<Payment, "id" | "paid_at">) => Promise<void>;
  onCancel: () => void;
  externalError?: string | null;
}

export default function PaymentForm({ balance, onSubmit, onCancel, externalError }: PaymentFormProps) {
  const { symbol, fmt } = useCurrency();
  const [type, setType] = useState<PaymentType>("add_money");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }
    if (type === "remove_money" && amt > balance) {
      setAmountError(`Cannot exceed fund balance of ${fmt(balance)}`);
      return false;
    }
    setAmountError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ type, amount: Number(amount), player_id: null });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Update Fund</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex rounded-lg border dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setType("add_money")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "add_money" ? "bg-green-700 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              + Add Money
            </button>
            <button
              type="button"
              onClick={() => setType("remove_money")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "remove_money" ? "bg-red-500 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              − Remove Money
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({symbol})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {amountError && <p className="text-red-500 text-xs mt-1">{amountError}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                type === "add_money" ? "bg-green-700 hover:bg-green-800" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {submitting ? "Saving…" : type === "add_money" ? "Add Money" : "Remove Money"}
            </button>
          </div>
          {externalError && <p className="text-red-500 text-xs mt-1">{externalError}</p>}
        </form>
      </div>
    </div>
  );
}

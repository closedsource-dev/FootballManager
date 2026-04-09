"use client";

import { useState } from "react";
import type { MoneyGoal } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface GoalFormProps {
  onSubmit: (goal: Omit<MoneyGoal, "id" | "created_at">) => Promise<void>;
  onCancel: () => void;
}

export default function GoalForm({ onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { symbol } = useCurrency();

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    const amt = Number(targetAmount);
    if (!targetAmount || isNaN(amt) || amt <= 0) next.targetAmount = "Target amount must be greater than 0";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), target_amount: Number(targetAmount) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add Money Goal</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New kit fund"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Amount ({symbol})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount}</p>}
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
              className="flex-1 bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

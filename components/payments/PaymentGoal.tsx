"use client";

import { useState } from "react";
import type { MoneyGoal } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PaymentGoalProps {
  goal: MoneyGoal;
  allocatedAmount: number;
  unallocatedBalance: number;
  onAllocate: (goalId: string, amount: number) => Promise<void>;
  onReset: (goalId: string) => Promise<void>;
  onComplete: (goalId: string) => Promise<void>;
  allocationError?: string | null;
}

export default function PaymentGoal({
  goal, allocatedAmount, unallocatedBalance,
  onAllocate, onReset, onComplete, allocationError,
}: PaymentGoalProps) {
  const { fmt } = useCurrency();
  const effectiveAmount = Math.min(allocatedAmount, goal.target_amount);
  const displayPercent = goal.target_amount > 0
    ? Math.min((effectiveAmount / goal.target_amount) * 100, 100) : 0;
  const isComplete = allocatedAmount >= goal.target_amount && allocatedAmount > 0;
  const hasAllocation = allocatedAmount > 0;

  const [inputValue, setInputValue] = useState(hasAllocation ? String(allocatedAmount) : "");
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<"reset" | "complete" | null>(null);

  async function handleAllocate() {
    const amount = Number(inputValue);
    if (!inputValue || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try { await onAllocate(goal.id, amount); } finally { setSaving(false); }
  }

  async function handleReset() {
    setSaving(true);
    try { await onReset(goal.id); setInputValue(""); } finally { setSaving(false); setAction(null); }
  }

  async function handleComplete() {
    setSaving(true);
    try { await onComplete(goal.id); } finally { setSaving(false); setAction(null); }
  }

  if (isComplete) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-xl p-6 sm:col-span-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300">{goal.title}</h3>
          </div>
          <span className="text-sm text-green-700 dark:text-green-400 shrink-0 ml-2">
            {fmt(effectiveAmount)} / {fmt(goal.target_amount)}
          </span>
        </div>
        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 mb-4">
          <div className="h-3 rounded-full bg-green-500 w-full transition-all" />
        </div>
        {allocatedAmount > goal.target_amount && (
          <p className="text-xs text-green-700 dark:text-green-400 mb-3">
            {fmt(allocatedAmount - goal.target_amount)} over target — only {fmt(goal.target_amount)} counted against balance.
          </p>
        )}
        {action === null && (
          <div className="flex gap-2">
            <button onClick={() => setAction("reset")}
              className="flex-1 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Reset goal
            </button>
            <button onClick={() => setAction("complete")}
              className="flex-1 bg-green-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-green-800 transition-colors">
              Complete goal
            </button>
          </div>
        )}
        {action === "reset" && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 mt-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Reset this goal? {fmt(effectiveAmount)} returns to your unallocated balance.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleReset} disabled={saving} className="flex-1 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                {saving ? "…" : "Reset"}
              </button>
            </div>
          </div>
        )}
        {action === "complete" && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 mt-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Complete this goal? {fmt(goal.target_amount)} is permanently spent.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleComplete} disabled={saving} className="flex-1 bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-800 disabled:opacity-50">
                {saving ? "…" : "Complete & close"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{goal.title}</h3>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Target: {fmt(goal.target_amount)}</span>
          {!hasAllocation && (
            <button onClick={() => setAction("reset")} className="text-xs text-red-400 hover:text-red-600 transition-colors" title="Delete goal">✕</button>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
        <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${displayPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>{fmt(effectiveAmount)} / {fmt(goal.target_amount)}</span>
        <span className="font-medium">{displayPercent.toFixed(0)}%</span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="number" min="0.01" step="0.01" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)} placeholder="Enter amount"
          className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button onClick={handleAllocate} disabled={saving || !inputValue}
          className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-800 transition-colors disabled:opacity-50">
          {saving ? "…" : hasAllocation ? "Update" : "Allocate"}
        </button>
        {hasAllocation && (
          <button onClick={handleReset} disabled={saving}
            className="border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            Reset
          </button>
        )}
      </div>
      {allocationError && <p className="text-red-500 text-xs mt-2">{allocationError}</p>}
      {action === "reset" && !hasAllocation && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Delete this goal?</p>
          <div className="flex gap-2">
            <button onClick={() => setAction(null)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button onClick={() => onReset(goal.id)} className="flex-1 bg-red-500 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-red-600">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

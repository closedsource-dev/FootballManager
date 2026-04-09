"use client";

import { useState } from "react";
import type { MoneyGoal } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PaymentGoalProps {
  goal: MoneyGoal;
  allocatedAmount: number;       // raw number the user typed (may exceed target)
  unallocatedBalance: number;    // already accounts for capped costs
  onAllocate: (goalId: string, amount: number) => Promise<void>;
  onReset: (goalId: string) => Promise<void>;       // return money to unallocated
  onComplete: (goalId: string) => Promise<void>;    // permanently spend target_amount
  allocationError?: string | null;
}

export default function PaymentGoal({
  goal,
  allocatedAmount,
  unallocatedBalance,
  onAllocate,
  onReset,
  onComplete,
  allocationError,
}: PaymentGoalProps) {
  const { fmt } = useCurrency();
  // Progress is capped at 100% — any overage above target is ignored visually
  const effectiveAmount = Math.min(allocatedAmount, goal.target_amount);
  const displayPercent = goal.target_amount > 0
    ? Math.min((effectiveAmount / goal.target_amount) * 100, 100)
    : 0;
  const isComplete = allocatedAmount >= goal.target_amount && allocatedAmount > 0;
  const hasAllocation = allocatedAmount > 0;

  const [inputValue, setInputValue] = useState(hasAllocation ? String(allocatedAmount) : "");
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<"reset" | "complete" | null>(null);

  async function handleAllocate() {
    const amount = Number(inputValue);
    if (!inputValue || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try { await onAllocate(goal.id, amount); }
    finally { setSaving(false); }
  }

  async function handleReset() {
    setSaving(true);
    try { await onReset(goal.id); setInputValue(""); }
    finally { setSaving(false); setAction(null); }
  }

  async function handleComplete() {
    setSaving(true);
    try { await onComplete(goal.id); }
    finally { setSaving(false); setAction(null); }
  }

  if (isComplete) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 sm:col-span-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <h3 className="text-lg font-bold text-green-800">{goal.title}</h3>
          </div>
          <span className="text-sm text-green-700 shrink-0 ml-2">
            {fmt(effectiveAmount)} / {fmt(goal.target_amount)}
          </span>
        </div>

        <div className="w-full bg-green-200 rounded-full h-3 mb-4">
          <div className="h-3 rounded-full bg-green-500 w-full transition-all" />
        </div>

        {allocatedAmount > goal.target_amount && (
          <p className="text-xs text-green-700 mb-3">
            {fmt(allocatedAmount - goal.target_amount)} over target — only {fmt(goal.target_amount)} is counted against your balance.
          </p>
        )}

        {action === null && (
          <div className="flex gap-2">
            <button
              onClick={() => setAction("reset")}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Reset goal
            </button>
            <button
              onClick={() => setAction("complete")}
              className="flex-1 bg-green-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-green-800 transition-colors"
            >
              Complete goal
            </button>
          </div>
        )}

        {action === "reset" && (
          <div className="p-3 bg-white rounded-lg border mt-2">
            <p className="text-sm text-gray-700 mb-3">
              Reset this goal? {fmt(effectiveAmount)} returns to your unallocated balance.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleReset} disabled={saving} className="flex-1 border border-gray-400 text-gray-700 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50">
                {saving ? "…" : "Reset"}
              </button>
            </div>
          </div>
        )}

        {action === "complete" && (
          <div className="p-3 bg-white rounded-lg border border-green-200 mt-2">
            <p className="text-sm text-gray-700 mb-3">
              Complete this goal? {fmt(goal.target_amount)} is permanently spent and removed from your balance.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleComplete} disabled={saving} className="flex-1 bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-800 disabled:opacity-50">
                {saving ? "…" : "Complete & close"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Incomplete goal
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{goal.title}</h3>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-gray-500">Target: {fmt(goal.target_amount)}</span>
          {!hasAllocation && (
            <button
              onClick={() => setAction("reset")}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
              title="Delete goal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="h-2.5 rounded-full bg-green-500 transition-all"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>{fmt(effectiveAmount)} / {fmt(goal.target_amount)}</span>
        <span className="font-medium">{displayPercent.toFixed(0)}%</span>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter amount"
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button
          onClick={handleAllocate}
          disabled={saving || !inputValue}
          className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
        >
          {saving ? "…" : hasAllocation ? "Update" : "Allocate"}
        </button>
        {hasAllocation && (
          <button
            onClick={handleReset}
            disabled={saving}
            className="border rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>

      {allocationError && (
        <p className="text-red-500 text-xs mt-2">{allocationError}</p>
      )}

      {/* Delete confirmation for goals with no allocation */}
      {action === "reset" && !hasAllocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-700 mb-3">Delete this goal?</p>
          <div className="flex gap-2">
            <button onClick={() => setAction(null)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={() => onReset(goal.id)} className="flex-1 bg-red-500 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-red-600">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

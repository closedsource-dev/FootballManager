"use client";

import { useEffect, useState } from "react";
import type { PaymentWithPlayer, MoneyGoal, BudgetSummary, Payment, GoalAllocation } from "@/types";
import { getPayments, logPayment, getBudgetSummary, createGoal, getGoals, deleteGoal } from "@/lib/payments";
import { getAllocations, setAllocation, removeAllocation, getUnallocatedBalance } from "@/lib/allocations";
import { useCurrency } from "@/lib/currencyContext";
import BudgetSummaryCard from "@/components/payments/BudgetSummary";
import PaymentForm from "@/components/payments/PaymentForm";
import PaymentHistory from "@/components/payments/PaymentHistory";
import PaymentGoal from "@/components/payments/PaymentGoal";
import GoalForm from "@/components/payments/GoalForm";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [goals, setGoals] = useState<MoneyGoal[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({ total_collected: 0, total_expenses: 0, balance: 0 });
  const [allocations, setAllocations] = useState<GoalAllocation[]>([]);
  const [allocationErrors, setAllocationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const { fmt } = useCurrency();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [pay, g, s, allocs] = await Promise.all([
        getPayments(), getGoals(), getBudgetSummary(), getAllocations(),
      ]);
      setPayments(pay); setGoals(g); setSummary(s); setAllocations(allocs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function buildTargets(): Record<string, number> {
    return Object.fromEntries(goals.map((g) => [g.id, g.target_amount]));
  }

  async function handleLogPayment(p: Omit<Payment, "id" | "paid_at">) {
    setPaymentError(null);
    if (p.type === "remove_money") {
      const targets = buildTargets();
      const unallocated = getUnallocatedBalance(summary.balance, allocations, targets);
      if (p.amount > summary.balance) {
        setPaymentError(`Cannot remove ${fmt(p.amount)} — balance is only ${fmt(summary.balance)}`);
        return;
      }
      if (p.amount > unallocated) {
        const excess = p.amount - unallocated;
        setPaymentError(
          `${fmt(excess)} of that amount is allocated to goals. Reset ${fmt(excess)} from your goals first, then try again.`
        );
        return;
      }
    }
    try {
      await logPayment(p);
      const [pay, s, allocs] = await Promise.all([
        getPayments(), getBudgetSummary(), getAllocations(),
      ]);
      setPayments(pay); setSummary(s); setAllocations(allocs);
      setShowPaymentForm(false);
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : "Failed to log payment");
    }
  }

  async function handleCreateGoal(goal: Omit<MoneyGoal, "id" | "created_at">) {
    try {
      await createGoal(goal);
      setGoals(await getGoals());
      setShowGoalForm(false);
    } catch (err: unknown) {
      throw err;
    }
  }

  async function handleReset(goalId: string) {
    await removeAllocation(goalId).catch(() => {});
    const alloc = allocations.find((a) => a.goal_id === goalId);
    if (!alloc) await deleteGoal(goalId);
    const [g, allocs] = await Promise.all([getGoals(), getAllocations()]);
    setGoals(g); setAllocations(allocs);
  }

  async function handleComplete(goalId: string) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    await logPayment({ type: "remove_money", amount: goal.target_amount, player_id: null });
    await removeAllocation(goalId).catch(() => {});
    await deleteGoal(goalId);
    const [g, allocs, pay, s] = await Promise.all([
      getGoals(), getAllocations(), getPayments(), getBudgetSummary(),
    ]);
    setGoals(g); setAllocations(allocs); setPayments(pay); setSummary(s);
  }

  async function handleAllocate(goalId: string, amount: number) {
    setAllocationErrors((prev) => ({ ...prev, [goalId]: "" }));
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    try {
      await setAllocation(goalId, amount, goal.target_amount, summary.balance);
      setAllocations(await getAllocations());
    } catch (err: unknown) {
      setAllocationErrors((prev) => ({
        ...prev,
        [goalId]: err instanceof Error ? err.message : "Failed to allocate",
      }));
    }
  }

  const targets = buildTargets();
  const unallocatedBalance = getUnallocatedBalance(summary.balance, allocations, targets);

  function getAllocatedAmount(goalId: string): number {
    return allocations.find((a) => a.goal_id === goalId)?.allocated_amount ?? 0;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Budget overview and fund management</p>
        </div>
        <button
          onClick={() => setShowPaymentForm(true)}
          className="bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
        >
          + Update Fund
        </button>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && (
        <div className="space-y-6">
          <BudgetSummaryCard summary={summary} unallocatedBalance={unallocatedBalance} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Money Goals</h2>
              <button
                onClick={() => setShowGoalForm(true)}
                className="text-sm border dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                + Add Goal
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-gray-400 text-sm">No goals set yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <PaymentGoal
                    key={goal.id}
                    goal={goal}
                    allocatedAmount={getAllocatedAmount(goal.id)}
                    unallocatedBalance={unallocatedBalance}
                    onAllocate={handleAllocate}
                    onReset={handleReset}
                    onComplete={handleComplete}
                    allocationError={allocationErrors[goal.id]}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Transaction History</h2>
            <PaymentHistory payments={payments} />
          </div>
        </div>
      )}

      {showPaymentForm && (
        <PaymentForm
          balance={summary.balance}
          onSubmit={handleLogPayment}
          onCancel={() => { setShowPaymentForm(false); setPaymentError(null); }}
          externalError={paymentError}
        />
      )}

      {showGoalForm && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setShowGoalForm(false)}
        />
      )}
    </div>
  );
}

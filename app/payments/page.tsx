"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Player, PaymentWithPlayer, Category, BudgetSummary, Payment } from "@/types";
import { getPlayers } from "@/lib/players";
import { getPayments, logPayment, getBudgetSummary, deletePayment } from "@/lib/payments";
import { getCategories, createCategory, deleteCategory } from "@/lib/categories";
import { useCurrency } from "@/lib/currencyContext";
import BudgetSummaryCard from "@/components/payments/BudgetSummary";
import PaymentForm from "@/components/payments/PaymentForm";
import PaymentHistory from "@/components/payments/PaymentHistory";
import CategoryCard from "@/components/payments/CategoryCard";
import CategoryForm from "@/components/payments/CategoryForm";
import CategoryDetails from "@/components/payments/CategoryDetails";
import PlayerTransactionsTable from "@/components/payments/PlayerTransactionsTable";

export default function PaymentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"general" | "players">("general");
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({ total_collected: 0, total_expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [pay, c, s, p] = await Promise.all([
        getPayments(), getCategories(), getBudgetSummary(), getPlayers(),
      ]);
      setPayments(pay); setCategories(c); setSummary(s); setPlayers(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogPayment(p: Omit<Payment, "id">) {
    setPaymentError(null);
    try {
      await logPayment(p);
      await loadAll();
      setShowPaymentForm(false);
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : "Failed to log payment");
    }
  }

  async function handleCreateCategory(category: Omit<Category, "id" | "created_at">) {
    try {
      await createCategory(category);
      setCategories(await getCategories());
      setShowCategoryForm(false);
    } catch (err: unknown) {
      throw err;
    }
  }

  async function handleAddToCategory(categoryId: string, amount: number, playerId: string | null, date: string, description?: string) {
    // When a player contributes to a category:
    // - Use "add_money" type so player's balance increases
    // - But the trigger will still add to category amount (we need to update the trigger logic)
    const payDateISO = new Date(date + 'T12:00:00').toISOString();
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || "category";
    
    await logPayment({
      type: "add_money",
      amount,
      category_id: categoryId,
      player_id: playerId,
      description: description || (playerId ? `Player contribution to "${categoryName}"` : `Allocated to "${categoryName}"`),
      paid_at: payDateISO,
    });
    await loadAll();
  }

  async function handleDeleteCategory(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Get all payments for this category
    const categoryPayments = payments.filter(p => p.category_id === categoryId);
    
    // Simply delete all payments associated with this category
    // The database triggers will automatically handle the balance adjustments
    for (const payment of categoryPayments) {
      await deletePayment(payment.id);
    }

    // Delete the category
    await deleteCategory(categoryId);
    await loadAll();
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6 w-fit">
        {(["general", "players"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t === "general" ? "General" : "Player Transactions"}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && tab === "general" && (
        <div className="space-y-6">
          <BudgetSummaryCard summary={summary} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Categories</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="text-sm border dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                + Add Category
              </button>
            </div>
            {categories.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No categories yet. Create one to organize your funds.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    players={players}
                    payments={payments}
                    onAddMoney={handleAddToCategory}
                    onDelete={handleDeleteCategory}
                    onViewDetails={setSelectedCategory}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Recent Transactions</h2>
            <PaymentHistory payments={payments} limit={10} onViewAll={() => router.push('/payments/history')} />
          </div>
        </div>
      )}

      {!loading && tab === "players" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Player Balances</h2>
          <PlayerTransactionsTable players={players} />
        </div>
      )}

      {showPaymentForm && (
        <PaymentForm
          balance={summary.balance}
          players={players}
          categories={categories}
          onSubmit={handleLogPayment}
          onCancel={() => { setShowPaymentForm(false); setPaymentError(null); }}
          externalError={paymentError}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setShowCategoryForm(false)}
        />
      )}

      {selectedCategory && (
        <CategoryDetails
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}

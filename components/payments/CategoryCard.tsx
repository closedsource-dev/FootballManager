"use client";

import { useState } from "react";
import type { Category } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface CategoryCardProps {
  category: Category;
  onAddMoney: (categoryId: string, amount: number) => Promise<void>;
  onRemoveMoney: (categoryId: string, amount: number) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
}

export default function CategoryCard({ category, onAddMoney, onRemoveMoney, onDelete }: CategoryCardProps) {
  const { fmt } = useCurrency();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  async function handleAdd() {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onAddMoney(category.id, amt);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add money");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amt > category.amount) {
      setError(`Cannot exceed category balance of ${fmt(category.amount)}`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onRemoveMoney(category.id, amt);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove money");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await onDelete(category.id);
    } finally {
      setLoading(false);
      setShowDelete(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{category.name}</h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{fmt(category.amount)}</p>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete category"
        >
          ✕
        </button>
      </div>

      {!showDelete ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex-1 bg-green-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              + Add
            </button>
            <button
              onClick={handleRemove}
              disabled={loading || category.amount <= 0}
              className="flex-1 border border-red-200 dark:border-red-800 text-red-500 rounded-lg px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              − Remove
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Delete "{category.name}"? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

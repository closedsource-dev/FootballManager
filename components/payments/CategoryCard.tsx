"use client";

import { useState } from "react";
import type { Category, Player, PaymentWithPlayer } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface CategoryCardProps {
  category: Category;
  players: Player[];
  payments: PaymentWithPlayer[];
  onAddMoney: (categoryId: string, amount: number, playerId: string | null, date: string) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  onViewDetails: (category: Category) => void;
}

export default function CategoryCard({ category, players, payments, onAddMoney, onDelete, onViewDetails }: CategoryCardProps) {
  const { fmt } = useCurrency();
  const [amount, setAmount] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Calculate general fund vs player contributions
  const categoryPayments = payments.filter(p => p.category_id === category.id && p.type === "add_money");
  const generalAmount = categoryPayments
    .filter(p => !p.player_id)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const playerAmount = categoryPayments
    .filter(p => p.player_id)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  async function handleAdd() {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onAddMoney(category.id, amt, selectedPlayer || null, selectedDate);
      setAmount("");
      setSelectedPlayer("");
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add money");
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
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{category.name}</h3>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{fmt(category.amount)}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>General: {fmt(generalAmount)}</span>
            <span>•</span>
            <span>Players: {fmt(playerAmount)}</span>
          </div>
          <button
            onClick={() => onViewDetails(category)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            View player contributions →
          </button>
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
          <div className="space-y-2 mb-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">No player (general fund)</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-green-700 text-white rounded-lg px-3 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            + Add Money
          </button>
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

"use client";

import { useEffect, useState } from "react";
import { getPayments } from "@/lib/payments";
import { getPlayers } from "@/lib/players";
import type { Category, PaymentWithPlayer, Player } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface CategoryDetailsProps {
  category: Category;
  onClose: () => void;
}

export default function CategoryDetails({ category, onClose }: CategoryDetailsProps) {
  const { fmt } = useCurrency();
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPayments(), getPlayers()])
      .then(([p, pl]) => {
        setPayments(p);
        setPlayers(pl);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calculate contributions per player for this category
  const playerContributions = players.map((player) => {
    const playerCategoryPayments = payments.filter(
      (p) => p.player_id === player.id && p.category_id === category.id
    );

    const totalContributed = playerCategoryPayments.reduce((sum, p) => {
      if (p.type === "add_money") return sum + Number(p.amount);
      return sum;
    }, 0);

    return {
      player,
      amount: totalContributed,
    };
  }).filter(pc => pc.amount > 0);

  const sorted = [...playerContributions].sort((a, b) => b.amount - a.amount);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{category.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total: <span className="font-semibold text-green-700 dark:text-green-400">{fmt(category.amount)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">Loading...</p>
          ) : sorted.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              No player contributions yet.
            </p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Player Contributions</h3>
              {sorted.map(({ player, amount }) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{player.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{player.position}</p>
                  </div>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">{fmt(amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

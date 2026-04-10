"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getPlayers } from "@/lib/players";
import { getBudgetSummary, logPayment } from "@/lib/payments";
import { getGameLogs } from "@/lib/games";
import { getCategories } from "@/lib/categories";
import { useCurrency } from "@/lib/currencyContext";
import { getRank, getNextRank, RANKS } from "@/lib/ranks";
import type { Player, BudgetSummary, Category } from "@/types";

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamGames, setTeamGames] = useState(0);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const { fmt } = useCurrency();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [p, s, games, c] = await Promise.all([
        getPlayers(),
        getBudgetSummary(),
        getGameLogs(),
        getCategories()
      ]);
      setPlayers(p);
      setSummary(s);
      setTeamGames(games.length);
      setCategories(c);
    } catch {
      // fail silently on dashboard
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCategory(categoryId: string) {
    const amount = Number(categoryAmounts[categoryId]);
    if (!amount || amount <= 0) return;
    
    setAddingToCategory(categoryId);
    try {
      await logPayment({
        type: "add_money",
        amount,
        category_id: categoryId,
        player_id: null,
        description: "Added from dashboard",
        paid_at: new Date().toISOString(),
      });
      setCategoryAmounts((prev) => ({ ...prev, [categoryId]: "" }));
      await load();
    } finally {
      setAddingToCategory(null);
    }
  }

  const totalGames = teamGames;
  const rank = getRank(totalGames);
  const nextRank = getNextRank(totalGames);
  const progressToNext = nextRank
    ? ((totalGames - rank.minGames) / (nextRank.minGames - rank.minGames)) * 100
    : 100;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Welcome to Football Manager. Use the nav to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total Players */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Players</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">{loading ? "—" : players.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {players.length === 22 ? "Ready to generate teams" : `${Math.max(0, 22 - players.length)} more for full squad`}
          </p>
        </div>

        {/* Fund Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fund Balance</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
            {loading || !summary ? "—" : fmt(summary.balance)}
          </p>
          {summary && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {fmt(summary.total_collected)} in · {fmt(summary.total_expenses)} out
            </p>
          )}
        </div>

        {/* Games Played */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Games Played</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">{loading ? "—" : totalGames}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total team games logged</p>
        </div>
      </div>

      {/* Rank card */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <Image src={rank.image} alt={rank.name} width={120} height={132} className="object-contain drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-2xl font-bold ${rank.color}`}>{rank.name}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500">{totalGames} games played</span>
              </div>
              {nextRank ? (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1.5">
                    <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {nextRank.minGames - totalGames} more games to reach{" "}
                    <span className={`font-semibold ${nextRank.color}`}>{nextRank.name}</span>
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum rank reached 🏆</p>
              )}
            </div>
            <div className="hidden sm:flex flex-col gap-1 shrink-0">
              {RANKS.map((r) => (
                <div key={r.name} className="flex items-center gap-1.5">
                  <Image src={r.image} alt={r.name} width={24} height={26} className="object-contain" />
                  <span className={`text-xs font-medium ${r.name === rank.name ? r.color : "text-gray-300 dark:text-gray-600"}`}>
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {!loading && categories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Fund Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                <div className="mb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{category.name}</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{fmt(category.amount)}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={categoryAmounts[category.id] || ""}
                    onChange={(e) => setCategoryAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))}
                    placeholder="Amount"
                    className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    onClick={() => handleAddToCategory(category.id)}
                    disabled={addingToCategory === category.id || !categoryAmounts[category.id]}
                    className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {addingToCategory === category.id ? "..." : "+ Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

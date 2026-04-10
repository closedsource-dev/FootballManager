"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getPlayers } from "@/lib/players";
import { getBudgetSummary, logPayment } from "@/lib/payments";
import { getGameLogs } from "@/lib/games";
import { getCategories } from "@/lib/categories";
import { getCurrentUserProfile } from "@/lib/sharing";
import { useCurrency } from "@/lib/currencyContext";
import { getRank, getNextRank, RANKS } from "@/lib/ranks";
import type { Player, BudgetSummary, Category } from "@/types";

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamGames, setTeamGames] = useState(0);
  const [teamGamesYTD, setTeamGamesYTD] = useState(0);
  const [gamesTimeframe, setGamesTimeframe] = useState<"ytd" | "all">("all");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"ytd" | "all">("ytd");
  const [topPlayersYTD, setTopPlayersYTD] = useState<(Player & { ytdGames: number })[]>([]);
  const [topPlayersAll, setTopPlayersAll] = useState<(Player & { allGames: number })[]>([]);
  const [runnerUpsYTD, setRunnerUpsYTD] = useState<(Player & { ytdGames: number })[]>([]);
  const [runnerUpsAll, setRunnerUpsAll] = useState<(Player & { allGames: number })[]>([]);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryAmount, setCategoryAmount] = useState("");
  const [categoryPlayer, setCategoryPlayer] = useState("");
  const [categoryDate, setCategoryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const { fmt } = useCurrency();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [p, s, games, c, profile] = await Promise.all([
        getPlayers(),
        getBudgetSummary(),
        getGameLogs(),
        getCategories(),
        getCurrentUserProfile()
      ]);
      
      setUsername(profile?.username || null);
      setPlayers(p);
      setSummary(s);
      setTeamGames(games.length);
      
      // Calculate YTD games (games from this year)
      const currentYear = new Date().getFullYear();
      const ytdGames = games.filter(game => {
        const gameYear = new Date(game.played_at).getFullYear();
        return gameYear === currentYear;
      });
      setTeamGamesYTD(ytdGames.length);
      
      // Calculate YTD games per player
      const playerYTDGames = p.map(player => {
        const gamesPlayed = ytdGames.filter(game => 
          game.team_a_ids.includes(player.id) || game.team_b_ids.includes(player.id)
        ).length;
        return { ...player, ytdGames: gamesPlayed };
      });
      
      // Calculate all-time games per player
      const playerAllGames = p.map(player => {
        const gamesPlayed = games.filter(game => 
          game.team_a_ids.includes(player.id) || game.team_b_ids.includes(player.id)
        ).length;
        return { ...player, allGames: gamesPlayed };
      });
      
      // Get top 5 players by YTD games
      const top5YTD = playerYTDGames
        .filter(p => p.ytdGames > 0)
        .sort((a, b) => b.ytdGames - a.ytdGames)
        .slice(0, 5);
      
      setTopPlayersYTD(top5YTD.slice(0, 3)); // Top 3 for podium
      setRunnerUpsYTD(top5YTD.slice(3, 5)); // 4th and 5th place
      
      // Get top 5 players by all-time games
      const top5All = playerAllGames
        .filter(p => p.allGames > 0)
        .sort((a, b) => b.allGames - a.allGames)
        .slice(0, 5);
      
      setTopPlayersAll(top5All.slice(0, 3)); // Top 3 for podium
      setRunnerUpsAll(top5All.slice(3, 5)); // 4th and 5th place
      
      setCategories(c);
    } catch {
      // fail silently on dashboard
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCategory(categoryId: string) {
    const amount = Number(categoryAmount);
    if (!categoryAmount || amount <= 0) {
      setCategoryError("Enter a valid amount");
      return;
    }
    
    setCategoryError("");
    setAddingToCategory(categoryId);
    try {
      const payDateISO = new Date(categoryDate + 'T12:00:00').toISOString();
      await logPayment({
        type: "add_money",
        amount,
        category_id: categoryId,
        player_id: categoryPlayer || null,
        description: categoryDescription.trim() || (categoryPlayer ? "Player contribution from dashboard" : "Allocated from dashboard"),
        paid_at: payDateISO,
      });
      setCategoryAmount("");
      setCategoryPlayer("");
      setCategoryDescription("");
      const today = new Date();
      setCategoryDate(today.toISOString().split('T')[0]);
      setShowCategoryModal(false);
      setSelectedCategoryId("");
      await load();
    } finally {
      setAddingToCategory(null);
    }
  }

  function openCategoryModal(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setCategoryAmount("");
    setCategoryPlayer("");
    setCategoryDescription("");
    const today = new Date();
    setCategoryDate(today.toISOString().split('T')[0]);
    setCategoryError("");
    setShowCategoryModal(true);
  }

  const totalGames = teamGames; // Rank always based on all-time games
  const displayGames = gamesTimeframe === "ytd" ? teamGamesYTD : teamGames;
  const rank = getRank(totalGames);
  const nextRank = getNextRank(totalGames);
  const progressToNext = nextRank
    ? ((totalGames - rank.minGames) / (nextRank.minGames - rank.minGames)) * 100
    : 100;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        {username ? `${username}'s Dashboard` : "Dashboard"}
      </h1>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Games Played</p>
            <div className="flex rounded-lg border dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setGamesTimeframe("ytd")}
                className={`text-xs px-2 py-0.5 transition-colors ${
                  gamesTimeframe === "ytd"
                    ? "bg-green-700 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                YTD
              </button>
              <button
                onClick={() => setGamesTimeframe("all")}
                className={`text-xs px-2 py-0.5 transition-colors ${
                  gamesTimeframe === "all"
                    ? "bg-green-700 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                All
              </button>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
            {loading ? "—" : displayGames}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {gamesTimeframe === "ytd" ? "Games this year" : "Total team games logged"}
          </p>
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
                <span className="text-sm text-gray-400 dark:text-gray-500">{totalGames} total games</span>
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
                <button
                  onClick={() => openCategoryModal(category.id)}
                  disabled={addingToCategory === category.id}
                  className="w-full bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {addingToCategory === category.id ? "..." : "+ Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard - Top 5 */}
      {!loading && players.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Most Games Played {leaderboardTimeframe === "ytd" ? "YTD" : "All Time"} Leaderboard
            </h2>
            <div className="flex rounded-lg border dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setLeaderboardTimeframe("ytd")}
                className={`text-xs px-3 py-1 transition-colors ${
                  leaderboardTimeframe === "ytd"
                    ? "bg-green-700 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                YTD
              </button>
              <button
                onClick={() => setLeaderboardTimeframe("all")}
                className={`text-xs px-3 py-1 transition-colors ${
                  leaderboardTimeframe === "all"
                    ? "bg-green-700 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                All Time
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-6">
            {(leaderboardTimeframe === "ytd" ? topPlayersYTD : topPlayersAll).length > 0 ? (
              <>
                {/* Podium - Top 3 */}
                <div className="flex items-end justify-center gap-4 mb-6">
                  {/* 2nd Place - Left */}
                  {(leaderboardTimeframe === "ytd" ? topPlayersYTD[1] : topPlayersAll[1]) && (
                    <div className="flex flex-col items-center">
                      <div className="text-center mb-2">
                        <p className="text-2xl mb-1">🥈</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[1].name : topPlayersAll[1].name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[1].ytdGames : topPlayersAll[1].allGames} games
                        </p>
                      </div>
                      <div className="h-32 bg-gray-300 dark:bg-gray-600 w-24 rounded-t-lg flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">2</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place - Center (Tallest) */}
                  {(leaderboardTimeframe === "ytd" ? topPlayersYTD[0] : topPlayersAll[0]) && (
                    <div className="flex flex-col items-center">
                      <div className="text-center mb-2">
                        <p className="text-3xl mb-1">🥇</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[0].name : topPlayersAll[0].name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[0].ytdGames : topPlayersAll[0].allGames} games
                        </p>
                      </div>
                      <div className="h-40 bg-yellow-400 dark:bg-yellow-500 w-28 rounded-t-lg flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">1</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place - Right */}
                  {(leaderboardTimeframe === "ytd" ? topPlayersYTD[2] : topPlayersAll[2]) && (
                    <div className="flex flex-col items-center">
                      <div className="text-center mb-2">
                        <p className="text-2xl mb-1">🥉</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[2].name : topPlayersAll[2].name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {leaderboardTimeframe === "ytd" ? topPlayersYTD[2].ytdGames : topPlayersAll[2].allGames} games
                        </p>
                      </div>
                      <div className="h-28 bg-orange-400 dark:bg-orange-500 w-24 rounded-t-lg flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">3</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Runner-ups - 4th and 5th */}
                {(leaderboardTimeframe === "ytd" ? runnerUpsYTD : runnerUpsAll).length > 0 && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">Runner-ups</p>
                    <div className="flex justify-center gap-6">
                      {(leaderboardTimeframe === "ytd" ? runnerUpsYTD : runnerUpsAll).map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2">
                          <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">{index + 4}</span>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{player.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {leaderboardTimeframe === "ytd" ? (player as any).ytdGames : (player as any).allGames} games
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                No games played {leaderboardTimeframe === "ytd" ? "this year" : ""} yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Category contribution modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              Add to {categories.find(c => c.id === selectedCategoryId)?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Current: {fmt(categories.find(c => c.id === selectedCategoryId)?.amount || 0)}
            </p>
            <div className="space-y-3">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={categoryAmount}
                onChange={(e) => setCategoryAmount(e.target.value)}
                placeholder="Amount"
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <select
                value={categoryPlayer}
                onChange={(e) => setCategoryPlayer(e.target.value)}
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
                value={categoryDate}
                onChange={(e) => setCategoryDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="text"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {categoryError && <p className="text-red-500 text-xs">{categoryError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedCategoryId("");
                  setCategoryError("");
                }}
                className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddToCategory(selectedCategoryId)}
                disabled={!!addingToCategory}
                className="flex-1 bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                {addingToCategory ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getGameLogs, type GameLog } from "@/lib/games";
import type { Player } from "@/types";

interface GameStatsProps {
  players: Player[];
}

interface PlayerStats {
  id: string;
  name: string;
  position: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  DEF: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MID: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  FWD: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function GameStats({ players }: GameStatsProps) {
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getGameLogs().then(setGameLogs).finally(() => setLoading(false));
  }, []);

  // Filter games by date range
  const filteredGames = gameLogs.filter((game) => {
    const gameDate = new Date(game.played_at);
    if (startDate && gameDate < new Date(startDate + 'T00:00:00')) return false;
    if (endDate && gameDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  // Calculate stats for each player based on filtered games
  const playerStats: PlayerStats[] = players.map((player) => {
    let gamesPlayed = 0;
    let gamesWon = 0;

    filteredGames.forEach((game) => {
      const isInTeamA = game.team_a_ids.includes(player.id);
      const isInTeamB = game.team_b_ids.includes(player.id);

      if (isInTeamA || isInTeamB) {
        gamesPlayed++;
        if ((isInTeamA && game.winner === "A") || (isInTeamB && game.winner === "B")) {
          gamesWon++;
        }
      }
    });

    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

    return {
      id: player.id,
      name: player.name,
      position: player.position,
      gamesPlayed,
      gamesWon,
      winRate,
    };
  });

  // Sort by games played (descending), then by win rate
  const sortedStats = [...playerStats].sort((a, b) => {
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return b.winRate - a.winRate;
  });

  function clearDates() {
    setStartDate("");
    setEndDate("");
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading stats…</p>;

  return (
    <div>
      {/* Date range filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Filter by Date Range</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || new Date().toISOString().split('T')[0]}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button
            onClick={clearDates}
            disabled={!startDate && !endDate}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing stats for {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
          {startDate || endDate ? (
            <span>
              {' '}from {startDate || 'beginning'} to {endDate || 'today'}
            </span>
          ) : (
            ' (all time)'
          )}
        </p>
      </div>

      {/* Stats table */}
      <div className="overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Position</th>
              <th className="px-4 py-3 text-left">Games Played</th>
              <th className="px-4 py-3 text-left">Games Won</th>
              <th className="px-4 py-3 text-left">Win Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No game data available for the selected date range
                </td>
              </tr>
            ) : (
              sortedStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{stat.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${positionColors[stat.position] ?? "bg-gray-100 text-gray-700"}`}>
                      {stat.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{stat.gamesPlayed}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{stat.gamesWon}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{ width: `${stat.winRate}%` }}
                        />
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{stat.winRate.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

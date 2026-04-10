"use client";

import type { Player } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PlayerTransactionsTableProps {
  players: Player[];
}

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  DEF: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MID: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  FWD: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function PlayerTransactionsTable({ players }: PlayerTransactionsTableProps) {
  const { fmt } = useCurrency();

  if (players.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-10 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No players yet.</p>
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Player</th>
            <th className="px-4 py-3 text-left">Position</th>
            <th className="px-4 py-3 text-left">Balance</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {sorted.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{player.name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${positionColors[player.position] ?? "bg-gray-100 text-gray-700"}`}>
                  {player.position}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-green-700 dark:text-green-400">{fmt(player.amount_paid)}</td>
              <td className="px-4 py-3">
                {player.has_paid ? (
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Paid</span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Not paid</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

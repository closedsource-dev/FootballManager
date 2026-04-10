"use client";

import { useState } from "react";
import type { Player } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface Props {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onPay: (player: Player) => void;
}

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-purple-100 text-purple-800",
  FWD: "bg-red-100 text-red-800",
};

type SortKey = "name" | "skill" | "position" | "winrate";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "skill", label: "Skill (High–Low)" },
  { key: "position", label: "Position" },
  { key: "winrate", label: "Win Rate" },
];

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];

function sortPlayers(players: Player[], key: SortKey): Player[] {
  return [...players].sort((a, b) => {
    switch (key) {
      case "name": return a.name.localeCompare(b.name);
      case "skill": return b.skill_rating - a.skill_rating;
      case "position": return POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position);
      case "winrate": {
        const wr = (p: Player) => p.games_played > 0 ? p.games_won / p.games_played : 0;
        return wr(b) - wr(a);
      }
    }
  });
}

export default function PlayerTable({ players, onEdit, onDelete, onPay }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const { fmt } = useCurrency();

  if (players.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm mt-8 text-center">No players yet. Add one to get started.</p>;
  }

  const sorted = sortPlayers(players, sortKey);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sortKey === opt.key
                ? "bg-green-700 text-white border-green-700"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Position</th>
              <th className="px-4 py-3 text-left">Skill</th>
              <th className="px-4 py-3 text-left">Balance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map((player) => {
              return (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{player.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${positionColors[player.position] ?? "bg-gray-100 text-gray-700"}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{ width: `${(player.skill_rating / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{player.skill_rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700 dark:text-green-400">{fmt(player.amount_paid)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => onPay(player)}
                      className="text-xs px-3 py-1 rounded-lg border border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() => onEdit(player)}
                      className="text-xs px-3 py-1 rounded-lg border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(player)}
                      className="text-xs px-3 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

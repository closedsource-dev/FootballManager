"use client";

import { useState } from "react";
import type { Player } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface Props {
  players: Player[];
  onAdd: (playerId: string, amount: number) => Promise<void>;
  onSubtract: (playerId: string, amount: number) => Promise<void>;
}

export default function PlayerContributions({ players, onAdd, onSubtract }: Props) {
  const { fmt } = useCurrency();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (players.length === 0) {
    return <p className="text-gray-400 text-sm">No players yet.</p>;
  }

  function getAmount(id: string) {
    return amounts[id] ?? "";
  }

  async function handle(playerId: string, type: "add" | "subtract") {
    const raw = amounts[playerId];
    const amt = Number(raw);
    if (!raw || isNaN(amt) || amt <= 0) {
      setErrors((e) => ({ ...e, [playerId]: "Enter a valid amount" }));
      return;
    }
    const player = players.find((p) => p.id === playerId);
    if (type === "subtract" && player && amt > player.amount_paid) {
      setErrors((e) => ({ ...e, [playerId]: `Cannot exceed current balance of ${fmt(player.amount_paid)}` }));
      return;
    }
    setErrors((e) => ({ ...e, [playerId]: "" }));
    setLoading((l) => ({ ...l, [playerId]: true }));
    try {
      if (type === "add") await onAdd(playerId, amt);
      else await onSubtract(playerId, amt);
      setAmounts((a) => ({ ...a, [playerId]: "" }));
    } finally {
      setLoading((l) => ({ ...l, [playerId]: false }));
    }
  }

  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white rounded-xl border shadow-sm divide-y">
      {sorted.map((player) => (
        <div key={player.id} className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">{player.name}</span>
            <span className="text-sm font-bold text-green-700">{fmt(player.amount_paid)}</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={getAmount(player.id)}
              onChange={(e) => setAmounts((a) => ({ ...a, [player.id]: e.target.value }))}
              placeholder="Amount"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              onClick={() => handle(player.id, "add")}
              disabled={loading[player.id]}
              className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              + Add
            </button>
            <button
              onClick={() => handle(player.id, "subtract")}
              disabled={loading[player.id] || player.amount_paid <= 0}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              − Sub
            </button>
          </div>
          {errors[player.id] && (
            <p className="text-red-500 text-xs mt-1">{errors[player.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

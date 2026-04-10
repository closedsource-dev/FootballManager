"use client";

import { useEffect, useState } from "react";
import { getPayments } from "@/lib/payments";
import type { Player, PaymentWithPlayer } from "@/types";
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
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getPayments().then(setPayments).finally(() => setLoading(false));
  }, []);

  // Calculate amount paid per player in date range
  const playerAmounts = players.map((player) => {
    const playerPayments = payments.filter((p) => {
      if (p.player_id !== player.id) return false;
      
      const paymentDate = new Date(p.paid_at);
      if (startDate && paymentDate < new Date(startDate + 'T00:00:00')) return false;
      if (endDate && paymentDate > new Date(endDate + 'T23:59:59')) return false;
      
      return true;
    });

    const totalPaid = playerPayments.reduce((sum, p) => {
      if (p.type === "add_money") return sum + Number(p.amount);
      if (p.type === "remove_money") return sum - Number(p.amount);
      return sum;
    }, 0);

    return {
      ...player,
      amountInRange: totalPaid,
    };
  });

  const sorted = [...playerAmounts].sort((a, b) => a.name.localeCompare(b.name));

  function clearDates() {
    setStartDate("");
    setEndDate("");
  }

  if (players.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-10 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No players yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
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
          {startDate || endDate ? (
            <span>
              Showing payments from {startDate || 'beginning'} to {endDate || 'today'}
            </span>
          ) : (
            'Showing all-time totals'
          )}
        </p>
      </div>

      {/* Player table */}
      <div className="overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Position</th>
              <th className="px-4 py-3 text-left">
                {startDate || endDate ? 'Amount in Range' : 'Total Paid'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  Loading...
                </td>
              </tr>
            ) : (
              sorted.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{player.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${positionColors[player.position] ?? "bg-gray-100 text-gray-700"}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{fmt(player.amountInRange)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

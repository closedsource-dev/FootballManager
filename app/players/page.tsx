"use client";

import { useEffect, useState } from "react";
import PlayerTable from "@/components/players/PlayerTable";
import PlayerForm from "@/components/players/PlayerForm";
import { getPlayers, addPlayer, updatePlayer, deletePlayer } from "@/lib/players";
import { logPayment } from "@/lib/payments";
import { useCurrency } from "@/lib/currencyContext";
import type { Player, PlayerFormData } from "@/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPlayer, setModalPlayer] = useState<Player | undefined | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Payment modal
  const [payTarget, setPayTarget] = useState<Player | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payType, setPayType] = useState<"add" | "subtract">("add");
  const [payDate, setPayDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);

  const { fmt } = useCurrency();

  useEffect(() => { fetchPlayers(); }, []);

  async function fetchPlayers() {
    setLoading(true);
    setError(null);
    try {
      setPlayers(await getPlayers());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(form: PlayerFormData) {
    const isDuplicate = players.some(
      (p) => p.name.trim().toLowerCase() === form.name.trim().toLowerCase() && p.id !== modalPlayer?.id
    );
    if (isDuplicate) throw new Error(`A player named "${form.name}" already exists`);
    if (modalPlayer) {
      const updated = await updatePlayer(modalPlayer.id, form);
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await addPlayer(form);
      setPlayers((prev) => [created, ...prev]);
    }
    setModalPlayer(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlayer(deleteTarget.id);
      setPlayers((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handlePay() {
    if (!payTarget) return;
    const amt = Number(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError("Enter a valid amount greater than 0");
      return;
    }
    if (payType === "subtract" && amt > payTarget.amount_paid) {
      setPayError(`Cannot exceed current balance of ${fmt(payTarget.amount_paid)}`);
      return;
    }
    setPayError("");
    setPaying(true);
    try {
      const payDateISO = new Date(payDate + 'T12:00:00').toISOString();
      await logPayment({
        type: payType === "add" ? "add_money" : "remove_money",
        amount: amt,
        player_id: payTarget.id,
        description: payDesc.trim(),
        paid_at: payDateISO,
      });
      const updated = await getPlayers();
      setPlayers(updated);
      setPayTarget(null);
      setPayAmount("");
      setPayDesc("");
      const today = new Date();
      setPayDate(today.toISOString().split('T')[0]);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Players</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{players.length} on roster</p>
        </div>
        <button
          onClick={() => setModalPlayer(undefined)}
          className="bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
        >
          + Add Player
        </button>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading players...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && (
        <PlayerTable
          players={players}
          onEdit={(player) => setModalPlayer(player)}
          onDelete={(player) => setDeleteTarget(player)}
          onPay={(player) => { 
            setPayTarget(player); 
            setPayAmount(""); 
            setPayDesc(""); 
            setPayType("add"); 
            const today = new Date();
            setPayDate(today.toISOString().split('T')[0]);
            setPayError(""); 
          }}
        />
      )}

      {/* Add / Edit modal */}
      {modalPlayer !== null && (
        <PlayerForm
          initial={modalPlayer}
          onSubmit={handleSubmit}
          onCancel={() => setModalPlayer(null)}
        />
      )}

      {/* Payment modal */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Payment — {payTarget.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Current balance: {fmt(payTarget.amount_paid)}</p>
            <div className="flex rounded-lg border dark:border-gray-600 overflow-hidden mb-4">
              <button
                type="button"
                onClick={() => setPayType("add")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${payType === "add" ? "bg-green-700 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
              >
                + Add
              </button>
              <button
                type="button"
                onClick={() => setPayType("subtract")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${payType === "subtract" ? "bg-red-500 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
              >
                − Subtract
              </button>
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 mb-2"
            />
            {payError && <p className="text-red-500 text-xs mb-2">{payError}</p>}
            <input
              type="text"
              value={payDesc}
              onChange={(e) => setPayDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 mb-2"
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Date</label>
              <input 
                type="date" 
                value={payDate} 
                onChange={(e) => setPayDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setPayTarget(null)}
                className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={paying}
                className={`flex-1 text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 ${payType === "add" ? "bg-green-700 hover:bg-green-800" : "bg-red-500 hover:bg-red-600"}`}
              >
                {paying ? "Saving…" : payType === "add" ? "Add" : "Subtract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Remove Player</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove <span className="font-semibold">{deleteTarget.name}</span> from the roster? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

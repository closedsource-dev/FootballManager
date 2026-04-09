"use client";

import { useState } from "react";
import type { Player, PlayerFormData, Position } from "@/types";

const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

interface Props {
  initial?: Player;
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function PlayerForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [position, setPosition] = useState<Position>(initial?.position ?? "MID");
  const [skillRating, setSkillRating] = useState(initial?.skill_rating ?? 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data: PlayerFormData = {
        name,
        position,
        skill_rating: skillRating,
        has_paid: initial?.has_paid ?? false,
        amount_paid: initial?.amount_paid ?? 0,
        games_played: initial?.games_played ?? 0,
        games_won: initial?.games_won ?? 0,
      };
      await onSubmit(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          {initial ? "Edit Player" : "Add Player"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Player name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skill Rating — {skillRating} / 20
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={skillRating}
              onChange={(e) => setSkillRating(Number(e.target.value))}
              className="w-full accent-green-700"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              <span>1</span><span>20</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-2 rounded-lg border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-sm px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : initial ? "Save Changes" : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

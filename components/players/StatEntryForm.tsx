"use client";

import { useState } from "react";
import type { Player, PlayerStats } from "@/types";

interface StatEntryFormProps {
  player: Player;
  onSubmit: (stats: Omit<PlayerStats, "id" | "player_id">) => Promise<void>;
  onCancel: () => void;
}

type FieldConfig = { key: keyof Omit<PlayerStats, "id" | "player_id" | "recorded_at">; label: string };

const POSITION_FIELDS: Record<string, FieldConfig[]> = {
  GK: [
    { key: "games_played", label: "Games Played" },
    { key: "saves", label: "Saves" },
    { key: "goals_conceded", label: "Goals Conceded" },
    { key: "clean_sheets", label: "Clean Sheets" },
  ],
  DEF: [
    { key: "games_played", label: "Games Played" },
    { key: "tackles", label: "Tackles" },
    { key: "interceptions", label: "Interceptions" },
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
  ],
  MID: [
    { key: "games_played", label: "Games Played" },
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "key_passes", label: "Key Passes" },
  ],
  FWD: [
    { key: "games_played", label: "Games Played" },
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "shots_on_target", label: "Shots on Target" },
  ],
};

export default function StatEntryForm({ player, onSubmit, onCancel }: StatEntryFormProps) {
  const fields = POSITION_FIELDS[player.position] ?? POSITION_FIELDS.MID;

  const initialValues = Object.fromEntries(fields.map((f) => [f.key, "0"])) as Record<string, string>;
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const { key, label } of fields) {
      const raw = values[key] ?? "";
      const n = Number(raw);
      if (raw === "" || !Number.isInteger(n) || n < 0) {
        next[key] = `${label} must be a non-negative integer`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const stats: Omit<PlayerStats, "id" | "player_id"> = {
        games_played: Number(values.games_played),
        recorded_at: new Date().toISOString(),
      };
      for (const { key } of fields) {
        if (key !== "games_played") {
          (stats as Record<string, unknown>)[key] = Number(values[key]);
        }
      }
      await onSubmit(stats);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Log Stats — {player.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{player.position}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={values[key] ?? "0"}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors[key] && (
                <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Stats"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

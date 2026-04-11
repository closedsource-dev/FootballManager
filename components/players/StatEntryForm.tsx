import { useState } from "react";
import type { Player, PlayerStats } from "@/types";

interface StatEntryFormProps {
  player: Player;
  onSubmit: (stats: Omit<PlayerStats, "id" | "player_id" | "user_id">) => Promise<void>;
  onCancel: () => void;
}

export default function StatEntryForm({ player, onSubmit, onCancel }: StatEntryFormProps) {
  const { position } = player;

  // Position-specific field visibility
  const showGKFields = position === "GK";
  const showDEFFields = position === "DEF";
  const showMIDFields = position === "MID";
  const showFWDFields = position === "FWD";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [goals, setGoals] = useState("");
  const [assists, setAssists] = useState("");
  const [saves, setSaves] = useState("");
  const [goalsConceded, setGoalsConceded] = useState("");
  const [cleanSheets, setCleanSheets] = useState("");
  const [tackles, setTackles] = useState("");
  const [interceptions, setInterceptions] = useState("");
  const [keyPasses, setKeyPasses] = useState("");
  const [shotsOnTarget, setShotsOnTarget] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate non-negative integers
    const parseNonNegative = (val: string) => {
      if (val === "") return 0;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) throw new Error("All stats must be non-negative integers");
      return num;
    };

    try {
      const stats: Omit<PlayerStats, "id" | "player_id" | "user_id"> = {
        games_played: 1,
        goals: parseNonNegative(goals),
        assists: parseNonNegative(assists),
        recorded_at: new Date(recordedAt + "T12:00:00").toISOString(),
      };

      // Add position-specific stats
      if (showGKFields) {
        stats.saves = parseNonNegative(saves);
        stats.goals_conceded = parseNonNegative(goalsConceded);
        stats.clean_sheets = parseNonNegative(cleanSheets);
      }
      if (showDEFFields) {
        stats.tackles = parseNonNegative(tackles);
        stats.interceptions = parseNonNegative(interceptions);
      }
      if (showMIDFields) {
        stats.key_passes = parseNonNegative(keyPasses);
      }
      if (showFWDFields) {
        stats.shots_on_target = parseNonNegative(shotsOnTarget);
      }

      setSubmitting(true);
      await onSubmit(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save stats");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
          Log Game Stats
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {player.name} · {position}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Date */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Game Date
            </label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          {/* Shared attacking stats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Goals
              </label>
              <input
                type="number"
                min="0"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Assists
              </label>
              <input
                type="number"
                min="0"
                value={assists}
                onChange={(e) => setAssists(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="0"
              />
            </div>
          </div>

          {/* GK-specific fields */}
          {showGKFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Saves
                </label>
                <input
                  type="number"
                  min="0"
                  value={saves}
                  onChange={(e) => setSaves(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Goals Conceded
                </label>
                <input
                  type="number"
                  min="0"
                  value={goalsConceded}
                  onChange={(e) => setGoalsConceded(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Clean Sheets
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  value={cleanSheets}
                  onChange={(e) => setCleanSheets(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="0 or 1"
                />
              </div>
            </div>
          )}

          {/* DEF-specific fields */}
          {showDEFFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Tackles
                </label>
                <input
                  type="number"
                  min="0"
                  value={tackles}
                  onChange={(e) => setTackles(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Interceptions
                </label>
                <input
                  type="number"
                  min="0"
                  value={interceptions}
                  onChange={(e) => setInterceptions(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* MID-specific fields */}
          {showMIDFields && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Key Passes
              </label>
              <input
                type="number"
                min="0"
                value={keyPasses}
                onChange={(e) => setKeyPasses(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="0"
              />
            </div>
          )}

          {/* FWD-specific fields */}
          {showFWDFields && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Shots on Target
              </label>
              <input
                type="number"
                min="0"
                value={shotsOnTarget}
                onChange={(e) => setShotsOnTarget(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="0"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Stats"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

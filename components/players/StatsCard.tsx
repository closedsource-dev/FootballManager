"use client";

import type { Player, AggregatedStats } from "@/types";

interface StatsCardProps {
  player: Player;
  stats: AggregatedStats;
  onGamesPlayedChange?: (delta: number) => Promise<void>;
}

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-purple-100 text-purple-800",
  FWD: "bg-red-100 text-red-800",
};

function StatItem({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function GamesPlayedItem({
  value,
  onGamesPlayedChange,
}: {
  value: number;
  onGamesPlayedChange?: (delta: number) => Promise<void>;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">Games Played</p>
      {onGamesPlayedChange && (
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={() => onGamesPlayedChange(-1)}
            disabled={value <= 0}
            className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 transition-colors disabled:opacity-30"
          >
            −
          </button>
          <button
            onClick={() => onGamesPlayedChange(1)}
            className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-bold hover:bg-green-200 transition-colors"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function StatsCard({ player, stats, onGamesPlayedChange }: StatsCardProps) {
  const hasStats = stats.games_played > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Player header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{player.name}</h2>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              positionColors[player.position] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {player.position}
          </span>
        </div>

        {/* Skill rating bar — 1–20 scale */}
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Skill Rating</p>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(player.skill_rating / 20) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-green-700">
              {player.skill_rating}
            </span>
          </div>
        </div>
      </div>

      {!hasStats ? (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm text-center py-2">
            No stats recorded yet.
          </p>
          <GamesPlayedItem value={0} onGamesPlayedChange={onGamesPlayedChange} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <GamesPlayedItem value={stats.games_played} onGamesPlayedChange={onGamesPlayedChange} />
            {(player.position === "MID" ||
              player.position === "FWD" ||
              player.position === "DEF") && (
              <>
                <StatItem label="Goals" value={stats.goals} />
                <StatItem label="Assists" value={stats.assists} />
              </>
            )}
          </div>

          {player.position === "GK" && (
            <div className="grid grid-cols-3 gap-3">
              <StatItem label="Saves" value={stats.saves} />
              <StatItem label="Goals Conceded" value={stats.goals_conceded} />
              <StatItem label="Clean Sheets" value={stats.clean_sheets} />
            </div>
          )}

          {player.position === "DEF" && (
            <div className="grid grid-cols-2 gap-3">
              <StatItem label="Tackles" value={stats.tackles} />
              <StatItem label="Interceptions" value={stats.interceptions} />
            </div>
          )}

          {player.position === "MID" && (
            <div className="grid grid-cols-1 gap-3">
              <StatItem label="Key Passes" value={stats.key_passes} />
            </div>
          )}

          {player.position === "FWD" && (
            <div className="grid grid-cols-1 gap-3">
              <StatItem label="Shots on Target" value={stats.shots_on_target} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

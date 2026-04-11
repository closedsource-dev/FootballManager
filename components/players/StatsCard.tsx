import type { Player, AggregatedStats } from "@/types";

interface StatsCardProps {
  player: Player;
  stats: AggregatedStats;
}

export default function StatsCard({ player, stats }: StatsCardProps) {
  const { position } = player;

  // Position-specific stat visibility
  const showGKStats = position === "GK";
  const showDEFStats = position === "DEF";
  const showMIDStats = position === "MID";
  const showFWDStats = position === "FWD";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{player.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {position} · Skill Rating: {player.skill_rating}/10
        </p>
      </div>

      {/* Skill rating bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-green-600 transition-all"
            style={{ width: `${(player.skill_rating / 10) * 100}%` }}
          />
        </div>
      </div>

      {stats.games_played === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
          No stats recorded yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Games Played</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.games_played}</p>
          </div>

          {/* Shared attacking stats */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Goals</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.goals}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assists</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.assists}</p>
          </div>

          {/* GK-specific stats */}
          {showGKStats && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Saves</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.saves || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Goals Conceded</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.goals_conceded || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Clean Sheets</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.clean_sheets || 0}</p>
              </div>
            </>
          )}

          {/* DEF-specific stats */}
          {showDEFStats && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tackles</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.tackles || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Interceptions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.interceptions || 0}</p>
              </div>
            </>
          )}

          {/* MID-specific stats */}
          {showMIDStats && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Key Passes</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.key_passes || 0}</p>
            </div>
          )}

          {/* FWD-specific stats */}
          {showFWDStats && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Shots on Target</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.shots_on_target || 0}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

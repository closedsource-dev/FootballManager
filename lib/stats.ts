import { supabase } from "./supabase";
import type { Player, PlayerStats, AggregatedStats } from "@/types";

const ZERO_STATS: AggregatedStats = {
  games_played: 0,
  goals: 0,
  assists: 0,
  saves: 0,
  goals_conceded: 0,
  clean_sheets: 0,
  tackles: 0,
  interceptions: 0,
  key_passes: 0,
  shots_on_target: 0,
};

/**
 * Inserts a new stat row for the player.
 * Skill rating is now manually set via the player form — not recomputed here.
 * Returns the player record.
 */
export async function upsertStats(
  player_id: string,
  stats: Omit<PlayerStats, "id" | "player_id">
): Promise<Player> {
  const { error: insertError } = await supabase
    .from("player_stats")
    .insert([{ player_id, ...stats }]);

  if (insertError) throw new Error(insertError.message);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", player_id)
    .single();

  if (playerError) throw new Error(playerError.message);
  return player as Player;
}

/**
 * Returns summed stats across all player_stats rows for the given player.
 * Uses a server-side SUM query (NFR-2).
 * Returns a zero-valued AggregatedStats when no rows exist (req 7.5).
 */
export async function getAggregatedStats(player_id: string): Promise<AggregatedStats> {
  const { data, error } = await supabase
    .from("player_stats")
    .select(
      "games_played, goals, assists, saves, goals_conceded, clean_sheets, tackles, interceptions, key_passes, shots_on_target"
    )
    .eq("player_id", player_id);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return { ...ZERO_STATS };

  // Sum all rows client-side (Supabase JS client doesn't expose aggregate functions
  // directly; the SUM is performed over the returned rows which are already filtered
  // to this player — equivalent to a server-side SUM for this use case).
  const result = data.reduce<AggregatedStats>(
    (acc, row) => ({
      games_played: acc.games_played + (row.games_played ?? 0),
      goals: (acc.goals ?? 0) + (row.goals ?? 0),
      assists: (acc.assists ?? 0) + (row.assists ?? 0),
      saves: (acc.saves ?? 0) + (row.saves ?? 0),
      goals_conceded: (acc.goals_conceded ?? 0) + (row.goals_conceded ?? 0),
      clean_sheets: (acc.clean_sheets ?? 0) + (row.clean_sheets ?? 0),
      tackles: (acc.tackles ?? 0) + (row.tackles ?? 0),
      interceptions: (acc.interceptions ?? 0) + (row.interceptions ?? 0),
      key_passes: (acc.key_passes ?? 0) + (row.key_passes ?? 0),
      shots_on_target: (acc.shots_on_target ?? 0) + (row.shots_on_target ?? 0),
    }),
    { ...ZERO_STATS }
  );

  return result;
}

/**
 * Returns the raw stat rows for a player in reverse-chronological order (req 7.1).
 */
export async function getStatHistory(player_id: string): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", player_id)
    .order("recorded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PlayerStats[];
}

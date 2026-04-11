import { supabase } from "./supabase";
import { getCurrentWorkspaceOwnerId } from "./workspaceHelper";
import type { Player, AggregatedStats, PlayerStats } from "@/types";

/**
 * Fetches aggregated stats for a player across all their recorded games
 */
export async function getAggregatedStats(playerId: string): Promise<AggregatedStats> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId);

  if (error) {
    console.error("getAggregatedStats error:", error);
    throw new Error(error.message);
  }

  // If no stats exist, return zeroed structure
  if (!data || data.length === 0) {
    return {
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
  }

  // Aggregate all stats
  const aggregated: AggregatedStats = {
    games_played: data.length, // Each row represents one game
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

  for (const row of data) {
    aggregated.goals += row.goals || 0;
    aggregated.assists += row.assists || 0;
    aggregated.saves += row.saves || 0;
    aggregated.goals_conceded += row.goals_conceded || 0;
    aggregated.clean_sheets += row.clean_sheets || 0;
    aggregated.tackles += row.tackles || 0;
    aggregated.interceptions += row.interceptions || 0;
    aggregated.key_passes += row.key_passes || 0;
    aggregated.shots_on_target += row.shots_on_target || 0;
  }

  return aggregated;
}

/**
 * Inserts a new stat entry for a player and updates their skill rating
 */
export async function upsertStats(
  playerId: string,
  stats: Omit<PlayerStats, "id" | "player_id" | "user_id">
): Promise<Player> {
  const user_id = await getCurrentWorkspaceOwnerId();

  // Insert the new stats row
  const { error: insertError } = await supabase
    .from("player_stats")
    .insert({
      player_id: playerId,
      user_id,
      ...stats,
    });

  if (insertError) {
    console.error("upsertStats insert error:", insertError);
    throw new Error(insertError.message);
  }

  // Fetch the updated player
  const { data: player, error: fetchError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (fetchError) {
    console.error("upsertStats fetch error:", fetchError);
    throw new Error(fetchError.message);
  }

  return player as Player;
}

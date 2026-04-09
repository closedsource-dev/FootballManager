// All player-related Supabase calls live here.
// Swap the mock data below for real supabase calls once your DB is ready.
// Each function signature stays the same — the page/components won't need to change.

import { supabase } from "./supabase";
import type { Player, PlayerFormData } from "@/types";

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Player[];
}

export async function addPlayer(form: PlayerFormData): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .insert([form])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}

export async function updatePlayer(
  id: string,
  form: PlayerFormData
): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .update(form)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateGamesPlayed(id: string, delta: number): Promise<Player> {
  // Fetch current value first, then increment/decrement
  const { data: current, error: fetchErr } = await supabase
    .from("players")
    .select("games_played")
    .eq("id", id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const newCount = Math.max(0, (current.games_played ?? 0) + delta);

  const { data, error } = await supabase
    .from("players")
    .update({ games_played: newCount })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}

// Increment games_played and optionally games_won for a list of player ids
export async function recordGameResult(
  playerIds: string[],
  winnerIds: string[]
): Promise<void> {
  // Fetch current stats for all involved players
  const { data, error } = await supabase
    .from("players")
    .select("id, games_played, games_won")
    .in("id", playerIds);

  if (error) throw new Error(error.message);

  const updates = (data ?? []).map((p) => ({
    id: p.id,
    games_played: (p.games_played ?? 0) + 1,
    games_won: (p.games_won ?? 0) + (winnerIds.includes(p.id) ? 1 : 0),
  }));

  for (const u of updates) {
    const { error: updateErr } = await supabase
      .from("players")
      .update({ games_played: u.games_played, games_won: u.games_won })
      .eq("id", u.id);
    if (updateErr) throw new Error(updateErr.message);
  }
}

import { supabase } from "./supabase";
import { getCurrentWorkspaceOwnerId } from "./workspaceHelper";
import type { Player, PlayerFormData } from "@/types";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getPlayers(): Promise<Player[]> {
  const user_id = await getCurrentWorkspaceOwnerId();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Player[];
}

export async function addPlayer(form: PlayerFormData): Promise<Player> {
  const user_id = await getCurrentWorkspaceOwnerId();
  const { data, error } = await supabase
    .from("players")
    .insert([{ ...form, user_id }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Player;
}

export async function updatePlayer(id: string, form: PlayerFormData): Promise<Player> {
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

export async function recordGameResult(playerIds: string[], winnerIds: string[]): Promise<void> {
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

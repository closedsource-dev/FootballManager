import { supabase } from "./supabase";

export interface GameLog {
  id: string;
  score_a: number;
  score_b: number;
  team_a_ids: string[];
  team_b_ids: string[];
  winner: "A" | "B" | "draw";
  played_at: string;
}

export async function logGame(game: Omit<GameLog, "id" | "played_at">): Promise<GameLog> {
  const { data, error } = await supabase
    .from("game_logs")
    .insert(game)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as GameLog;
}

export async function getGameLogs(): Promise<GameLog[]> {
  const { data, error } = await supabase
    .from("game_logs")
    .select("*")
    .order("played_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as GameLog[];
}

import type { Position, AggregatedStats } from "../types/index";

// Position-specific weight tables
const GK_WEIGHTS: Partial<Record<keyof AggregatedStats, number>> = {
  clean_sheets: 2.0,
  saves: 0.3,
  goals_conceded: -0.5,
};

const DEF_WEIGHTS: Partial<Record<keyof AggregatedStats, number>> = {
  tackles: 0.4,
  interceptions: 0.4,
  goals: 1.5,
  assists: 1.0,
};

const MID_WEIGHTS: Partial<Record<keyof AggregatedStats, number>> = {
  goals: 1.5,
  assists: 1.2,
  key_passes: 0.5,
};

const FWD_WEIGHTS: Partial<Record<keyof AggregatedStats, number>> = {
  goals: 2.0,
  assists: 1.0,
  shots_on_target: 0.3,
};

const WEIGHT_TABLES: Record<Position, Partial<Record<keyof AggregatedStats, number>>> = {
  GK: GK_WEIGHTS,
  DEF: DEF_WEIGHTS,
  MID: MID_WEIGHTS,
  FWD: FWD_WEIGHTS,
};

// MAX_SCORE represents a "perfect" per-game performance for each position.
// Used to normalise raw_score onto the 1–10 scale.
// GK:  1 clean_sheet * 2.0 + 5 saves * 0.3 + 0 goals_conceded * -0.5 = 3.5
// DEF: 3 tackles * 0.4 + 3 interceptions * 0.4 + 0.3 goals * 1.5 + 0.3 assists * 1.0 = 3.15
// MID: 0.5 goals * 1.5 + 0.5 assists * 1.2 + 3 key_passes * 0.5 = 2.85
// FWD: 1 goal * 2.0 + 0.5 assists * 1.0 + 3 shots_on_target * 0.3 = 3.4
const MAX_SCORE: Record<Position, number> = {
  GK: 3.5,
  DEF: 3.15,
  MID: 2.85,
  FWD: 3.4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes a skill rating (1–10) for a player based on their position and
 * aggregated stats. Pure function — no side effects, no Supabase calls.
 *
 * If games_played === 0, returns 5 as a safe default. The caller in
 * lib/stats.ts is responsible for not overwriting the existing rating in
 * that case (req 2.4).
 */
export function computeSkillRating(position: Position, stats: AggregatedStats): number {
  if (stats.games_played === 0) {
    return 5;
  }

  const weights = WEIGHT_TABLES[position];
  let rawScore = 0;

  for (const [statKey, weight] of Object.entries(weights) as [keyof AggregatedStats, number][]) {
    const statValue = (stats[statKey] ?? 0) as number;
    rawScore += (statValue / stats.games_played) * weight;
  }

  const normalised = (rawScore / MAX_SCORE[position]) * 9 + 1;
  return clamp(Math.round(normalised), 1, 10);
}

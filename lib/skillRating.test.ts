import { describe, it, expect } from "vitest";
import { computeSkillRating } from "./skillRating";
import type { AggregatedStats } from "../types/index";

// Helper to build a minimal AggregatedStats object
function stats(overrides: Partial<AggregatedStats> & { games_played: number }): AggregatedStats {
  return {
    games_played: overrides.games_played,
    goals: overrides.goals ?? 0,
    assists: overrides.assists ?? 0,
    saves: overrides.saves,
    goals_conceded: overrides.goals_conceded,
    clean_sheets: overrides.clean_sheets,
    tackles: overrides.tackles,
    interceptions: overrides.interceptions,
    key_passes: overrides.key_passes,
    shots_on_target: overrides.shots_on_target,
  };
}

describe("computeSkillRating", () => {
  // ── Boundary: 0 games_played ──────────────────────────────────────────────
  it("returns 5 (safe default) when games_played is 0", () => {
    expect(computeSkillRating("GK", stats({ games_played: 0 }))).toBe(5);
    expect(computeSkillRating("DEF", stats({ games_played: 0 }))).toBe(5);
    expect(computeSkillRating("MID", stats({ games_played: 0 }))).toBe(5);
    expect(computeSkillRating("FWD", stats({ games_played: 0 }))).toBe(5);
  });

  // ── Always returns integer in [1, 10] ─────────────────────────────────────
  it("always returns an integer", () => {
    const result = computeSkillRating("MID", stats({ games_played: 3, goals: 2, assists: 1, key_passes: 5 }));
    expect(Number.isInteger(result)).toBe(true);
  });

  // ── GK known inputs ───────────────────────────────────────────────────────
  it("GK: perfect per-game stats → rating 10", () => {
    // 1 clean_sheet, 5 saves, 0 goals_conceded per game → raw = 3.5 = MAX_SCORE → normalised = 10
    const rating = computeSkillRating("GK", stats({
      games_played: 1,
      clean_sheets: 1,
      saves: 5,
      goals_conceded: 0,
    }));
    expect(rating).toBe(10);
  });

  it("GK: zero stats → rating 1", () => {
    const rating = computeSkillRating("GK", stats({
      games_played: 1,
      clean_sheets: 0,
      saves: 0,
      goals_conceded: 0,
    }));
    expect(rating).toBe(1);
  });

  it("GK: average performance → mid-range rating", () => {
    // 0.5 clean_sheets/game, 2 saves/game, 1 goal_conceded/game
    // raw = 0.5*2.0 + 2*0.3 + 1*(-0.5) = 1.0 + 0.6 - 0.5 = 1.1
    // normalised = (1.1 / 3.5) * 9 + 1 ≈ 3.83 → rounds to 4
    const rating = computeSkillRating("GK", stats({
      games_played: 2,
      clean_sheets: 1,
      saves: 4,
      goals_conceded: 2,
    }));
    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(10);
    expect(rating).toBe(4);
  });

  // ── DEF known inputs ──────────────────────────────────────────────────────
  it("DEF: perfect per-game stats → rating 10", () => {
    // 3 tackles, 3 interceptions, 0.3 goals, 0.3 assists per game → raw ≈ 3.15 = MAX_SCORE
    const rating = computeSkillRating("DEF", stats({
      games_played: 10,
      tackles: 30,
      interceptions: 30,
      goals: 3,
      assists: 3,
    }));
    expect(rating).toBe(10);
  });

  it("DEF: zero stats → rating 1", () => {
    const rating = computeSkillRating("DEF", stats({
      games_played: 5,
      tackles: 0,
      interceptions: 0,
      goals: 0,
      assists: 0,
    }));
    expect(rating).toBe(1);
  });

  it("DEF: solid defensive stats → above-average rating", () => {
    // 2 tackles/game, 2 interceptions/game, 0 goals, 0 assists
    // raw = 2*0.4 + 2*0.4 = 1.6
    // normalised = (1.6 / 3.15) * 9 + 1 ≈ 5.57 → rounds to 6
    const rating = computeSkillRating("DEF", stats({
      games_played: 1,
      tackles: 2,
      interceptions: 2,
      goals: 0,
      assists: 0,
    }));
    expect(rating).toBe(6);
  });

  // ── MID known inputs ──────────────────────────────────────────────────────
  it("MID: perfect per-game stats → rating 10", () => {
    // 0.5 goals, 0.5 assists, 3 key_passes per game → raw = 2.85 = MAX_SCORE
    const rating = computeSkillRating("MID", stats({
      games_played: 2,
      goals: 1,
      assists: 1,
      key_passes: 6,
    }));
    expect(rating).toBe(10);
  });

  it("MID: zero stats → rating 1", () => {
    const rating = computeSkillRating("MID", stats({
      games_played: 3,
      goals: 0,
      assists: 0,
      key_passes: 0,
    }));
    expect(rating).toBe(1);
  });

  it("MID: average playmaker → mid-range rating", () => {
    // 0.3 goals/game, 0.3 assists/game, 1 key_pass/game
    // raw = 0.3*1.5 + 0.3*1.2 + 1*0.5 = 0.45 + 0.36 + 0.5 = 1.31
    // normalised = (1.31 / 2.85) * 9 + 1 ≈ 5.14 → rounds to 5
    const rating = computeSkillRating("MID", stats({
      games_played: 10,
      goals: 3,
      assists: 3,
      key_passes: 10,
    }));
    expect(rating).toBe(5);
  });

  // ── FWD known inputs ──────────────────────────────────────────────────────
  it("FWD: perfect per-game stats → rating 10", () => {
    // 1 goal, 0.5 assists, 3 shots_on_target per game → raw = 3.4 = MAX_SCORE
    const rating = computeSkillRating("FWD", stats({
      games_played: 2,
      goals: 2,
      assists: 1,
      shots_on_target: 6,
    }));
    expect(rating).toBe(10);
  });

  it("FWD: zero stats → rating 1", () => {
    const rating = computeSkillRating("FWD", stats({
      games_played: 5,
      goals: 0,
      assists: 0,
      shots_on_target: 0,
    }));
    expect(rating).toBe(1);
  });

  it("FWD: prolific scorer → high rating", () => {
    // 0.8 goals/game, 0.3 assists/game, 2 shots_on_target/game
    // raw = 0.8*2.0 + 0.3*1.0 + 2*0.3 = 1.6 + 0.3 + 0.6 = 2.5
    // normalised = (2.5 / 3.4) * 9 + 1 ≈ 7.62 → rounds to 8
    const rating = computeSkillRating("FWD", stats({
      games_played: 10,
      goals: 8,
      assists: 3,
      shots_on_target: 20,
    }));
    expect(rating).toBe(8);
  });

  // ── Clamp: very high stats → 10 ──────────────────────────────────────────
  it("clamps to 10 for extremely high stats", () => {
    const rating = computeSkillRating("FWD", stats({
      games_played: 1,
      goals: 100,
      assists: 100,
      shots_on_target: 100,
    }));
    expect(rating).toBe(10);
  });

  // ── Missing optional stat fields default to 0 ─────────────────────────────
  it("treats missing optional stat fields as 0", () => {
    // GK with no saves/goals_conceded/clean_sheets provided → same as all zeros
    const withMissing = computeSkillRating("GK", {
      games_played: 1,
      goals: 0,
      assists: 0,
      // saves, goals_conceded, clean_sheets intentionally omitted
    });
    const withZeros = computeSkillRating("GK", stats({
      games_played: 1,
      saves: 0,
      goals_conceded: 0,
      clean_sheets: 0,
    }));
    expect(withMissing).toBe(withZeros);
  });

  // ── Return value is always in [1, 10] ─────────────────────────────────────
  it("always returns a value in [1, 10] for various inputs", () => {
    const cases: Array<[Parameters<typeof computeSkillRating>[0], AggregatedStats]> = [
      ["GK", stats({ games_played: 1, saves: 3, goals_conceded: 1, clean_sheets: 0 })],
      ["DEF", stats({ games_played: 5, tackles: 10, interceptions: 8, goals: 1, assists: 2 })],
      ["MID", stats({ games_played: 10, goals: 5, assists: 7, key_passes: 20 })],
      ["FWD", stats({ games_played: 3, goals: 4, assists: 2, shots_on_target: 9 })],
    ];
    for (const [pos, s] of cases) {
      const r = computeSkillRating(pos, s);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
});

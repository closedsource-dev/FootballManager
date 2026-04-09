# Requirements: Player Stats & Payments

## Introduction

This document derives functional requirements from the design for two interconnected features: a position-aware player stats system with computed skill ratings, and a payments/budget tracker. Both features extend the existing Next.js 14 / Supabase football manager app.

---

## Requirement 1: Position-Aware Player Stats

### User Stories

- As a manager, I want to log per-game stats for each player so that I have an accurate record of their performance.
- As a manager, I want stats to be position-specific so that I'm only entering relevant data for each player.
- As a manager, I want to view a player's aggregated stats on their detail page so that I can assess their overall performance.

### Acceptance Criteria

1.1 When logging stats for a GK, the system SHALL present fields for: `saves`, `goals_conceded`, `clean_sheets`, `games_played`.

1.2 When logging stats for a DEF, the system SHALL present fields for: `tackles`, `interceptions`, `goals`, `assists`, `games_played`.

1.3 When logging stats for a MID, the system SHALL present fields for: `goals`, `assists`, `key_passes`, `games_played`.

1.4 When logging stats for a FWD, the system SHALL present fields for: `goals`, `assists`, `shots_on_target`, `games_played`.

1.5 The system SHALL reject stat entries where any numeric field is negative or non-integer.

1.6 The player detail page at `/players/[id]` SHALL display the player's aggregated stats (summed across all recorded games).

1.7 The player detail page SHALL provide a form to log a new game's stats for that player.

1.8 When no stats have been recorded for a player, the detail page SHALL display a "No stats recorded yet" message and retain the player's existing skill rating.

---

## Requirement 2: Computed Skill Rating

### User Stories

- As a manager, I want skill ratings to be automatically computed from real stats so that team balancing reflects actual performance rather than manual guesses.

### Acceptance Criteria

2.1 After a stat entry is saved, the system SHALL recompute the player's `skill_rating` using the position-specific weighted formula defined in the design.

2.2 The computed `skill_rating` SHALL always be an integer in the range [1, 10].

2.3 The `computeSkillRating` function SHALL be deterministic: the same position and aggregated stats SHALL always produce the same rating.

2.4 If a player has zero games played, the system SHALL NOT overwrite their existing `skill_rating`.

2.5 The `PlayerForm` SHALL remove the manual skill rating slider; the rating is display-only and sourced from computed stats.

---

## Requirement 3: Payments Page

### User Stories

- As a manager, I want to see which players have paid and which haven't so that I can follow up with those who owe money.
- As a manager, I want to log payments (fees, expenses, income) so that I have a complete financial record for the team.

### Acceptance Criteria

3.1 The payments page SHALL display all players with their `has_paid` status and `amount_paid`.

3.2 The payments page SHALL provide a form to log a new payment with fields: `type` (fee / expense / income), `amount`, `description`, `date`.

3.3 The `amount` field SHALL be validated as a positive number greater than zero.

3.4 When a payment of type `fee` is logged with a `player_id`, the system SHALL set `players.has_paid = true` and increment `players.amount_paid` by the payment amount.

3.5 The payments page SHALL display a chronological history of all logged payments, showing player name (or "Team" for general payments), type, amount, and date.

3.6 A payment record SHALL be deletable from the history list.

---

## Requirement 4: Budget Summary & Money Goals

### User Stories

- As a manager, I want to see a budget summary so that I know the team's financial position at a glance.
- As a manager, I want to set a money goal with a target amount so that I can track fundraising progress.

### Acceptance Criteria

4.1 The payments page SHALL display a budget summary showing: `total_collected` (sum of fees + income), `total_expenses` (sum of expenses), and `balance` (collected − expenses).

4.2 The budget summary SHALL satisfy the identity: `balance = total_collected - total_expenses` at all times.

4.3 The payments page SHALL allow creating a money goal with a `title` and `target_amount`.

4.4 `target_amount` SHALL be validated as a positive number greater than zero.

4.5 Each money goal SHALL display a progress bar showing `total_collected / target_amount` as a percentage, capped visually at 100%.

4.6 Multiple money goals MAY coexist; each tracks progress independently against the same `total_collected` figure.

---

## Requirement 5: Team Balancing

### User Stories

- As a manager, I want to generate two balanced teams from the roster so that matches are fair and competitive.

### Acceptance Criteria

5.1 The teams page SHALL generate two teams from the full player roster using the greedy snake-draft algorithm described in the design.

5.2 Every player in the roster SHALL appear in exactly one of the two generated teams.

5.3 The two teams SHALL differ in size by at most 1 player.

5.4 The teams page SHALL display both teams side by side, showing each player's name, position badge, and skill rating.

5.5 The team generator SHALL use the current `skill_rating` values from the `players` table (which are kept up to date by the stats system).

---

## Requirement 6: Database Schema

### Acceptance Criteria

6.1 The `player_stats` table SHALL be created with columns: `id` (uuid PK), `player_id` (uuid FK → players), `games_played` (int), `goals` (int nullable), `assists` (int nullable), `saves` (int nullable), `goals_conceded` (int nullable), `clean_sheets` (int nullable), `tackles` (int nullable), `interceptions` (int nullable), `key_passes` (int nullable), `shots_on_target` (int nullable), `recorded_at` (timestamptz).

6.2 The `payment_goals` table SHALL be created with columns: `id` (uuid PK), `title` (text), `target_amount` (numeric), `created_at` (timestamptz).

6.3 The existing `payments` table schema SHALL match the `Payment` type defined in `types/index.ts` (already present or to be created with: `id`, `player_id` nullable FK, `amount`, `type`, `description`, `paid_at`).

6.4 All numeric stat columns in `player_stats` SHALL have a `CHECK (value >= 0)` constraint.

6.5 The `payments.amount` column SHALL have a `CHECK (amount > 0)` constraint.

6.6 The `payment_goals.target_amount` column SHALL have a `CHECK (target_amount > 0)` constraint.

---

## Requirement 7: Data Library Functions

### Acceptance Criteria

7.1 `lib/stats.ts` SHALL export: `upsertStats`, `getAggregatedStats`, `getStatHistory`.

7.2 `lib/payments.ts` SHALL export: `logPayment`, `getPayments`, `deletePayment`, `getBudgetSummary`, `createGoal`, `getGoals`.

7.3 `lib/teams.ts` SHALL export: `generateBalancedTeams`.

7.4 `lib/skillRating.ts` SHALL export: `computeSkillRating` as a pure function (no Supabase calls).

7.5 `getAggregatedStats` SHALL return a zero-valued `AggregatedStats` object (not throw) when a player has no stat rows.

7.6 All library functions that call Supabase SHALL throw a descriptive `Error` on database failure.

---

## Non-Functional Requirements

NFR-1: The player detail page SHALL load player data and aggregated stats in parallel (`Promise.all`) to minimise latency.

NFR-2: Stats aggregation SHALL be performed via a Supabase `SELECT SUM` query (server-side), not by fetching all rows and summing client-side.

NFR-3: Budget summary SHALL be computed via a single Supabase aggregation query grouped by payment type.

NFR-4: All new UI components SHALL use Tailwind CSS consistent with the existing design system (green-700 primary, gray-50 backgrounds, rounded-xl cards).

NFR-5: `computeSkillRating` and `generateBalancedTeams` SHALL be pure functions with no side effects, enabling straightforward unit and property-based testing.

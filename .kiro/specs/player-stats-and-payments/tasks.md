# Tasks: Player Stats & Payments

## Task List

- [x] 1. Database schema & types
  - [x] 1.1 Extend `types/index.ts` with `AggregatedStats`, `MoneyGoal`, `PaymentWithPlayer`, `BudgetSummary`, and the full `PlayerStats` interface (position-specific nullable fields)
  - [x] 1.2 Write Supabase migration SQL for `player_stats` table with CHECK constraints (req 6.1, 6.4)
  - [x] 1.3 Write Supabase migration SQL for `payment_goals` table with CHECK constraint (req 6.2, 6.6)
  - [x] 1.4 Write Supabase migration SQL for `payments` table if not yet created, with CHECK constraint on amount (req 6.3, 6.5)

- [x] 2. Skill rating engine
  - [x] 2.1 Create `lib/skillRating.ts` — pure `computeSkillRating(position, stats)` function with position weight tables and clamp logic (req 2.1–2.4)
  - [x] 2.2 Write unit tests for `computeSkillRating`: known inputs per position, boundary values (0 games, max stats), always returns [1,10]

- [x] 3. Stats data library
  - [x] 3.1 Create `lib/stats.ts` — `upsertStats`, `getAggregatedStats` (SUM query), `getStatHistory` (req 7.1, NFR-2)
  - [x] 3.2 `upsertStats` must call `computeSkillRating` and update `players.skill_rating` after inserting the stat row (req 2.1)
  - [x] 3.3 `getAggregatedStats` must return zero-valued struct when no rows exist (req 7.5)

- [x] 4. Player detail page — stats UI
  - [x] 4.1 Build `components/players/StatsCard.tsx` — displays aggregated stats, position-aware field visibility, skill rating bar (req 1.6)
  - [x] 4.2 Build `components/players/StatEntryForm.tsx` — modal form with position-specific fields, non-negative integer validation (req 1.1–1.5, 1.7)
  - [x] 4.3 Wire up `/players/[id]/page.tsx` — fetch player + aggregated stats in parallel, render StatsCard and StatEntryForm, handle "no stats" state (req 1.6–1.8, NFR-1)
  - [x] 4.4 Add a "View Stats" link/button in `PlayerTable` rows pointing to `/players/[id]`

- [x] 5. PlayerForm — remove manual skill slider
  - [x] 5.1 Remove the skill rating slider from `PlayerForm.tsx`; show computed rating as read-only text when editing a player (req 2.5)
  - [x] 5.2 Update `PlayerFormData` default so `skill_rating` defaults to 5 for new players (no slider, set server-side on first stat entry)

- [x] 6. Payments data library
  - [x] 6.1 Create `lib/payments.ts` — `logPayment`, `getPayments`, `deletePayment`, `getBudgetSummary`, `createGoal`, `getGoals` (req 7.2, NFR-3)
  - [x] 6.2 `logPayment` must sync `players.has_paid` and `players.amount_paid` when `type === 'fee'` and `player_id` is set (req 3.4)
  - [x] 6.3 `getBudgetSummary` must use a single aggregation query grouped by type (NFR-3)

- [x] 7. Payments page UI
  - [x] 7.1 Build `components/payments/BudgetSummary.tsx` — total collected, expenses, balance cards (req 4.1–4.2)
  - [x] 7.2 Build `components/payments/PaymentForm.tsx` — modal form for logging a payment (type, amount, description, date, optional player select) with amount > 0 validation (req 3.2–3.3)
  - [x] 7.3 Build `components/payments/PaymentHistory.tsx` — chronological list with player name, type badge, amount, date, delete button (req 3.5–3.6)
  - [x] 7.4 Build `components/payments/PaymentGoal.tsx` — goal title, progress bar (collected/target, capped at 100%), target amount (req 4.3–4.6)
  - [x] 7.5 Build `components/payments/GoalForm.tsx` — modal form to create a money goal (title, target_amount > 0) (req 4.3–4.4)
  - [x] 7.6 Wire up `/payments/page.tsx` — fetch players, payments, goals, budget summary; render all components; handle log payment and create goal actions (req 3.1–3.6, 4.1–4.6)

- [ ] 8. Teams page
  - [ ] 8.1 Create `lib/teams.ts` — pure `generateBalancedTeams(players)` using greedy snake-draft (req 5.1–5.3)
  - [ ] 8.2 Build `components/teams/TeamGrid.tsx` — two-column layout with player cards (name, position badge, skill rating) (req 5.4)
  - [ ] 8.3 Wire up `/teams/page.tsx` — fetch players, call `generateBalancedTeams`, render TeamGrid; "Generate Teams" button re-runs on click (req 5.1–5.5)

- [ ] 9. Property-based & integration tests
  - [ ] 9.1 Add `fast-check` as a dev dependency
  - [ ] 9.2 Write property tests for `computeSkillRating`: output always in [1,10], deterministic (req 2.2–2.3)
  - [ ] 9.3 Write property tests for `generateBalancedTeams`: all players assigned, size diff ≤ 1 (req 5.2–5.3)
  - [ ] 9.4 Write property test for budget balance identity: `balance === collected - expenses` for any payment array (req 4.2)
  - [ ] 9.5 Write property test for stats aggregation additivity: sum of individual rows equals `getAggregatedStats` result (req 7.5)

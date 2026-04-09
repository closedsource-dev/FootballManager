# Tasks

## Task List

- [x] 1. Database migration
  - [x] 1.1 Create `football-manager/supabase/migrations/20240004_goal_allocations.sql` with the `goal_allocations` table (uuid PK, goal_id uuid UNIQUE FK → payment_goals ON DELETE CASCADE, allocated_amount numeric CHECK > 0, updated_at timestamptz)

- [x] 2. Types
  - [x] 2.1 Add `GoalAllocation` interface to `football-manager/types/index.ts`

- [x] 3. Allocations library
  - [x] 3.1 Create `football-manager/lib/allocations.ts` with `getAllocations()`, `setAllocation(goal_id, amount, collected)`, `removeAllocation(goal_id)`, and pure `getUnallocatedBalance(collected, allocations)` functions

- [x] 4. Update PaymentGoal component
  - [x] 4.1 Replace `collected` prop with `allocatedAmount` and add `unallocatedBalance`, `onAllocate`, `onRemoveAllocation`, and optional `allocationError` props
  - [x] 4.2 Update progress bar and label to use `allocatedAmount / target_amount`
  - [x] 4.3 Add inline allocation input, "Allocate" button, and "Remove" button

- [x] 5. Update BudgetSummary component
  - [x] 5.1 Add `unallocatedBalance` prop and render it as a new summary card

- [x] 6. Update payments page
  - [x] 6.1 Import `getAllocations`, `setAllocation`, `removeAllocation`, `getUnallocatedBalance` from `lib/allocations`
  - [x] 6.2 Add `allocations` and `allocationErrors` state; fetch allocations in `loadAll()`
  - [x] 6.3 Implement `handleAllocate(goalId, amount)` and `handleRemoveAllocation(goalId)` handlers
  - [x] 6.4 Pass `allocatedAmount`, `unallocatedBalance`, `onAllocate`, `onRemoveAllocation`, and `allocationError` to each `PaymentGoal`
  - [x] 6.5 Pass `unallocatedBalance` to `BudgetSummaryCard`

- [x] 7. Tests
  - [x] 7.1 Write unit tests for `getUnallocatedBalance` (zero case, single allocation, multiple allocations)
  - [x] 7.2 Write property-based tests for Properties 1–6 using fast-check (minimum 100 iterations each)

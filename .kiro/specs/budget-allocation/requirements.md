# Requirements Document

## Introduction

The budget allocation feature lets managers explicitly distribute collected funds across individual money goals. Currently, money goals show progress based on the total collected pool — every goal sees the same number. This feature introduces manual allocation: a manager picks a goal and assigns a specific amount from the unallocated pool to it. The unallocated balance (collected minus all allocations) is always visible, so the manager knows exactly how much is still free to assign.

---

## Glossary

- **Allocation_Manager**: The system component responsible for reading, writing, and validating goal allocations.
- **Collected_Pool**: The total funds collected from fees and income payments (`total_collected` from the payments system).
- **Allocated_Amount**: The sum of all amounts explicitly assigned to a specific money goal.
- **Unallocated_Balance**: `Collected_Pool` minus the sum of all `Allocated_Amount` values across all goals.
- **Goal_Allocation**: A record linking a money goal to a specific amount drawn from the `Collected_Pool`.
- **Budget_Page**: The existing `/payments` page where budget summary and money goals are displayed.

---

## Requirements

### Requirement 1: Unallocated Balance Display

**User Story:** As a manager, I want to see how much collected money has not yet been assigned to any goal, so that I know what I have available to distribute.

#### Acceptance Criteria

1. THE Budget_Page SHALL display the `Unallocated_Balance` prominently alongside the existing budget summary.
2. THE Allocation_Manager SHALL compute `Unallocated_Balance` as `Collected_Pool` minus the sum of all `Goal_Allocation` amounts.
3. WHEN the `Collected_Pool` changes (new payment logged or deleted), THE Budget_Page SHALL reflect the updated `Unallocated_Balance` without a full page reload.
4. WHEN the sum of all `Goal_Allocation` amounts equals the `Collected_Pool`, THE Budget_Page SHALL display an `Unallocated_Balance` of zero.

---

### Requirement 2: Allocate Funds to a Goal

**User Story:** As a manager, I want to assign a specific amount from the collected pool to a money goal, so that I can earmark funds for a particular purchase.

#### Acceptance Criteria

1. WHEN a manager selects a money goal and enters an allocation amount, THE Allocation_Manager SHALL store a `Goal_Allocation` record linking that goal to the specified amount.
2. THE Allocation_Manager SHALL reject an allocation where the amount is not a positive number greater than zero.
3. THE Allocation_Manager SHALL reject an allocation where the requested amount exceeds the current `Unallocated_Balance`.
4. IF an allocation is rejected due to insufficient `Unallocated_Balance`, THEN THE Budget_Page SHALL display an error message stating the available unallocated amount.
5. WHEN a `Goal_Allocation` is saved successfully, THE Budget_Page SHALL update the goal's progress bar and the `Unallocated_Balance` immediately.

---

### Requirement 3: Goal Progress Based on Allocated Amount

**User Story:** As a manager, I want each money goal's progress bar to reflect only the funds explicitly allocated to it, so that I can see a realistic picture of each goal's funding status.

#### Acceptance Criteria

1. THE Budget_Page SHALL compute each goal's progress as `Allocated_Amount / target_amount`, expressed as a percentage capped visually at 100%.
2. WHEN no allocation has been made to a goal, THE Budget_Page SHALL display that goal's progress as 0%.
3. THE Budget_Page SHALL display the `Allocated_Amount` in currency format alongside the `target_amount` for each goal.

---

### Requirement 4: Adjust or Remove an Allocation

**User Story:** As a manager, I want to change or remove an allocation I previously made, so that I can redistribute funds if my priorities change.

#### Acceptance Criteria

1. WHEN a manager updates the allocation amount for a goal, THE Allocation_Manager SHALL replace the existing `Goal_Allocation` amount with the new value.
2. THE Allocation_Manager SHALL reject an updated allocation where the new amount exceeds `Unallocated_Balance` plus the goal's current `Allocated_Amount` (i.e. the previously allocated amount is returned to the pool before validation).
3. WHEN a manager removes an allocation from a goal, THE Allocation_Manager SHALL delete the `Goal_Allocation` record and return the amount to the `Unallocated_Balance`.
4. WHEN an allocation is removed, THE Budget_Page SHALL reset that goal's progress to 0%.

---

### Requirement 5: Allocation Persistence

**User Story:** As a manager, I want allocations to be saved to the database, so that they persist across sessions and page reloads.

#### Acceptance Criteria

1. THE Allocation_Manager SHALL store each `Goal_Allocation` in a dedicated `goal_allocations` database table with columns: `id` (uuid PK), `goal_id` (uuid FK → payment_goals), `allocated_amount` (numeric), `updated_at` (timestamptz).
2. THE `goal_allocations.allocated_amount` column SHALL have a `CHECK (allocated_amount > 0)` constraint.
3. THE `goal_allocations` table SHALL enforce a unique constraint on `goal_id` so that each goal has at most one allocation record.
4. WHEN the Budget_Page loads, THE Allocation_Manager SHALL fetch all `Goal_Allocation` records and compute the `Unallocated_Balance` before rendering.

---

### Requirement 6: Data Library Functions

**User Story:** As a developer, I want clean library functions for allocation operations, so that the UI layer stays thin and logic is testable.

#### Acceptance Criteria

1. THE Allocation_Manager SHALL expose a function `getAllocations()` that returns all `Goal_Allocation` records.
2. THE Allocation_Manager SHALL expose a function `setAllocation(goal_id, amount)` that upserts a `Goal_Allocation` for the given goal.
3. THE Allocation_Manager SHALL expose a function `removeAllocation(goal_id)` that deletes the `Goal_Allocation` for the given goal.
4. THE Allocation_Manager SHALL expose a function `getUnallocatedBalance(collected, allocations)` as a pure function returning `collected` minus the sum of all allocation amounts.
5. IF `setAllocation` is called with an amount that would cause the total allocated to exceed `Collected_Pool`, THEN THE Allocation_Manager SHALL throw a descriptive error before writing to the database.
6. THE `getUnallocatedBalance` function SHALL return zero when `allocations` is an empty array and `collected` is zero.

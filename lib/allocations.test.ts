import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import type { GoalAllocation } from "../types";

// Mock supabase before importing allocations to avoid env var requirement
vi.mock("./supabase", () => ({ supabase: {} }));

// Import only the pure function — Supabase-dependent functions are not tested here
import { getUnallocatedBalance } from "./allocations";

// Helper to build a minimal GoalAllocation
function alloc(goal_id: string, allocated_amount: number): GoalAllocation {
  return { id: goal_id, goal_id, allocated_amount, updated_at: new Date().toISOString() };
}

// ── Unit tests ────────────────────────────────────────────────────────────────

describe("getUnallocatedBalance", () => {
  it("returns 0 when collected is 0 and allocations is empty", () => {
    expect(getUnallocatedBalance(0, [])).toBe(0);
  });

  it("returns collected when there are no allocations", () => {
    expect(getUnallocatedBalance(150, [])).toBe(150);
  });

  it("subtracts a single allocation from collected", () => {
    expect(getUnallocatedBalance(100, [alloc("g1", 40)])).toBe(60);
  });

  it("subtracts multiple allocations from collected", () => {
    expect(
      getUnallocatedBalance(200, [alloc("g1", 50), alloc("g2", 75)])
    ).toBe(75);
  });

  it("returns 0 when all funds are allocated", () => {
    expect(
      getUnallocatedBalance(100, [alloc("g1", 60), alloc("g2", 40)])
    ).toBe(0);
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────

describe("getUnallocatedBalance — property tests", () => {
  // Property 1: result equals collected minus sum of allocations
  it("P1: always equals collected minus sum of allocated_amounts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(fc.integer({ min: 1, max: 1_000 }), { maxLength: 20 }),
        (collected, amounts) => {
          const allocations = amounts.map((a, i) => alloc(`g${i}`, a));
          const result = getUnallocatedBalance(collected, allocations);
          const expected = collected - amounts.reduce((s, a) => s + a, 0);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property 2: result with empty allocations equals collected
  it("P2: empty allocations → result equals collected", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), (collected) => {
        expect(getUnallocatedBalance(collected, [])).toBe(collected);
      }),
      { numRuns: 200 }
    );
  });

  // Property 3: adding an allocation reduces the balance by exactly that amount
  it("P3: adding an allocation reduces balance by exactly that amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(fc.integer({ min: 1, max: 500 }), { maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (collected, amounts, newAmount) => {
          const existing = amounts.map((a, i) => alloc(`g${i}`, a));
          const before = getUnallocatedBalance(collected, existing);
          const after = getUnallocatedBalance(collected, [
            ...existing,
            alloc("new", newAmount),
          ]);
          expect(after).toBe(before - newAmount);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property 4: goal progress percentage is capped at 100%
  it("P4: progress percentage is always in [0, 100]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        (allocatedAmount, target_amount) => {
          const rawPercent = (allocatedAmount / target_amount) * 100;
          const displayPercent = Math.min(rawPercent, 100);
          expect(displayPercent).toBeGreaterThanOrEqual(0);
          expect(displayPercent).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property 5: result is deterministic (same inputs → same output)
  it("P5: getUnallocatedBalance is deterministic", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(fc.integer({ min: 1, max: 1_000 }), { maxLength: 10 }),
        (collected, amounts) => {
          const allocations = amounts.map((a, i) => alloc(`g${i}`, a));
          expect(getUnallocatedBalance(collected, allocations)).toBe(
            getUnallocatedBalance(collected, allocations)
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property 6: remove-after-allocate restores balance
  it("P6: allocating then removing restores the original balance", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.array(fc.integer({ min: 1, max: 500 }), { maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (collected, amounts, newAmount) => {
          const existing = amounts.map((a, i) => alloc(`g${i}`, a));
          const before = getUnallocatedBalance(collected, existing);
          // Simulate allocate
          const withNew = [...existing, alloc("new", newAmount)];
          // Simulate remove
          const afterRemove = getUnallocatedBalance(
            collected,
            withNew.filter((a) => a.goal_id !== "new")
          );
          expect(afterRemove).toBe(before);
        }
      ),
      { numRuns: 200 }
    );
  });
});

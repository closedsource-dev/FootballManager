import { supabase } from "./supabase";
import type { GoalAllocation } from "../types";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getAllocations(): Promise<GoalAllocation[]> {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("goal_allocations")
    .select("*")
    .eq("user_id", user_id)
    .order("updated_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalAllocation[];
}

export async function setAllocation(
  goal_id: string,
  amount: number,
  target_amount: number,
  balance: number
): Promise<GoalAllocation> {
  if (amount <= 0) {
    throw new Error("Allocation amount must be greater than zero");
  }

  const effectiveCost = Math.min(amount, target_amount);

  const current = await getAllocations();
  const otherAllocations = current.filter((a) => a.goal_id !== goal_id);
  // Available = balance minus what other goals have already claimed (capped at their targets)
  const available = balance - otherAllocations.reduce(
    (sum, a) => sum + Number(a.allocated_amount),
    0
  );

  if (effectiveCost > available) {
    throw new Error(
      `Insufficient unallocated balance: £${available.toFixed(2)} available`
    );
  }

  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("goal_allocations")
    .upsert(
      { goal_id, allocated_amount: amount, updated_at: new Date().toISOString(), user_id },
      { onConflict: "goal_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GoalAllocation;
}

export async function removeAllocation(goal_id: string): Promise<void> {
  const { error } = await supabase
    .from("goal_allocations")
    .delete()
    .eq("goal_id", goal_id);
  if (error) throw new Error(error.message);
}

/**
 * Pure function. The allocatable pool is the current balance (collected - expenses),
 * not just collected. Each allocation only costs min(allocated, target) against the pool.
 * targets is a map of goal_id → target_amount so we can cap correctly.
 */
export function getUnallocatedBalance(
  balance: number,
  allocations: GoalAllocation[],
  targets: Record<string, number> = {}
): number {
  const totalAllocated = allocations.reduce((sum, a) => {
    const target = targets[a.goal_id] ?? Infinity;
    return sum + Math.min(Number(a.allocated_amount), target);
  }, 0);
  return balance - totalAllocated;
}

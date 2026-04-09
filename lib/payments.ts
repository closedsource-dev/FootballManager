import { supabase } from "./supabase";
import type {
  Payment,
  PaymentWithPlayer,
  BudgetSummary,
  MoneyGoal,
} from "../types";

// Insert a payment row.
// add_money + player_id → sync amount_paid on the player
// remove_money + player_id → subtract from player's amount_paid (floor 0)
export async function logPayment(
  payment: Omit<Payment, "id" | "paid_at">
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      player_id: payment.player_id,
      amount: payment.amount,
      type: payment.type,
      description: payment.description ?? "",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (payment.player_id) {
    const { data: player, error: fetchErr } = await supabase
      .from("players")
      .select("amount_paid")
      .eq("id", payment.player_id)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const current = Number(player.amount_paid ?? 0);
    const newAmount = payment.type === "add_money"
      ? current + payment.amount
      : Math.max(0, current - payment.amount);

    const { error: updateErr } = await supabase
      .from("players")
      .update({ amount_paid: newAmount, has_paid: newAmount > 0 })
      .eq("id", payment.player_id);

    if (updateErr) throw new Error(updateErr.message);
  }

  return data as Payment;
}

// Fetch all payments joined with player name, ordered newest first
export async function getPayments(): Promise<PaymentWithPlayer[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, players(name)")
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    player_id: row.player_id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    paid_at: row.paid_at,
    player_name: row.players?.name ?? null,
  }));
}

// Delete a single payment by id
export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Budget summary: add_money = collected, remove_money = expenses
export async function getBudgetSummary(): Promise<BudgetSummary> {
  const { data, error } = await supabase
    .from("payments")
    .select("type, amount");

  if (error) throw new Error(error.message);

  let total_collected = 0;
  let total_expenses = 0;

  for (const row of data ?? []) {
    if (row.type === "add_money") {
      total_collected += Number(row.amount);
    } else if (row.type === "remove_money") {
      total_expenses += Number(row.amount);
    }
  }

  return {
    total_collected,
    total_expenses,
    balance: total_collected - total_expenses,
  };
}

// Create a new money goal
export async function createGoal(
  goal: Omit<MoneyGoal, "id" | "created_at">
): Promise<MoneyGoal> {
  const { data, error } = await supabase
    .from("payment_goals")
    .insert({ title: goal.title, target_amount: goal.target_amount })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MoneyGoal;
}

// Fetch all money goals ordered by creation date
export async function getGoals(): Promise<MoneyGoal[]> {
  const { data, error } = await supabase
    .from("payment_goals")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MoneyGoal[];
}

// Delete a money goal by id
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("payment_goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

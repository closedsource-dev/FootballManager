import { supabase } from "./supabase";
import type { Payment, PaymentWithPlayer, BudgetSummary } from "../types";
import { addToCategory, removeFromCategory } from "./categories";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function logPayment(payment: Omit<Payment, "id"> & { paid_at?: string }): Promise<Payment> {
  const user_id = await getUserId();
  const paid_at = payment.paid_at || new Date().toISOString();
  const { data, error } = await supabase
    .from("payments")
    .insert({ ...payment, paid_at, description: payment.description ?? "", user_id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Update player balance if player_id is provided
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

  // Update category balance if category_id is provided
  if (payment.category_id) {
    if (payment.type === "add_money") {
      await addToCategory(payment.category_id, payment.amount);
    } else {
      await removeFromCategory(payment.category_id, payment.amount);
    }
  }

  return data as Payment;
}

export async function getPayments(): Promise<PaymentWithPlayer[]> {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("payments")
    .select("*, players(name), categories(name)")
    .eq("user_id", user_id)
    .order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    player_id: row.player_id,
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    paid_at: row.paid_at,
    player_name: row.players?.name ?? null,
    category_name: row.categories?.name ?? null,
  }));
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("payments")
    .select("type, amount")
    .eq("user_id", user_id);
  if (error) throw new Error(error.message);
  let total_collected = 0;
  let total_expenses = 0;
  for (const row of data ?? []) {
    if (row.type === "add_money") total_collected += Number(row.amount);
    else if (row.type === "remove_money") total_expenses += Number(row.amount);
  }
  return { total_collected, total_expenses, balance: total_collected - total_expenses };
}

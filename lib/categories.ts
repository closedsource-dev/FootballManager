import { supabase } from "./supabase";
import type { Category } from "../types";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getCategories(): Promise<Category[]> {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(category: Omit<Category, "id" | "created_at">): Promise<Category> {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...category, user_id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addToCategory(categoryId: string, amount: number): Promise<void> {
  const { data: category, error: fetchErr } = await supabase
    .from("categories")
    .select("amount")
    .eq("id", categoryId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  
  const newAmount = Number(category.amount ?? 0) + amount;
  const { error: updateErr } = await supabase
    .from("categories")
    .update({ amount: newAmount })
    .eq("id", categoryId);
  if (updateErr) throw new Error(updateErr.message);
}

export async function removeFromCategory(categoryId: string, amount: number): Promise<void> {
  const { data: category, error: fetchErr } = await supabase
    .from("categories")
    .select("amount")
    .eq("id", categoryId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  
  const currentAmount = Number(category.amount ?? 0);
  if (amount > currentAmount) {
    throw new Error(`Cannot remove ${amount} from category with only ${currentAmount}`);
  }
  
  const newAmount = currentAmount - amount;
  const { error: updateErr } = await supabase
    .from("categories")
    .update({ amount: newAmount })
    .eq("id", categoryId);
  if (updateErr) throw new Error(updateErr.message);
}

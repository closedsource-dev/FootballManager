import { supabase } from "./supabase";
import { getCurrentWorkspaceOwnerId } from "./workspaceHelper";
import type { Category } from "../types";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getCategories(): Promise<Category[]> {
  const user_id = await getCurrentWorkspaceOwnerId();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getCategories error:", error);
    throw new Error(error.message);
  }
  return (data ?? []) as Category[];
}

export async function createCategory(category: Omit<Category, "id" | "created_at">): Promise<Category> {
  const user_id = await getCurrentWorkspaceOwnerId();
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

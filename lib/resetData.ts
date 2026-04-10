import { supabase } from "./supabase";

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function resetAllUserData(): Promise<void> {
  const user_id = await getUserId();

  // Delete in order due to foreign key constraints
  // 1. Delete goal allocations
  const { error: allocError } = await supabase
    .from("goal_allocations")
    .delete()
    .eq("user_id", user_id);
  if (allocError) throw new Error(allocError.message);

  // 2. Delete game logs
  const { error: gamesError } = await supabase
    .from("game_logs")
    .delete()
    .eq("user_id", user_id);
  if (gamesError) throw new Error(gamesError.message);

  // 3. Delete categories BEFORE payments to avoid trigger conflicts
  // Set category amounts to 0 first to prevent the trigger from creating payments
  const { data: userCategories } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user_id);
  
  if (userCategories) {
    for (const cat of userCategories) {
      await supabase
        .from("categories")
        .update({ amount: 0 })
        .eq("id", cat.id);
    }
  }

  const { error: categoriesError } = await supabase
    .from("categories")
    .delete()
    .eq("user_id", user_id);
  if (categoriesError) throw new Error(categoriesError.message);

  // 4. Delete payments
  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .eq("user_id", user_id);
  if (paymentsError) throw new Error(paymentsError.message);

  // 5. Delete payment goals
  const { error: goalsError } = await supabase
    .from("payment_goals")
    .delete()
    .eq("user_id", user_id);
  if (goalsError) throw new Error(goalsError.message);

  // 6. Delete players (this will cascade to player_stats if it exists)
  const { error: playersError } = await supabase
    .from("players")
    .delete()
    .eq("user_id", user_id);
  if (playersError) throw new Error(playersError.message);
}

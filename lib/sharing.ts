import { supabase } from "./supabase";
import type { UserProfile, ShareWithUser, SharedWithMe, ShareRole } from "@/types";

export async function searchUsersByUsername(searchTerm: string): Promise<UserProfile[]> {
  const { data, error } = await supabase.rpc("search_users_by_username", {
    search_term: searchTerm,
  });

  if (error) throw error;
  return data || [];
}

export async function getMyWorkspaceShares(): Promise<ShareWithUser[]> {
  const { data, error } = await supabase.rpc("get_my_workspace_shares");

  if (error) throw error;
  return data || [];
}

export async function getSharedWithMe(): Promise<SharedWithMe[]> {
  const { data, error } = await supabase.rpc("get_shared_with_me");

  if (error) throw error;
  return data || [];
}

export async function shareWorkspace(userId: string, role: ShareRole): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workspace_shares").insert({
    owner_id: user.id,
    shared_with_id: userId,
    role,
  });

  if (error) throw error;
}

export async function updateShareRole(shareId: string, role: ShareRole): Promise<void> {
  const { error } = await supabase
    .from("workspace_shares")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) throw error;
}

export async function removeShare(shareId: string): Promise<void> {
  const { error } = await supabase.from("workspace_shares").delete().eq("id", shareId);

  if (error) throw error;
}

export async function updateUsername(username: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if username is already taken
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) {
    throw new Error("Username already taken");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) {
    // Handle unique constraint violation (code 23505)
    if (error.code === "23505" && error.message.includes("username")) {
      throw new Error("Username already taken");
    }
    throw error;
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", user.id);

  if (updateError) throw updateError;

  return data.publicUrl;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return { ...data, avatar_url: null };
}

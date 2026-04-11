import { supabase } from "./supabase";

/**
 * Gets the current workspace owner ID from localStorage or returns the current user's ID
 */
export async function getCurrentWorkspaceOwnerId(): Promise<string> {
  // Check if we're visiting someone else's workspace
  const stored = localStorage.getItem("visitingWorkspace");
  if (stored) {
    try {
      const { ownerId } = JSON.parse(stored);
      return ownerId;
    } catch {
      localStorage.removeItem("visitingWorkspace");
    }
  }

  // Default to current user's workspace
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Gets the current workspace role
 */
export function getCurrentWorkspaceRole(): "owner" | "viewer" | "editor" {
  const stored = localStorage.getItem("visitingWorkspace");
  if (stored) {
    try {
      const { role } = JSON.parse(stored);
      return role;
    } catch {
      localStorage.removeItem("visitingWorkspace");
    }
  }
  return "owner";
}

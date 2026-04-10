// Core shared types used across the entire app

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  position: Position;
  skill_rating: number; // 1–20, manually set, used for balanced team generation
  has_paid: boolean;
  amount_paid: number;
  games_played: number;
  games_won: number;
  created_at: string;
}

// Used for the add/edit form — no id or created_at yet
export type PlayerFormData = Omit<Player, "id" | "created_at">;

export interface Category {
  id: string;
  name: string;
  amount: number;
  created_at: string;
}

export interface PaymentWithPlayer extends Payment {
  player_name: string | null;
  category_name: string | null;
}

export interface BudgetSummary {
  total_collected: number;
  total_expenses: number;
  balance: number;
}

export type PaymentType = "add_money" | "remove_money";

export interface Payment {
  id: string;
  player_id: string | null;
  category_id: string | null;
  amount: number;
  type: PaymentType;
  description?: string;
  paid_at: string;
}

// Sharing and permissions types
export type ShareRole = "viewer" | "editor";

export interface WorkspaceShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  role: ShareRole;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  email: string;
}

export interface ShareWithUser {
  id: string;
  shared_with_username: string;
  shared_with_email: string;
  role: ShareRole;
  created_at: string;
}

export interface SharedWithMe {
  id: string;
  owner_username: string;
  owner_email: string;
  role: ShareRole;
  created_at: string;
}

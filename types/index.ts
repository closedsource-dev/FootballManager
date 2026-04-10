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

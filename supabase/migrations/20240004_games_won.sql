ALTER TABLE players ADD COLUMN IF NOT EXISTS games_won int NOT NULL DEFAULT 0 CHECK (games_won >= 0);

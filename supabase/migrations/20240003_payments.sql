CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('fee', 'expense', 'income')),
  description text NOT NULL DEFAULT '',
  paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

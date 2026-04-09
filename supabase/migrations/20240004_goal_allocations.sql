CREATE TABLE goal_allocations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id          uuid NOT NULL UNIQUE REFERENCES payment_goals(id) ON DELETE CASCADE,
  allocated_amount numeric NOT NULL CHECK (allocated_amount > 0),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

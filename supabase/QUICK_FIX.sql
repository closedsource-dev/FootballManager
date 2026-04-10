-- QUICK FIX: Run this if the fund is still shared between users
-- This will delete all data and set up proper user isolation

-- ============================================================================
-- STEP 1: Delete all existing data
-- ============================================================================

DELETE FROM goal_allocations;
DELETE FROM game_logs;
DELETE FROM payments;
DELETE FROM payment_goals;
DELETE FROM players;

-- ============================================================================
-- STEP 2: Ensure user_id columns exist
-- ============================================================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payment_goals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goal_allocations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE game_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: Make user_id NOT NULL
-- ============================================================================

ALTER TABLE players ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goal_allocations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE game_logs ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Drop existing policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own players" ON players;
DROP POLICY IF EXISTS "Users can insert their own players" ON players;
DROP POLICY IF EXISTS "Users can update their own players" ON players;
DROP POLICY IF EXISTS "Users can delete their own players" ON players;

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;

DROP POLICY IF EXISTS "Users can view their own goals" ON payment_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON payment_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON payment_goals;

DROP POLICY IF EXISTS "Users can view their own allocations" ON goal_allocations;
DROP POLICY IF EXISTS "Users can insert their own allocations" ON goal_allocations;
DROP POLICY IF EXISTS "Users can update their own allocations" ON goal_allocations;
DROP POLICY IF EXISTS "Users can delete their own allocations" ON goal_allocations;

DROP POLICY IF EXISTS "Users can view their own games" ON game_logs;
DROP POLICY IF EXISTS "Users can insert their own games" ON game_logs;
DROP POLICY IF EXISTS "Users can delete their own games" ON game_logs;

-- ============================================================================
-- STEP 6: Create RLS policies
-- ============================================================================

-- Players policies
CREATE POLICY "Users can view their own players" ON players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON players
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON players
  FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

-- Payment goals policies
CREATE POLICY "Users can view their own goals" ON payment_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON payment_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON payment_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Goal allocations policies
CREATE POLICY "Users can view their own allocations" ON goal_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations" ON goal_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations" ON goal_allocations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocations" ON goal_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- Game logs policies
CREATE POLICY "Users can view their own games" ON game_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games" ON game_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" ON game_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 7: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_goals_user_id ON payment_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_user_id ON goal_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_user_id ON game_logs(user_id);

-- ============================================================================
-- VERIFICATION: Run these queries to confirm everything is set up
-- ============================================================================

-- Check RLS is enabled (should show true for all tables)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs');

-- Check user_id columns exist (should show 5 rows)
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_name IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs')
  AND column_name = 'user_id';

-- Check policies exist (should show multiple policies per table)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs')
GROUP BY tablename;

-- Show your current user ID
SELECT auth.uid() as your_user_id;

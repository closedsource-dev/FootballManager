-- This migration adds user_id columns and RLS policies to ensure data isolation between users
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. Add user_id columns to all tables
-- ============================================================================

-- Add user_id to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to payment_goals table
ALTER TABLE payment_goals 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to goal_allocations table
ALTER TABLE goal_allocations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to game_logs table
ALTER TABLE game_logs 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. Create indexes for better query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_goals_user_id ON payment_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_user_id ON goal_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_user_id ON game_logs(user_id);

-- ============================================================================
-- 3. Update existing data (CHOOSE ONE OPTION)
-- ============================================================================

-- OPTION A: Delete all existing data (recommended for fresh start)
-- Uncomment these lines to delete all data:
-- DELETE FROM goal_allocations;
-- DELETE FROM game_logs;
-- DELETE FROM payments;
-- DELETE FROM payment_goals;
-- DELETE FROM players;

-- OPTION B: Assign existing data to a specific user
-- First, find your user ID: SELECT id, email FROM auth.users;
-- Then replace 'YOUR_USER_ID_HERE' with your actual user ID:
-- UPDATE players SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
-- UPDATE payments SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
-- UPDATE payment_goals SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
-- UPDATE goal_allocations SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
-- UPDATE game_logs SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;

-- ============================================================================
-- 4. Make user_id NOT NULL (run AFTER updating or deleting existing records)
-- ============================================================================

ALTER TABLE players ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goal_allocations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE game_logs ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- 5. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS policies for players
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own players" ON players;
CREATE POLICY "Users can view their own players" ON players
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own players" ON players;
CREATE POLICY "Users can insert their own players" ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own players" ON players;
CREATE POLICY "Users can update their own players" ON players
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own players" ON players;
CREATE POLICY "Users can delete their own players" ON players
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. Create RLS policies for payments
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;
CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Create RLS policies for payment_goals
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own goals" ON payment_goals;
CREATE POLICY "Users can view their own goals" ON payment_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON payment_goals;
CREATE POLICY "Users can insert their own goals" ON payment_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON payment_goals;
CREATE POLICY "Users can delete their own goals" ON payment_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. Create RLS policies for goal_allocations
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own allocations" ON goal_allocations;
CREATE POLICY "Users can view their own allocations" ON goal_allocations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own allocations" ON goal_allocations;
CREATE POLICY "Users can insert their own allocations" ON goal_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own allocations" ON goal_allocations;
CREATE POLICY "Users can update their own allocations" ON goal_allocations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own allocations" ON goal_allocations;
CREATE POLICY "Users can delete their own allocations" ON goal_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. Create RLS policies for game_logs
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own games" ON game_logs;
CREATE POLICY "Users can view their own games" ON game_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own games" ON game_logs;
CREATE POLICY "Users can insert their own games" ON game_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own games" ON game_logs;
CREATE POLICY "Users can delete their own games" ON game_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Verification query - run this to check everything is set up correctly
-- ============================================================================

-- Check that all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs');

-- Check that all tables have user_id column
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs')
  AND column_name = 'user_id';

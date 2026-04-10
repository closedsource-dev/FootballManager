-- Migration: Replace Money Goals with Categories
-- This replaces the goal allocation system with a simpler category system

-- ============================================================================
-- 1. Create categories table
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Add category_id to payments table
-- ============================================================================

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_category_id ON payments(category_id);

-- ============================================================================
-- 4. Enable Row Level Security on categories
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create RLS policies for categories
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Optional: Drop old goal tables (ONLY if you want to remove them)
-- ============================================================================

-- Uncomment these lines if you want to completely remove the old system:
-- DROP TABLE IF EXISTS goal_allocations CASCADE;
-- DROP TABLE IF EXISTS payment_goals CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================

-- Check that categories table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'categories';

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'categories';

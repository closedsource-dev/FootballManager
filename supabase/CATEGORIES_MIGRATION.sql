-- Categories Migration
-- This migration creates the categories table and sets up triggers to automatically
-- update category amounts when payments are logged

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Add category_id column to payments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create function to update category amounts when payments are logged
-- When a player contributes to a category (payment type = add_money with category_id), increase category amount
-- This represents: player adds money to general fund AND allocates it to a category in one action
CREATE OR REPLACE FUNCTION update_category_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if payment has a category_id
  IF NEW.category_id IS NOT NULL THEN
    IF NEW.type = 'add_money' THEN
      -- Player contributing to category (adds to both player balance and category)
      UPDATE categories 
      SET amount = amount + NEW.amount 
      WHERE id = NEW.category_id;
    ELSIF NEW.type = 'remove_money' THEN
      -- This shouldn't happen in normal flow, but handle it for completeness
      UPDATE categories 
      SET amount = amount - NEW.amount 
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update category amounts
DROP TRIGGER IF EXISTS payment_category_update ON payments;
CREATE TRIGGER payment_category_update
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_category_amount();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_category_id ON payments(category_id);

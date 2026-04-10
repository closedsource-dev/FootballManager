-- Fix the category trigger to handle add_money correctly
-- Run this in your Supabase SQL Editor

DROP TRIGGER IF EXISTS payment_category_update ON payments;
DROP FUNCTION IF EXISTS update_category_amount();

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
      -- Removing from category
      UPDATE categories 
      SET amount = amount - NEW.amount 
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_category_update
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_category_amount();

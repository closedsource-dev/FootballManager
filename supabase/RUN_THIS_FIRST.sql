-- Step 1: Drop old triggers and functions if they exist
DROP TRIGGER IF EXISTS payment_category_update ON payments;
DROP TRIGGER IF EXISTS category_delete_return_balance ON categories;
DROP FUNCTION IF EXISTS update_category_amount();
DROP FUNCTION IF EXISTS return_category_balance_on_delete();

-- Step 2: Add category_id column to payments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 3: Create the trigger function
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

-- Step 4: Create the trigger
CREATE TRIGGER payment_category_update
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_category_amount();

-- Done! Now try adding money to a category.

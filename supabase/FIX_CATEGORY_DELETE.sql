-- Remove the trigger that returns money when category is deleted
-- When a category is deleted, the money should just disappear (reduce total balance)

DROP TRIGGER IF EXISTS category_delete_return_balance ON categories;
DROP FUNCTION IF EXISTS return_category_balance_on_delete();

-- Categories will now just be deleted without any payment being created

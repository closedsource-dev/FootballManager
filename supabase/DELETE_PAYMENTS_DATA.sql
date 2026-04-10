-- Delete all payment-related data while keeping players
-- Run this in Supabase SQL Editor

-- Delete all payments (this will also trigger updates to player balances via triggers)
DELETE FROM payments;

-- Delete all categories
DELETE FROM categories;

-- Reset player payment amounts to 0
UPDATE players SET amount_paid = 0;

-- Verify the cleanup
SELECT 'Payments deleted' as status, COUNT(*) as count FROM payments
UNION ALL
SELECT 'Categories deleted' as status, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Players remaining' as status, COUNT(*) as count FROM players;

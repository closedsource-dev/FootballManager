# Testing User Data Isolation

## Step 1: Check if RLS is enabled

Run this in Supabase SQL Editor:

```sql
-- Check if Row Level Security is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs');
```

Expected result: All tables should show `rowsecurity = true`

## Step 2: Check if user_id columns exist

```sql
-- Check if user_id columns exist and are NOT NULL
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs')
  AND column_name = 'user_id'
ORDER BY table_name;
```

Expected result: All 5 tables should have user_id column with `is_nullable = NO`

## Step 3: Check if policies exist

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('players', 'payments', 'payment_goals', 'goal_allocations', 'game_logs')
ORDER BY tablename, policyname;
```

Expected result: Each table should have multiple policies (SELECT, INSERT, UPDATE, DELETE)

## Step 4: Test data isolation

```sql
-- Get your current user ID
SELECT auth.uid() as my_user_id;

-- Check if payments are filtered by user_id
SELECT id, amount, type, user_id 
FROM payments 
LIMIT 5;

-- This should only show YOUR payments (where user_id = your user id)
```

## If RLS is NOT enabled:

You need to run the migration file: `supabase/migrations/SETUP_USER_ISOLATION.sql`

**IMPORTANT**: Before running the migration, decide what to do with existing data:

### Option A: Delete all existing data (recommended)
In the SQL file, uncomment these lines in section 3:
```sql
DELETE FROM goal_allocations;
DELETE FROM game_logs;
DELETE FROM payments;
DELETE FROM payment_goals;
DELETE FROM players;
```

### Option B: Assign existing data to your user
1. First get your user ID:
```sql
SELECT id, email FROM auth.users;
```

2. Then in the SQL file, replace 'YOUR_USER_ID_HERE' with your actual ID and uncomment:
```sql
UPDATE players SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE payments SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE payment_goals SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE goal_allocations SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE game_logs SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
```

## Common Issues

### Issue: "null value in column user_id violates not-null constraint"
**Solution**: You have existing data without user_id. Choose Option A or B above.

### Issue: "Fund is still shared between users"
**Solution**: RLS policies are not active. Run the migration script.

### Issue: "Cannot read properties of null"
**Solution**: Make sure you're logged in and auth.uid() returns a valid user ID.

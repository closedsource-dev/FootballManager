# Fix: Fund Still Shared Between Users

## The Problem
The fund is shared between users because Row Level Security (RLS) is not enabled in your Supabase database.

## The Solution (3 Easy Steps)

### Step 1: Run the Quick Fix SQL
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase/QUICK_FIX.sql`
4. Click "Run"

**⚠️ WARNING**: This will delete ALL existing data (players, payments, games, goals). You'll start fresh with proper user isolation.

### Step 2: Verify It Worked
After running the SQL, check the verification queries at the bottom of the script. You should see:
- All tables have `rowsecurity = true`
- All tables have `user_id` column with `is_nullable = NO`
- Each table has multiple policies

### Step 3: Test in Your App
1. Go to your app at `/debug` (e.g., `http://localhost:3000/debug`)
2. Check that all items show "✓ (yours)"
3. If you see any "✗ (not yours!)" - the RLS is still not working

## Alternative: Keep Existing Data

If you want to keep your existing data and assign it to your user:

1. Get your user ID:
```sql
SELECT id, email FROM auth.users;
```

2. Before running QUICK_FIX.sql, replace the DELETE statements in Step 1 with:
```sql
UPDATE players SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE payments SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE payment_goals SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE goal_allocations SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
UPDATE game_logs SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
```

3. Then run the rest of the QUICK_FIX.sql script

## Why This Happens

Supabase tables don't have RLS enabled by default. Without RLS:
- All users can see all data
- The `user_id` column exists but isn't enforced
- Queries return data from all users

With RLS enabled:
- Each user can only see their own data
- Supabase automatically filters queries by `auth.uid()`
- Complete data isolation between users

## Still Not Working?

1. Check the debug page: `/debug`
2. Make sure you're logged in
3. Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'payments';
```
4. Check if policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'payments';
```

If you still see issues, the RLS policies might not be active. Try:
1. Sign out and sign back in
2. Clear browser cache
3. Restart your development server

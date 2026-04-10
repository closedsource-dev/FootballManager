# Complete Setup Guide

## What's Been Fixed in the Code

✅ Reset button now refreshes the page automatically  
✅ All queries filter by user_id  
✅ Player selection works in Payments tab  
✅ Dark mode works for all payment components  
✅ Removed player_stats system  

## What You Need to Do in Supabase

### Quick Setup (Recommended)

**This will delete all existing data and set up proper user isolation.**

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/QUICK_FIX.sql`
3. Paste and click "Run"
4. Done! Each user now has their own isolated data.

### Verify It's Working

#### Method 1: Use the Debug Page
1. Go to `http://localhost:3000/debug` in your app
2. Check that all items show "✓ (yours)"
3. If you see "✗ (not yours!)" - RLS is not working

#### Method 2: Test with Two Users
1. Sign in with User A
2. Add some players and payments
3. Note the fund balance
4. Sign out
5. Sign in with User B
6. You should see NO data from User A
7. Add different data for User B
8. Sign out and sign back in as User A
9. Your original data should still be there

### What the SQL Script Does

1. **Deletes all existing data** (players, payments, games, goals)
2. **Adds user_id columns** to all tables
3. **Makes user_id required** (NOT NULL)
4. **Enables Row Level Security (RLS)** on all tables
5. **Creates RLS policies** that filter data by user
6. **Creates indexes** for better performance

### Understanding Row Level Security (RLS)

Without RLS:
```
User A queries payments → Gets ALL payments from ALL users ❌
User B queries payments → Gets ALL payments from ALL users ❌
```

With RLS:
```
User A queries payments → Gets ONLY User A's payments ✅
User B queries payments → Gets ONLY User B's payments ✅
```

## Files You Can Use

### For Setup
- `supabase/QUICK_FIX.sql` - Fast setup, deletes all data
- `supabase/migrations/SETUP_USER_ISOLATION.sql` - Full migration with options

### For Testing
- `app/debug/page.tsx` - Debug page at `/debug`
- `TEST_USER_ISOLATION.md` - Detailed testing instructions

### For Reference
- `FIX_SHARED_FUND.md` - Troubleshooting guide
- `CHANGES_SUMMARY.md` - What was changed in the code

## Common Issues

### "null value in column user_id violates not-null constraint"
**Cause**: You have existing data without user_id  
**Solution**: Run QUICK_FIX.sql which deletes all data first

### "Fund is still shared between users"
**Cause**: RLS is not enabled or policies are not active  
**Solution**: 
1. Run QUICK_FIX.sql
2. Check `/debug` page
3. Verify with the SQL queries in TEST_USER_ISOLATION.md

### "Cannot read properties of null"
**Cause**: Not logged in or auth.uid() is null  
**Solution**: Make sure you're signed in to the app

### Changes don't take effect
**Cause**: Cached data in browser or app  
**Solution**: 
1. Sign out and sign back in
2. Clear browser cache
3. Restart development server
4. Use the Reset button in the app

## Development Workflow

After setup, here's how to work with the app:

1. **Each developer** should have their own Supabase account/project
2. **Each developer** runs the QUICK_FIX.sql in their own project
3. **Each user** in production will have isolated data automatically
4. **Use the Reset button** in the app to clear your test data anytime

## Production Deployment

Before deploying to production:

1. ✅ Run QUICK_FIX.sql on your production Supabase
2. ✅ Test with multiple user accounts
3. ✅ Verify RLS is working with `/debug` page
4. ✅ Remove or protect the `/debug` page (optional)

## Need Help?

1. Check `/debug` page first
2. Read FIX_SHARED_FUND.md
3. Run the verification queries in QUICK_FIX.sql
4. Check Supabase logs for errors

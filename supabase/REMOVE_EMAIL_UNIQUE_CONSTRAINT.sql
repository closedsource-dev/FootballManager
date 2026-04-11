-- Remove the UNIQUE constraint on email column
-- Supabase Auth already enforces email uniqueness in auth.users table
-- Having it in profiles table can cause conflicts during user creation

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_email_unique;

-- The username UNIQUE constraint should remain
-- Email uniqueness is handled by Supabase Auth

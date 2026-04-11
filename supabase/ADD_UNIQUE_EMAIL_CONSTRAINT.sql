-- Add UNIQUE constraint to email column in profiles table
-- This ensures no duplicate emails can exist in the profiles table
-- (Supabase Auth already enforces this in auth.users, but this adds an extra layer)

ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add a comment to document this constraint
COMMENT ON CONSTRAINT profiles_email_unique ON profiles IS 
'Ensures email uniqueness in profiles table, complementing Supabase Auth email uniqueness';

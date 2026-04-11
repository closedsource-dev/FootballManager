-- Create a function to check if an email is already registered
-- This helps prevent duplicate email signups

CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = check_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION check_email_exists(TEXT) IS 
'Checks if an email is already registered in auth.users table. Used to prevent duplicate signups.';

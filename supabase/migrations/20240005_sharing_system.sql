-- Sharing and Permissions System Migration
-- This adds username support and workspace sharing capabilities

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill existing users into profiles table
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Create workspace_shares table for managing shared access
CREATE TABLE IF NOT EXISTS workspace_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_shares_owner ON workspace_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_shared_with ON workspace_shares(shared_with_id);

-- Enable RLS on workspace_shares
ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;

-- Policies for workspace_shares
-- Users can view shares they own or are part of
DROP POLICY IF EXISTS "Users can view their shares" ON workspace_shares;
CREATE POLICY "Users can view their shares"
  ON workspace_shares FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = shared_with_id
  );

-- Only owners can create shares
DROP POLICY IF EXISTS "Owners can create shares" ON workspace_shares;
CREATE POLICY "Owners can create shares"
  ON workspace_shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can update shares
DROP POLICY IF EXISTS "Owners can update shares" ON workspace_shares;
CREATE POLICY "Owners can update shares"
  ON workspace_shares FOR UPDATE
  USING (auth.uid() = owner_id);

-- Only owners can delete shares
DROP POLICY IF EXISTS "Owners can delete shares" ON workspace_shares;
CREATE POLICY "Owners can delete shares"
  ON workspace_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- 3. Update RLS policies for existing tables to support sharing

-- Helper function to check if user has access (owner or shared with editor/viewer rights)
CREATE OR REPLACE FUNCTION has_workspace_access(workspace_owner_id UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
BEGIN
  -- User is the owner
  IF auth.uid() = workspace_owner_id THEN
    RETURN TRUE;
  END IF;
  
  -- User has been granted access
  IF required_role = 'viewer' THEN
    -- Viewer or editor access is sufficient
    RETURN EXISTS (
      SELECT 1 FROM workspace_shares
      WHERE owner_id = workspace_owner_id
        AND shared_with_id = auth.uid()
        AND role IN ('viewer', 'editor')
    );
  ELSIF required_role = 'editor' THEN
    -- Only editor access is sufficient
    RETURN EXISTS (
      SELECT 1 FROM workspace_shares
      WHERE owner_id = workspace_owner_id
        AND shared_with_id = auth.uid()
        AND role = 'editor'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update players table policies
DROP POLICY IF EXISTS "Users can view own players" ON players;
DROP POLICY IF EXISTS "Users can insert own players" ON players;
DROP POLICY IF EXISTS "Users can update own players" ON players;
DROP POLICY IF EXISTS "Users can delete own players" ON players;
DROP POLICY IF EXISTS "Users can view accessible players" ON players;
DROP POLICY IF EXISTS "Editors can update players" ON players;
DROP POLICY IF EXISTS "Editors can delete players" ON players;

CREATE POLICY "Users can view accessible players"
  ON players FOR SELECT
  USING (has_workspace_access(user_id, 'viewer'));

CREATE POLICY "Users can insert own players"
  ON players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Editors can update players"
  ON players FOR UPDATE
  USING (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can delete players"
  ON players FOR DELETE
  USING (has_workspace_access(user_id, 'editor'));

-- Update payments table policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;
DROP POLICY IF EXISTS "Users can view accessible payments" ON payments;
DROP POLICY IF EXISTS "Editors can insert payments" ON payments;
DROP POLICY IF EXISTS "Editors can update payments" ON payments;
DROP POLICY IF EXISTS "Editors can delete payments" ON payments;

CREATE POLICY "Users can view accessible payments"
  ON payments FOR SELECT
  USING (has_workspace_access(user_id, 'viewer'));

CREATE POLICY "Editors can insert payments"
  ON payments FOR INSERT
  WITH CHECK (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can update payments"
  ON payments FOR UPDATE
  USING (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can delete payments"
  ON payments FOR DELETE
  USING (has_workspace_access(user_id, 'editor'));

-- Update categories table policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view accessible categories" ON categories;
DROP POLICY IF EXISTS "Editors can insert categories" ON categories;
DROP POLICY IF EXISTS "Editors can update categories" ON categories;
DROP POLICY IF EXISTS "Editors can delete categories" ON categories;

CREATE POLICY "Users can view accessible categories"
  ON categories FOR SELECT
  USING (has_workspace_access(user_id, 'viewer'));

CREATE POLICY "Editors can insert categories"
  ON categories FOR INSERT
  WITH CHECK (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can update categories"
  ON categories FOR UPDATE
  USING (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can delete categories"
  ON categories FOR DELETE
  USING (has_workspace_access(user_id, 'editor'));

-- Update games table policies (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view accessible games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can insert games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can update games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can delete games" ON games';
    
    EXECUTE 'CREATE POLICY "Users can view accessible games" ON games FOR SELECT USING (has_workspace_access(user_id, ''viewer''))';
    EXECUTE 'CREATE POLICY "Editors can insert games" ON games FOR INSERT WITH CHECK (has_workspace_access(user_id, ''editor''))';
    EXECUTE 'CREATE POLICY "Editors can update games" ON games FOR UPDATE USING (has_workspace_access(user_id, ''editor''))';
    EXECUTE 'CREATE POLICY "Editors can delete games" ON games FOR DELETE USING (has_workspace_access(user_id, ''editor''))';
  END IF;
END $$;

-- 4. Function to search users by username
CREATE OR REPLACE FUNCTION search_users_by_username(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url
  FROM profiles p
  WHERE p.username ILIKE '%' || search_term || '%'
    AND p.id != auth.uid()
    AND p.username IS NOT NULL
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_users_by_username(TEXT) TO authenticated;

-- 5. Function to get workspace shares for current user
CREATE OR REPLACE FUNCTION get_my_workspace_shares()
RETURNS TABLE (
  id UUID,
  shared_with_username TEXT,
  shared_with_avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    p.username,
    p.avatar_url,
    ws.role,
    ws.created_at
  FROM workspace_shares ws
  JOIN profiles p ON p.id = ws.shared_with_id
  WHERE ws.owner_id = auth.uid()
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_my_workspace_shares() TO authenticated;

-- 6. Function to get workspaces shared with me
CREATE OR REPLACE FUNCTION get_shared_with_me()
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  owner_username TEXT,
  owner_avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.owner_id,
    p.username,
    p.avatar_url,
    ws.role,
    ws.created_at
  FROM workspace_shares ws
  JOIN profiles p ON p.id = ws.owner_id
  WHERE ws.shared_with_id = auth.uid()
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_shared_with_me() TO authenticated;

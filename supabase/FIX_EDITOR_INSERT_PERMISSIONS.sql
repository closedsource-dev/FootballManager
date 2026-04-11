-- Fix INSERT permissions for editors
-- This allows editors to insert data into workspaces they have editor access to

-- Fix players table - allow editors to insert
DROP POLICY IF EXISTS "Users can insert own players" ON players;
CREATE POLICY "Editors can insert players"
  ON players FOR INSERT
  WITH CHECK (has_workspace_access(user_id, 'editor'));

-- Verify game_logs table has correct policies (should already be fixed by FIX_GAME_LOGS_RLS.sql)
-- But we'll add them here too in case that script wasn't run

-- First, enable RLS on game_logs if not already enabled
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own games" ON game_logs;
DROP POLICY IF EXISTS "Users can insert own games" ON game_logs;
DROP POLICY IF EXISTS "Users can update own games" ON game_logs;
DROP POLICY IF EXISTS "Users can delete own games" ON game_logs;
DROP POLICY IF EXISTS "Users can view accessible games" ON game_logs;
DROP POLICY IF EXISTS "Editors can insert games" ON game_logs;
DROP POLICY IF EXISTS "Editors can update games" ON game_logs;
DROP POLICY IF EXISTS "Editors can delete games" ON game_logs;

-- Create new policies for game_logs
CREATE POLICY "Users can view accessible games"
  ON game_logs FOR SELECT
  USING (has_workspace_access(user_id, 'viewer'));

CREATE POLICY "Editors can insert games"
  ON game_logs FOR INSERT
  WITH CHECK (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can update games"
  ON game_logs FOR UPDATE
  USING (has_workspace_access(user_id, 'editor'));

CREATE POLICY "Editors can delete games"
  ON game_logs FOR DELETE
  USING (has_workspace_access(user_id, 'editor'));

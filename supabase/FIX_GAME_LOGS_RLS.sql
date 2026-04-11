-- Fix RLS policies for game_logs table to support workspace sharing

-- Enable RLS if not already enabled
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own games" ON game_logs;
DROP POLICY IF EXISTS "Users can insert own games" ON game_logs;
DROP POLICY IF EXISTS "Users can update own games" ON game_logs;
DROP POLICY IF EXISTS "Users can delete own games" ON game_logs;
DROP POLICY IF EXISTS "Users can view accessible games" ON game_logs;
DROP POLICY IF EXISTS "Editors can insert games" ON game_logs;
DROP POLICY IF EXISTS "Editors can update games" ON game_logs;
DROP POLICY IF EXISTS "Editors can delete games" ON game_logs;

-- Create new policies that support workspace sharing
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

-- Add avatar_url column to existing profiles table
-- Run this if you already had a profiles table before the sharing migration

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

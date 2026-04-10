# Sharing System Implementation

## Overview
The sharing system allows users to share their workspace (players, payments, categories, games) with other users, with granular permission controls.

## Features

### 1. Username System
- Users must set a username to use sharing features
- Usernames are unique across the platform
- Existing users see a welcome modal prompting them to set a username
- Username requirements: 3+ characters, letters, numbers, hyphens, and underscores only

### 2. Permission Levels
- **Viewer**: Can view all data but cannot make changes
- **Editor**: Can view and modify all data (equivalent to admin/owner)

### 3. Sharing Interface
- Share button in navbar (left of dark/light mode toggle)
- Two-tab modal:
  - **Add People**: Search users by username and grant access
  - **Manage Access**: View and modify existing shares

### 4. Database Structure

#### New Tables
- `workspace_shares`: Tracks who has access to whose workspace
  - `owner_id`: The workspace owner
  - `shared_with_id`: The user being granted access
  - `role`: Either 'viewer' or 'editor'

#### Updated Tables
- `profiles`: Added `username` column (unique, indexed)

### 5. Row Level Security (RLS)
All existing tables (players, payments, categories, games) now support shared access:
- Owners can always access their own data
- Viewers can read data from workspaces shared with them
- Editors can read and write data from workspaces shared with them

### 6. Helper Functions
- `has_workspace_access()`: Checks if a user has access to a workspace
- `search_users_by_username()`: Search for users to share with
- `get_my_workspace_shares()`: Get list of people you've shared with
- `get_shared_with_me()`: Get list of workspaces shared with you

## Setup Instructions

1. Run the migration in Supabase SQL Editor:
   ```
   football-manager/supabase/migrations/20240005_sharing_system.sql
   ```

2. The system will automatically:
   - Add username column to profiles
   - Create workspace_shares table
   - Update RLS policies for all tables
   - Create helper functions

3. Existing users will see a username setup modal on next login

## Usage

### For Workspace Owners
1. Click the "👥 Share" button in the navbar
2. Search for users by username
3. Grant them Viewer or Editor access
4. Manage existing shares in the "Manage Access" tab

### For Shared Users
- Access shared workspaces just like your own
- Viewers can browse but not modify
- Editors have full access (except sharing with others)

## Security
- All data access is controlled by RLS policies
- Users can only share their own workspaces
- Usernames are unique and indexed for fast lookups
- Password confirmation required for data reset

## Files Added/Modified

### New Files
- `supabase/migrations/20240005_sharing_system.sql` - Database migration
- `lib/sharing.ts` - Sharing API functions
- `components/ui/ShareModal.tsx` - Sharing interface
- `components/ui/UsernameSetup.tsx` - Username setup modal
- `types/index.ts` - Added sharing types

### Modified Files
- `components/ui/Navbar.tsx` - Added share button and username check
- All data access respects new RLS policies automatically

## Future Enhancements
- Email invitations for users not yet on the platform
- Workspace switching UI for users with multiple shared workspaces
- Activity log showing who made what changes
- More granular permissions (e.g., read-only for specific sections)

# Football Manager

A full-stack web app for managing a recreational football team with category-based fund tracking. Built with Next.js, TypeScript, and Supabase.

**Live demo:** [[https://football-manager-wheat.vercel.app]]((https://football-manager-wheat.vercel.app))

## Features

- **Players** — manage your roster with skill ratings, win rates, and individual payment balances
- **Games** — generate balanced teams using a position-aware algorithm with a configurable skill tolerance, record scores, and track game history
- **Payments** — fund management with transaction history, money goals, and budget tracking
- **Dashboard** — overview of players, fund balance, games played, and team rank progression
- **Dark mode** — full dark/light theme toggle, persisted across sessions
- **Multi-currency** — switch between GBP, EUR, and USD

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (PostgreSQL + realtime)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Getting Started

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

Run the SQL migrations in `supabase/migrations/` in order against your Supabase project, then also run:

```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS games_won int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score_a int NOT NULL,
  score_b int NOT NULL,
  team_a_ids uuid[] NOT NULL,
  team_b_ids uuid[] NOT NULL,
  winner text NOT NULL CHECK (winner IN ('A', 'B', 'draw')),
  played_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_logs DISABLE ROW LEVEL SECURITY;
```

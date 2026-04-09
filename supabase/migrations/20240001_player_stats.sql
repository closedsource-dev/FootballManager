CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  games_played int NOT NULL DEFAULT 1 CHECK (games_played >= 0),
  goals int CHECK (goals >= 0),
  assists int CHECK (assists >= 0),
  saves int CHECK (saves >= 0),
  goals_conceded int CHECK (goals_conceded >= 0),
  clean_sheets int CHECK (clean_sheets >= 0),
  tackles int CHECK (tackles >= 0),
  interceptions int CHECK (interceptions >= 0),
  key_passes int CHECK (key_passes >= 0),
  shots_on_target int CHECK (shots_on_target >= 0),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

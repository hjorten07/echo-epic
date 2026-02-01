-- Add imposter game tables and win tracking columns

-- Add imposter_wins column to profiles (for imposter-specific wins)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS imposter_wins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS imposter_catches integer DEFAULT 0;

-- Game ratings table for Song Rush and Imposter (not counted as profile ratings)
CREATE TABLE IF NOT EXISTS public.game_session_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lobby_id uuid NOT NULL REFERENCES public.game_lobbies(id) ON DELETE CASCADE,
  game_type text NOT NULL DEFAULT 'song_rush',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, lobby_id)
);

-- Enable RLS
ALTER TABLE public.game_session_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_session_ratings
CREATE POLICY "Anyone can view game ratings"
  ON public.game_session_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate games they participated in"
  ON public.game_session_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add game_type column to game_lobbies to distinguish Song Rush from Imposter
ALTER TABLE public.game_lobbies 
ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'song_rush';

-- Add is_imposter column to game_players for Imposter game
ALTER TABLE public.game_players 
ADD COLUMN IF NOT EXISTS is_imposter boolean DEFAULT false;

-- Add Imposter-related badges
INSERT INTO public.badges (name, description, icon, category, threshold)
VALUES 
  ('Imposter Hunter', 'Won your first Imposter game by catching the imposter', 'spy', 'behavior', NULL),
  ('Master of Deception', 'Won your first Imposter game as the imposter', 'mask', 'behavior', NULL),
  ('Detective', 'Caught 10 imposters', 'search', 'milestone', 10),
  ('Infiltrator', 'Won 10 games as the imposter', 'user-x', 'milestone', 10)
ON CONFLICT DO NOTHING;
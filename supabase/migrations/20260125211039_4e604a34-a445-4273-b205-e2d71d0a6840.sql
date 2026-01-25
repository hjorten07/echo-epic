-- Create a security definer function to get public counts (doesn't require auth)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_ratings', (SELECT COUNT(*) FROM public.ratings)
  )
$$;

-- Create a table to store banned words for chat filter (admin managed)
CREATE TABLE IF NOT EXISTS public.banned_words (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Anyone can read banned words (needed for chat filter)
CREATE POLICY "Anyone can view banned words"
ON public.banned_words FOR SELECT
USING (true);

-- Only admins can manage banned words
CREATE POLICY "Admins can insert banned words"
ON public.banned_words FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete banned words"
ON public.banned_words FOR DELETE
USING (is_admin());

-- Create a table for platform settings/dynamics (admin configurable)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id text PRIMARY KEY DEFAULT 'default',
  min_ratings_for_ranking integer NOT NULL DEFAULT 50,
  global_avg_rating numeric NOT NULL DEFAULT 7.0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE
USING (is_admin());

-- Insert default settings
INSERT INTO public.platform_settings (id, min_ratings_for_ranking, global_avg_rating)
VALUES ('default', 50, 7.0)
ON CONFLICT (id) DO NOTHING;

-- Insert some default banned words for chat filter
INSERT INTO public.banned_words (word) VALUES
  ('nigger'), ('nigga'), ('faggot'), ('fag'), ('retard'),
  ('cunt'), ('kike'), ('spic'), ('chink'), ('wetback'),
  ('beaner'), ('kys')
ON CONFLICT (word) DO NOTHING;
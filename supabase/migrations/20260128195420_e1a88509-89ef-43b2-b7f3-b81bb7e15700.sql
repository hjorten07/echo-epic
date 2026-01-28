-- Create game_themes table for Song Rush themes
CREATE TABLE public.game_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_themes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active themes
CREATE POLICY "Anyone can view active themes" ON public.game_themes
  FOR SELECT USING (is_active = true OR is_admin());

-- Admins can manage themes
CREATE POLICY "Admins can insert themes" ON public.game_themes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update themes" ON public.game_themes
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete themes" ON public.game_themes
  FOR DELETE USING (is_admin());

-- Add cover_image column to playlists for custom playlist images
ALTER TABLE public.playlists ADD COLUMN cover_image text;

-- Insert some default themes for Song Rush
INSERT INTO public.game_themes (name, description) VALUES
  ('Love Songs', 'Find the best love song'),
  ('90s Hits', 'Best songs from the 1990s'),
  ('Summer Vibes', 'Songs that feel like summer'),
  ('Road Trip', 'Perfect driving songs'),
  ('Workout Anthems', 'Songs to pump you up'),
  ('Chill Vibes', 'Relaxing and mellow tracks'),
  ('Party Starters', 'Songs that get the party going'),
  ('Throwback Thursday', 'Classic hits from any era'),
  ('One Hit Wonders', 'Songs from artists known for one hit'),
  ('Guilty Pleasures', 'Songs you secretly love');
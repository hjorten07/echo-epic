-- Add deleted column to messages for soft delete
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_songs table
CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_name TEXT NOT NULL,
  song_artist TEXT,
  song_image TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- Playlists policies
CREATE POLICY "Users can view their own playlists"
ON public.playlists FOR SELECT
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create playlists"
ON public.playlists FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own playlists"
ON public.playlists FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own playlists"
ON public.playlists FOR DELETE
USING (user_id = auth.uid());

-- Playlist songs policies
CREATE POLICY "Users can view playlist songs"
ON public.playlist_songs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND (user_id = auth.uid() OR is_public = true)
));

CREATE POLICY "Users can add songs to own playlists"
ON public.playlist_songs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update songs in own playlists"
ON public.playlist_songs FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete songs from own playlists"
ON public.playlist_songs FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

-- Update messages policy to allow viewing deleted messages for admin
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (
  (sender_id = auth.uid() OR receiver_id = auth.uid())
  AND (deleted_by_sender = false OR sender_id != auth.uid())
);

-- Admin can view all messages including deleted
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (is_admin());

-- Allow users to update (soft delete) their own sent messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());
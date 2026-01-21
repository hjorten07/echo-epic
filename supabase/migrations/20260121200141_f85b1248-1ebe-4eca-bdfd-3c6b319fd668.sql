
-- Create messages table for mutual followers chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_requests table for private profiles
CREATE TABLE public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'milestone',
  threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  displayed BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER,
  UNIQUE(user_id, badge_id)
);

-- Create user_streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, threshold) VALUES
('First Steps', 'Rated 10 items', '🎵', 'milestone', 10),
('Music Explorer', 'Rated 50 items', '🎧', 'milestone', 50),
('Dedicated Listener', 'Rated 100 items', '🎤', 'milestone', 100),
('Music Enthusiast', 'Rated 250 items', '🎸', 'milestone', 250),
('Rhythm Master', 'Rated 500 items', '🥁', 'milestone', 500),
('Sound Sage', 'Rated 750 items', '🎹', 'milestone', 750),
('Music Legend', 'Rated 1000 items', '🏆', 'milestone', 1000),
('Audiophile', 'Rated 3000 items', '💎', 'milestone', 3000),
('Music Maestro', 'Rated 5000 items', '👑', 'milestone', 5000),
('Harmony Hero', 'Rated 7500 items', '⭐', 'milestone', 7500),
('Ultimate Rater', 'Rated 10000 items', '🌟', 'milestone', 10000),
('Song Critic', 'Average rating below 3', '🔍', 'behavior', NULL),
('Balanced Listener', 'Average rating between 4 and 6', '⚖️', 'behavior', NULL),
('Music Lover', 'Average rating between 7 and 8', '❤️', 'behavior', NULL),
('Easy to Please', 'Average rating above 9', '😊', 'behavior', NULL),
('Week Warrior', '7 day streak', '🔥', 'streak', 7),
('Month Master', '30 day streak', '💪', 'streak', 30),
('Century Club', '100 day streak', '🏅', 'streak', 100);

-- Enable RLS on all new tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Messages policies (only mutual followers can message)
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages to mutual followers"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.follows f1
    JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = auth.uid() AND f1.following_id = receiver_id
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Follow requests policies
CREATE POLICY "Users can view their follow requests"
ON public.follow_requests FOR SELECT
USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create follow requests"
ON public.follow_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update requests targeting them"
ON public.follow_requests FOR UPDATE
USING (target_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
ON public.follow_requests FOR DELETE
USING (requester_id = auth.uid());

-- Badges policies
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

-- User badges policies
CREATE POLICY "Anyone can view user badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "System can manage user badges"
ON public.user_badges FOR ALL
USING (auth.uid() IS NOT NULL);

-- User streaks policies
CREATE POLICY "Users can view all streaks"
ON public.user_streaks FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own streak"
ON public.user_streaks FOR ALL
USING (user_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to check if users are mutual followers
CREATE OR REPLACE FUNCTION public.are_mutual_followers(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows f1
    JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  )
$$;

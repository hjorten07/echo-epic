-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('artist', 'album', 'song')),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_image TEXT,
  item_subtitle TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is following someone
CREATE OR REPLACE FUNCTION public.is_following(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = auth.uid()
    AND following_id = target_user_id
  )
$$;

-- Helper function: Can view profile
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    target_user_id = auth.uid() -- Own profile
    OR NOT (SELECT is_private FROM public.profiles WHERE id = target_user_id) -- Public profile
    OR public.is_following(target_user_id) -- Following them
$$;

-- Profiles policies
CREATE POLICY "Anyone can view public profiles"
ON public.profiles FOR SELECT
USING (
  NOT is_private 
  OR id = auth.uid() 
  OR public.is_following(id)
);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Ratings policies
CREATE POLICY "Anyone can view ratings from public profiles"
ON public.ratings FOR SELECT
USING (
  public.can_view_profile(user_id)
);

CREATE POLICY "Users can create their own ratings"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings"
ON public.ratings FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Follows policies
CREATE POLICY "Users can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follows"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their follows"
ON public.follows FOR DELETE
TO authenticated
USING (follower_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_ratings_item ON public.ratings(item_type, item_id);
CREATE INDEX idx_ratings_user ON public.ratings(user_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Create aggregated ratings view for top 100
CREATE OR REPLACE VIEW public.item_ratings AS
SELECT 
  item_type,
  item_id,
  item_name,
  item_image,
  item_subtitle,
  AVG(rating)::NUMERIC(3,2) as avg_rating,
  COUNT(*) as total_ratings
FROM public.ratings r
JOIN public.profiles p ON r.user_id = p.id
WHERE p.is_private = false
GROUP BY item_type, item_id, item_name, item_image, item_subtitle;
-- Create wall_posts table for public social wall
CREATE TABLE public.wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create hot_takes table for hot takes feature
CREATE TABLE public.hot_takes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create votes table for upvotes/downvotes on wall posts and hot takes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('wall_post', 'hot_take')),
  target_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Create hot_take_replies table for discussion threads
CREATE TABLE public.hot_take_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hot_take_id uuid NOT NULL REFERENCES public.hot_takes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.hot_take_replies(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_take_replies ENABLE ROW LEVEL SECURITY;

-- Wall posts policies
CREATE POLICY "Anyone can view wall posts" ON public.wall_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create wall posts" ON public.wall_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wall posts" ON public.wall_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wall posts" ON public.wall_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Hot takes policies
CREATE POLICY "Anyone can view hot takes" ON public.hot_takes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hot takes" ON public.hot_takes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hot takes" ON public.hot_takes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hot takes" ON public.hot_takes
  FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);

-- Hot take replies policies
CREATE POLICY "Anyone can view hot take replies" ON public.hot_take_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON public.hot_take_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" ON public.hot_take_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON public.hot_take_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to calculate taste similarity between users
CREATE OR REPLACE FUNCTION public.get_taste_similarity(user1_id uuid, user2_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  common_items integer;
  total_items integer;
  rating_diff_sum numeric;
  similarity numeric;
BEGIN
  -- Get count of items both users have rated
  SELECT COUNT(*), COALESCE(SUM(ABS(r1.rating - r2.rating)), 0)
  INTO common_items, rating_diff_sum
  FROM ratings r1
  JOIN ratings r2 ON r1.item_id = r2.item_id AND r1.item_type = r2.item_type
  WHERE r1.user_id = user1_id AND r2.user_id = user2_id;
  
  IF common_items < 3 THEN
    RETURN NULL; -- Not enough data
  END IF;
  
  -- Calculate similarity: 100% if ratings are identical, decreases with differences
  -- Max difference per item is 9 (rating 1 vs 10)
  similarity := GREATEST(0, 100 - (rating_diff_sum / common_items * 11.11));
  
  RETURN ROUND(similarity, 0);
END;
$$;

-- Create function to get users with similar taste
CREATE OR REPLACE FUNCTION public.get_similar_users(target_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(user_id uuid, username text, avatar_url text, similarity numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    public.get_taste_similarity(target_user_id, p.id) as similarity
  FROM profiles p
  WHERE p.id != target_user_id
    AND (NOT p.is_private OR public.is_following(p.id))
  ORDER BY similarity DESC NULLS LAST
  LIMIT limit_count;
END;
$$;
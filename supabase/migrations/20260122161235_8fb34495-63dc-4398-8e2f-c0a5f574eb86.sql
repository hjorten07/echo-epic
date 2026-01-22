-- Fix 1: user_badges - Remove overly permissive policy and add proper restrictions
DROP POLICY IF EXISTS "System can manage user badges" ON public.user_badges;

-- Users can only update their OWN badges (display_order and displayed fields only)
CREATE POLICY "Users can update their own badge display"
ON public.user_badges FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- No public INSERT or DELETE - badge awarding must happen via service role/edge functions

-- Fix 2: profiles - Require authentication to view profiles
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    NOT is_private 
    OR id = auth.uid() 
    OR is_following(id)
  )
);

-- Fix 3: user_streaks - Restrict visibility to authenticated users only
DROP POLICY IF EXISTS "Users can view all streaks" ON public.user_streaks;

CREATE POLICY "Authenticated users can view streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() IS NOT NULL);
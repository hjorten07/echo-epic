-- Fix comments table: require authentication to view comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix banned_words table: restrict SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view banned words" ON public.banned_words;
CREATE POLICY "Admins can view banned words" 
ON public.banned_words 
FOR SELECT 
USING (is_admin());
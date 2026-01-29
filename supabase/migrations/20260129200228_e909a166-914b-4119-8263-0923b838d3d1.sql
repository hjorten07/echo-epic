-- Create wall_post_replies table for discussion on wall posts
CREATE TABLE public.wall_post_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_post_id UUID NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wall_post_replies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view wall post replies" 
ON public.wall_post_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create replies" 
ON public.wall_post_replies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" 
ON public.wall_post_replies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX idx_wall_post_replies_post_id ON public.wall_post_replies(wall_post_id);
CREATE INDEX idx_wall_post_replies_user_id ON public.wall_post_replies(user_id);

-- Enable realtime for wall post replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_post_replies;
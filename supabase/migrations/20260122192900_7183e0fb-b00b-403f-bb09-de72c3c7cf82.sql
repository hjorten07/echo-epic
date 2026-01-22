-- Create suggestions table for user feedback
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
ON public.suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.suggestions
FOR SELECT
USING (is_admin());

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
ON public.suggestions
FOR UPDATE
USING (is_admin());
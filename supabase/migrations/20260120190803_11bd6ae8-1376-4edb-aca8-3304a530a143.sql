-- Fix overly permissive RLS policies

-- Drop the permissive policies
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert site stats" ON public.site_stats;
DROP POLICY IF EXISTS "System can update site stats" ON public.site_stats;

-- Create proper policies for notifications (system creates via triggers/edge functions with service role)
CREATE POLICY "Authenticated users can create notifications for themselves" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create proper policies for site_stats (only admin can modify)
CREATE POLICY "Admin can insert site stats" 
ON public.site_stats 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update site stats" 
ON public.site_stats 
FOR UPDATE 
USING (public.is_admin());

-- Add policy for admins to view all reports
CREATE POLICY "Admins can view all reports" 
ON public.reports 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
USING (public.is_admin());

-- Add admin email column to profiles or create admin check based on email
-- For now we check against the auth.users email in the is_admin function
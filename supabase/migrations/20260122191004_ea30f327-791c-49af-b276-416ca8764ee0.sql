-- Allow deleting custom artists (admin only)
CREATE POLICY "Admins can delete custom artists" 
ON public.custom_artists 
FOR DELETE 
USING (is_admin());
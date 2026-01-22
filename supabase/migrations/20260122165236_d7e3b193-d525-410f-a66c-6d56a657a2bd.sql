-- Fix the admin policy vulnerability: use is_admin() instead of username check
DROP POLICY IF EXISTS "Admins can create custom artists" ON public.custom_artists;
DROP POLICY IF EXISTS "Admins can update custom artists" ON public.custom_artists;

CREATE POLICY "Admins can create custom artists"
ON public.custom_artists FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update custom artists"
ON public.custom_artists FOR UPDATE
USING (is_admin());

-- Create storage bucket for artist images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-images', 'artist-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for artist images
CREATE POLICY "Anyone can view artist images"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-images');

CREATE POLICY "Admins can upload artist images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artist-images' AND is_admin());

CREATE POLICY "Admins can update artist images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'artist-images' AND is_admin());

CREATE POLICY "Admins can delete artist images"
ON storage.objects FOR DELETE
USING (bucket_id = 'artist-images' AND is_admin());
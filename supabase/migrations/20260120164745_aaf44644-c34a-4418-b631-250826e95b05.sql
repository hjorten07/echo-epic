-- Drop the security definer view and recreate with security_invoker
DROP VIEW IF EXISTS public.item_ratings;

CREATE OR REPLACE VIEW public.item_ratings
WITH (security_invoker = on) AS
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
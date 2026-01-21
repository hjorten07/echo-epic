-- Drop and recreate the item_ratings view with proper numeric precision
DROP VIEW IF EXISTS public.item_ratings;

CREATE VIEW public.item_ratings AS
SELECT 
  item_type,
  item_id,
  item_name,
  item_image,
  item_subtitle,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  COUNT(*)::bigint as total_ratings
FROM public.ratings
GROUP BY item_type, item_id, item_name, item_image, item_subtitle;
-- Add Welcome badge for new users
INSERT INTO public.badges (name, description, icon, category, threshold)
VALUES ('Welcome', 'Thank you for joining Relics!', '👋', 'welcome', NULL)
ON CONFLICT DO NOTHING;

-- Create a function to award welcome badge on signup
CREATE OR REPLACE FUNCTION public.award_welcome_badge()
RETURNS TRIGGER AS $$
DECLARE
  welcome_badge_id uuid;
BEGIN
  -- Get the welcome badge ID
  SELECT id INTO welcome_badge_id FROM public.badges WHERE name = 'Welcome' LIMIT 1;
  
  IF welcome_badge_id IS NOT NULL THEN
    -- Award the welcome badge
    INSERT INTO public.user_badges (user_id, badge_id, displayed)
    VALUES (NEW.id, welcome_badge_id, true)
    ON CONFLICT DO NOTHING;
    
    -- Create a notification for the new user
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.id, 'badge', 'Welcome to Relics!', 'You earned your first badge! Check out your profile to see it.')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table (fires when a new profile is created)
DROP TRIGGER IF EXISTS award_welcome_badge_trigger ON public.profiles;
CREATE TRIGGER award_welcome_badge_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_welcome_badge();

-- Award welcome badge to existing users who don't have it
INSERT INTO public.user_badges (user_id, badge_id, displayed)
SELECT p.id, b.id, true
FROM public.profiles p
CROSS JOIN public.badges b
WHERE b.name = 'Welcome'
AND NOT EXISTS (
  SELECT 1 FROM public.user_badges ub 
  WHERE ub.user_id = p.id AND ub.badge_id = b.id
);
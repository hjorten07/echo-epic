-- Add game win badges (unique names)
INSERT INTO public.badges (name, description, icon, category, threshold) VALUES
('First Victory', 'Won your first Song Rush game', '🏆', 'game', 1),
('Rising Star', 'Won 5 Song Rush games', '⭐', 'game', 5),
('Music Master', 'Won 10 Song Rush games', '🎵', 'game', 10),
('Playlist Pro', 'Won 25 Song Rush games', '🎧', 'game', 25),
('Song Legend', 'Won 50 Song Rush games', '👑', 'game', 50),
('Hall of Fame', 'Won 75 Song Rush games', '🏛️', 'game', 75),
('Ultimate Champion', 'Won 100 Song Rush games', '💎', 'game', 100)
ON CONFLICT (name) DO NOTHING;

-- Add rating milestone badges (unique names, avoid duplicates)
INSERT INTO public.badges (name, description, icon, category, threshold) VALUES
('First Rating', 'Rated your first item', '🎤', 'rating', 1),
('Getting Started', 'Rated 10 items', '🎸', 'rating', 10),
('Music Enthusiast', 'Rated 25 items', '🎹', 'rating', 25),
('Dedicated Listener', 'Rated 50 items', '🎺', 'rating', 50),
('Audiophile', 'Rated 75 items', '🎻', 'rating', 75),
('Century Club', 'Rated 100 items', '💯', 'rating', 100),
('Prolific Rater', 'Rated 125 items', '📀', 'rating', 125),
('Music Historian', 'Rated 150 items', '📚', 'rating', 150),
('Vinyl Collector', 'Rated 200 items', '💿', 'rating', 200),
('Quarter Millennium', 'Rated 250 items', '🎼', 'rating', 250),
('Rating Machine', 'Rated 300 items', '🤖', 'rating', 300),
('Half Thousand', 'Rated 500 items', '🔥', 'rating', 500),
('Three Quarters', 'Rated 750 items', '⚡', 'rating', 750),
('Legendary Rater', 'Rated 1000 items', '🌟', 'rating', 1000)
ON CONFLICT (name) DO NOTHING;

-- Add column for tracking total game wins
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS game_wins integer DEFAULT 0;
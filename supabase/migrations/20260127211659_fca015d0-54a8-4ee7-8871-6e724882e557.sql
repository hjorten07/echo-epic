-- Create Song Rush game tables

-- Game Lobbies
CREATE TABLE public.game_lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'submitting', 'voting', 'results', 'finished')),
  is_private boolean NOT NULL DEFAULT false,
  theme text,
  current_round integer NOT NULL DEFAULT 1,
  max_rounds integer NOT NULL DEFAULT 3,
  round_end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Game Players
CREATE TABLE public.game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES public.game_lobbies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  is_ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lobby_id, user_id)
);

-- Game Submissions
CREATE TABLE public.game_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES public.game_lobbies(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  round integer NOT NULL,
  song_id text NOT NULL,
  song_name text NOT NULL,
  song_artist text,
  song_image text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lobby_id, player_id, round)
);

-- Game Votes
CREATE TABLE public.game_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES public.game_lobbies(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.game_submissions(id) ON DELETE CASCADE,
  round integer NOT NULL,
  points integer NOT NULL CHECK (points >= 1 AND points <= 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(voter_id, submission_id)
);

-- Game Chat
CREATE TABLE public.game_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES public.game_lobbies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_lobbies
CREATE POLICY "Anyone can view lobbies" ON public.game_lobbies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create lobbies" ON public.game_lobbies FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their lobbies" ON public.game_lobbies FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their lobbies" ON public.game_lobbies FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for game_players
CREATE POLICY "Anyone can view players" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join" ON public.game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can leave" ON public.game_players FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Players can update themselves" ON public.game_players FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_submissions
CREATE POLICY "Anyone can view submissions" ON public.game_submissions FOR SELECT USING (true);
CREATE POLICY "Players can submit" ON public.game_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_players WHERE id = player_id AND user_id = auth.uid())
);

-- RLS Policies for game_votes
CREATE POLICY "Anyone can view votes" ON public.game_votes FOR SELECT USING (true);
CREATE POLICY "Players can vote" ON public.game_votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_players WHERE id = voter_id AND user_id = auth.uid())
);

-- RLS Policies for game_chat
CREATE POLICY "Anyone can view chat" ON public.game_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated users can chat" ON public.game_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_chat;
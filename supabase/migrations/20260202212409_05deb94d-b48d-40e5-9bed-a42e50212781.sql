-- Create a function to set imposter that bypasses RLS
-- This function can only be called by the lobby host
CREATE OR REPLACE FUNCTION public.set_game_imposter(
  p_lobby_id uuid,
  p_imposter_player_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id uuid;
  v_caller_id uuid;
BEGIN
  -- Get the caller's ID
  v_caller_id := auth.uid();
  
  -- Get the host of this lobby
  SELECT host_id INTO v_host_id
  FROM public.game_lobbies
  WHERE id = p_lobby_id;
  
  -- Only the host can set the imposter
  IF v_caller_id IS NULL OR v_caller_id != v_host_id THEN
    RAISE EXCEPTION 'Only the host can set the imposter';
  END IF;
  
  -- Reset all players in this lobby to not be imposter
  UPDATE public.game_players
  SET is_imposter = false
  WHERE lobby_id = p_lobby_id;
  
  -- Set the specified player as imposter
  UPDATE public.game_players
  SET is_imposter = true
  WHERE id = p_imposter_player_id
  AND lobby_id = p_lobby_id;
  
  RETURN true;
END;
$$;
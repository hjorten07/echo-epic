-- Create server-side message validation function
-- This allows the chat filter to work without exposing banned words to clients
CREATE OR REPLACE FUNCTION public.validate_message(message_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  banned_word TEXT;
BEGIN
  -- Check against database banned words
  FOR banned_word IN SELECT word FROM public.banned_words LOOP
    IF LOWER(message_text) LIKE '%' || LOWER(banned_word) || '%' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;
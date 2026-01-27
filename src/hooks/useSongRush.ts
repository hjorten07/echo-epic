import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GameLobby {
  id: string;
  code: string;
  host_id: string;
  status: "waiting" | "theme_vote" | "submitting" | "voting" | "results" | "finished";
  is_private: boolean;
  theme: string | null;
  current_round: number;
  max_rounds: number;
  round_end_at: string | null;
  created_at: string;
}

export interface GamePlayer {
  id: string;
  lobby_id: string;
  user_id: string;
  score: number;
  wins: number;
  is_ready: boolean;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface GameSubmission {
  id: string;
  lobby_id: string;
  player_id: string;
  round: number;
  song_id: string;
  song_name: string;
  song_artist: string | null;
  song_image: string | null;
  submitted_at: string;
}

export interface GameVote {
  id: string;
  lobby_id: string;
  voter_id: string;
  submission_id: string;
  round: number;
  points: number;
}

export interface ChatMessage {
  id: string;
  lobby_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const THEMES = [
  "Summer Vibes",
  "Heartbreak",
  "Party Anthems",
  "Chill & Relax",
  "Throwback Classics",
  "Road Trip",
  "Workout Energy",
  "Late Night",
  "Love Songs",
  "Feel Good",
  "Rainy Day",
  "Dance Floor",
];

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to access new tables that aren't in generated types yet
const gameDb = {
  lobbies: () => supabase.from("game_lobbies" as any),
  players: () => supabase.from("game_players" as any),
  submissions: () => supabase.from("game_submissions" as any),
  votes: () => supabase.from("game_votes" as any),
  chat: () => supabase.from("game_chat" as any),
};

export const useSongRush = () => {
  const { user, profile } = useAuth();
  const [lobby, setLobby] = useState<GameLobby | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null);
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [votes, setVotes] = useState<GameVote[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ player: GamePlayer; submission: GameSubmission } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (lobby?.round_end_at) {
      const updateTimer = () => {
        const end = new Date(lobby.round_end_at!).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0 && timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [lobby?.round_end_at]);

  const subscribeToLobby = useCallback((lobbyId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`game_lobby_${lobbyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_lobbies", filter: `id=eq.${lobbyId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setLobby(payload.new as GameLobby);
          } else if (payload.eventType === "DELETE") {
            setLobby(null);
            toast.info("The lobby has been closed");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          // Refetch players with profiles
          const { data } = await gameDb.players()
            .select("*, profile:profiles(username, avatar_url)")
            .eq("lobby_id", lobbyId);
          if (data) {
            const typedData = data as any[];
            setPlayers(typedData.map(p => ({ ...p, profile: p.profile })));
            const me = typedData.find(p => p.user_id === user?.id);
            if (me) setMyPlayer({ ...me, profile: me.profile });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_submissions", filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          const { data } = await gameDb.submissions()
            .select("*")
            .eq("lobby_id", lobbyId);
          if (data) setSubmissions(data as unknown as GameSubmission[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_votes", filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          const { data } = await gameDb.votes()
            .select("*")
            .eq("lobby_id", lobbyId);
          if (data) setVotes(data as unknown as GameVote[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_chat", filter: `lobby_id=eq.${lobbyId}` },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", newMessage.user_id)
            .single();
          setChat(prev => [...prev, { ...newMessage, profile: profileData || undefined }]);
        }
      )
      .subscribe();
  }, [user?.id]);

  const createLobby = useCallback(async (isPrivate: boolean) => {
    if (!user) {
      toast.error("You must be logged in to create a game");
      return null;
    }

    setIsLoading(true);
    const code = generateCode();

    const { data: lobbyData, error: lobbyError } = await gameDb.lobbies()
      .insert({
        code,
        host_id: user.id,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (lobbyError) {
      toast.error("Failed to create lobby");
      setIsLoading(false);
      return null;
    }

    // Join as player
    const { data: playerData, error: playerError } = await gameDb.players()
      .insert({
        lobby_id: (lobbyData as any).id,
        user_id: user.id,
      })
      .select("*, profile:profiles(username, avatar_url)")
      .single();

    if (playerError) {
      toast.error("Failed to join lobby");
      setIsLoading(false);
      return null;
    }

    const typedLobby = lobbyData as unknown as GameLobby;
    const typedPlayer = playerData as any;

    setLobby(typedLobby);
    setMyPlayer({ ...typedPlayer, profile: typedPlayer.profile });
    setPlayers([{ ...typedPlayer, profile: typedPlayer.profile }]);
    subscribeToLobby(typedLobby.id);
    setIsLoading(false);

    return typedLobby;
  }, [user, subscribeToLobby]);

  const joinLobby = useCallback(async (code: string) => {
    if (!user) {
      toast.error("You must be logged in to join a game");
      return false;
    }

    setIsLoading(true);

    const { data: lobbyData, error: lobbyError } = await gameDb.lobbies()
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (lobbyError || !lobbyData) {
      toast.error("Lobby not found or already started");
      setIsLoading(false);
      return false;
    }

    const typedLobbyData = lobbyData as any;

    // Check player count
    const { count } = await gameDb.players()
      .select("*", { count: "exact", head: true })
      .eq("lobby_id", typedLobbyData.id);

    if (count && count >= 6) {
      toast.error("Lobby is full (max 6 players)");
      setIsLoading(false);
      return false;
    }

    // Join as player
    const { data: playerData, error: playerError } = await gameDb.players()
      .insert({
        lobby_id: typedLobbyData.id,
        user_id: user.id,
      })
      .select("*, profile:profiles(username, avatar_url)")
      .single();

    if (playerError) {
      if (playerError.code === "23505") {
        toast.error("You're already in this lobby");
      } else {
        toast.error("Failed to join lobby");
      }
      setIsLoading(false);
      return false;
    }

    // Fetch all players
    const { data: allPlayers } = await gameDb.players()
      .select("*, profile:profiles(username, avatar_url)")
      .eq("lobby_id", typedLobbyData.id);

    const typedLobby = lobbyData as unknown as GameLobby;
    const typedPlayer = playerData as any;
    const typedAllPlayers = (allPlayers || []) as any[];

    setLobby(typedLobby);
    setMyPlayer({ ...typedPlayer, profile: typedPlayer.profile });
    setPlayers(typedAllPlayers.map(p => ({ ...p, profile: p.profile })));
    subscribeToLobby(typedLobby.id);
    setIsLoading(false);

    return true;
  }, [user, subscribeToLobby]);

  const findPublicLobby = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    setIsLoading(true);

    // Find a public lobby with space
    const { data: lobbies } = await gameDb.lobbies()
      .select("*")
      .eq("is_private", false)
      .eq("status", "waiting")
      .order("created_at", { ascending: false });

    if (lobbies && lobbies.length > 0) {
      // Check each lobby for space
      for (const l of lobbies as unknown as GameLobby[]) {
        const { count } = await gameDb.players()
          .select("*", { count: "exact", head: true })
          .eq("lobby_id", l.id);

        if (!count || count < 6) {
          setIsLoading(false);
          return joinLobby(l.code);
        }
      }
    }

    // No lobby found, create one
    const newLobby = await createLobby(false);
    setIsLoading(false);
    return !!newLobby;
  }, [user, joinLobby, createLobby]);

  const leaveLobby = useCallback(async () => {
    if (!lobby || !myPlayer) return;

    await gameDb.players().delete().eq("id", myPlayer.id);

    // If host leaves, delete the lobby
    if (lobby.host_id === user?.id) {
      await gameDb.lobbies().delete().eq("id", lobby.id);
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setLobby(null);
    setPlayers([]);
    setMyPlayer(null);
    setSubmissions([]);
    setVotes([]);
    setChat([]);
  }, [lobby, myPlayer, user?.id]);

  const startGame = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    if (players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }

    // Select random theme
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await gameDb.lobbies()
      .update({
        status: "submitting",
        theme,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id, players.length]);

  const submitSong = useCallback(async (song: { id: string; name: string; artist?: string; image?: string }) => {
    if (!lobby || !myPlayer) return false;

    const { error } = await gameDb.submissions().insert({
      lobby_id: lobby.id,
      player_id: myPlayer.id,
      round: lobby.current_round,
      song_id: song.id,
      song_name: song.name,
      song_artist: song.artist || null,
      song_image: song.image || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You already submitted for this round");
      } else {
        toast.error("Failed to submit song");
      }
      return false;
    }

    toast.success("Song submitted!");
    return true;
  }, [lobby, myPlayer]);

  const vote = useCallback(async (submissionId: string, points: number) => {
    if (!lobby || !myPlayer) return false;

    // Can't vote for own submission
    const submission = submissions.find(s => s.id === submissionId);
    if (submission?.player_id === myPlayer.id) {
      toast.error("You can't vote for your own song");
      return false;
    }

    const { error } = await gameDb.votes().insert({
      lobby_id: lobby.id,
      voter_id: myPlayer.id,
      submission_id: submissionId,
      round: lobby.current_round,
      points,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You already voted for this song");
      } else {
        toast.error("Failed to vote");
      }
      return false;
    }

    return true;
  }, [lobby, myPlayer, submissions]);

  const sendChat = useCallback(async (message: string) => {
    if (!lobby || !user) return;

    await gameDb.chat().insert({
      lobby_id: lobby.id,
      user_id: user.id,
      message,
    });
  }, [lobby, user]);

  const advanceToVoting = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    const roundEnd = new Date(Date.now() + 60 * 1000).toISOString();

    await gameDb.lobbies()
      .update({
        status: "voting",
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id]);

  const calculateResults = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    // Calculate scores
    const roundSubmissions = submissions.filter(s => s.round === lobby.current_round);
    const roundVotes = votes.filter(v => v.round === lobby.current_round);

    let maxPoints = 0;
    let winnerId: string | null = null;
    let winningSubmission: GameSubmission | null = null;

    for (const sub of roundSubmissions) {
      const points = roundVotes
        .filter(v => v.submission_id === sub.id)
        .reduce((sum, v) => sum + v.points, 0);

      if (points > maxPoints || (points === maxPoints && (!winningSubmission || sub.submitted_at < winningSubmission.submitted_at))) {
        maxPoints = points;
        winnerId = sub.player_id;
        winningSubmission = sub;
      }
    }

    // Update winner's score
    if (winnerId) {
      const winner = players.find(p => p.id === winnerId);
      if (winner) {
        await gameDb.players()
          .update({ 
            score: winner.score + maxPoints,
            wins: winner.wins + 1 
          })
          .eq("id", winnerId);

        setRoundWinner({ player: winner, submission: winningSubmission! });

        // Check if someone reached 2 wins
        if (winner.wins + 1 >= 2) {
          // Game over
          await gameDb.lobbies()
            .update({ status: "finished" })
            .eq("id", lobby.id);

          // Update profile game wins
          await supabase
            .from("profiles")
            .update({ game_wins: ((profile as any)?.game_wins || 0) + 1 })
            .eq("id", winner.user_id);

          toast.success(`${winner.profile?.username || "Player"} wins the game!`);
          return;
        }
      }
    }

    // Show results
    await gameDb.lobbies()
      .update({
        status: "results",
        round_end_at: new Date(Date.now() + 10 * 1000).toISOString(),
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id, submissions, votes, players, profile]);

  const startNextRound = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await gameDb.lobbies()
      .update({
        status: "submitting",
        theme,
        current_round: lobby.current_round + 1,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);

    setRoundWinner(null);
  }, [lobby, user?.id]);

  return {
    lobby,
    players,
    myPlayer,
    submissions,
    votes,
    chat,
    timeLeft,
    isLoading,
    roundWinner,
    createLobby,
    joinLobby,
    findPublicLobby,
    leaveLobby,
    startGame,
    submitSong,
    vote,
    sendChat,
    advanceToVoting,
    calculateResults,
    startNextRound,
    isHost: lobby?.host_id === user?.id,
  };
};

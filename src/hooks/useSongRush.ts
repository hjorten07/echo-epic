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

const FALLBACK_THEMES = [
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

export const useSongRush = () => {
  const { user, profile } = useAuth();
  const [lobby, setLobby] = useState<GameLobby | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null);
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [votes, setVotes] = useState<GameVote[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [publicCountdown, setPublicCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ player: GamePlayer; submission: GameSubmission } | null>(null);
  const [themes, setThemes] = useState<string[]>(FALLBACK_THEMES);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch themes from database
  useEffect(() => {
    const fetchThemes = async () => {
      const { data } = await supabase
        .from("game_themes")
        .select("name")
        .eq("is_active", true);
      if (data && data.length > 0) {
        setThemes(data.map(t => t.name));
      }
    };
    fetchThemes();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Timer logic for game phases with auto-transition
  useEffect(() => {
    if (lobby?.round_end_at) {
      const updateTimer = () => {
        const end = new Date(lobby.round_end_at!).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(remaining);

        // Auto-transition when timer hits 0 in public lobbies
        if (remaining === 0 && timerRef.current) {
          clearInterval(timerRef.current);
          
          // For public lobbies, auto-transition (any player can trigger)
          if (!lobby.is_private) {
            if (lobby.status === "submitting") {
              // Auto-advance to voting
              autoAdvanceToVoting();
            } else if (lobby.status === "voting") {
              // Auto-calculate results
              autoCalculateResults();
            }
          }
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [lobby?.round_end_at, lobby?.is_private, lobby?.status]);

  // Public lobby countdown logic
  useEffect(() => {
    if (!lobby || lobby.is_private || lobby.status !== "waiting") {
      setPublicCountdown(0);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    // Start countdown when 2+ players join public lobby
    if (players.length >= 2) {
      // Calculate countdown from lobby creation (2 minutes = 120 seconds)
      const lobbyCreatedAt = new Date(lobby.created_at).getTime();
      const countdownEnd = lobbyCreatedAt + 120 * 1000;

      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((countdownEnd - now) / 1000));
        setPublicCountdown(remaining);

        // Auto-start when countdown reaches 0
        if (remaining === 0 && lobby.status === "waiting") {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // Only host triggers start, but for public lobbies, check if we need to auto-start
          autoStartPublicGame();
        }
      };

      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    } else {
      setPublicCountdown(0);
    }
  }, [lobby?.id, lobby?.is_private, lobby?.status, lobby?.created_at, players.length]);

  const autoStartPublicGame = useCallback(async () => {
    if (!lobby || lobby.is_private || lobby.status !== "waiting") return;
    if (players.length < 2) return;

    // Only the host should trigger the start
    if (lobby.host_id !== user?.id) return;

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "submitting",
        theme,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, players.length, themes, user?.id]);

  const fetchPlayersWithProfiles = async (lobbyId: string) => {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("lobby_id", lobbyId);
    
    if (data) {
      const playerIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", playerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return data.map(p => ({
        ...p,
        profile: profileMap.get(p.user_id) || undefined,
      })) as GamePlayer[];
    }
    return [];
  };

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
          const typedData = await fetchPlayersWithProfiles(lobbyId);
          setPlayers(typedData);
          const me = typedData.find(p => p.user_id === user?.id);
          if (me) setMyPlayer(me);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_submissions", filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          const { data } = await supabase
            .from("game_submissions")
            .select("*")
            .eq("lobby_id", lobbyId);
          if (data) setSubmissions(data as GameSubmission[]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_votes", filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          const { data } = await supabase
            .from("game_votes")
            .select("*")
            .eq("lobby_id", lobbyId);
          if (data) setVotes(data as GameVote[]);
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

    const { data: lobbyData, error: lobbyError } = await supabase
      .from("game_lobbies")
      .insert({
        code,
        host_id: user.id,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (lobbyError) {
      console.error("Lobby creation error:", lobbyError);
      toast.error("Failed to create lobby");
      setIsLoading(false);
      return null;
    }

    // Join as player
    const { data: playerData, error: playerError } = await supabase
      .from("game_players")
      .insert({
        lobby_id: lobbyData.id,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (playerError) {
      console.error("Player join error:", playerError);
      toast.error("Failed to join lobby");
      setIsLoading(false);
      return null;
    }

    // Fetch profile for the player
    const { data: profileInfo } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    const typedLobby = lobbyData as unknown as GameLobby;
    const typedPlayer: GamePlayer = {
      ...playerData,
      profile: profileInfo || undefined,
    };

    setLobby(typedLobby);
    setMyPlayer(typedPlayer);
    setPlayers([typedPlayer]);
    subscribeToLobby(typedLobby.id);
    setIsLoading(false);

    return typedLobby;
  }, [user, subscribeToLobby]);

  // Create a new public lobby (Quick Play always creates fresh public lobby)
  const createPublicLobby = useCallback(async () => {
    return createLobby(false);
  }, [createLobby]);

  const joinLobby = useCallback(async (code: string) => {
    if (!user) {
      toast.error("You must be logged in to join a game");
      return false;
    }

    setIsLoading(true);

    const { data: lobbyData, error: lobbyError } = await supabase
      .from("game_lobbies")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "waiting")
      .maybeSingle();

    if (lobbyError || !lobbyData) {
      toast.error("Lobby not found or already started");
      setIsLoading(false);
      return false;
    }

    // Check player count
    const { count } = await supabase
      .from("game_players")
      .select("*", { count: "exact", head: true })
      .eq("lobby_id", lobbyData.id);

    if (count && count >= 6) {
      toast.error("Lobby is full (max 6 players)");
      setIsLoading(false);
      return false;
    }

    // Join as player
    const { data: playerData, error: playerError } = await supabase
      .from("game_players")
      .insert({
        lobby_id: lobbyData.id,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (playerError) {
      if (playerError.code === "23505") {
        toast.error("You're already in this lobby");
      } else {
        console.error("Join error:", playerError);
        toast.error("Failed to join lobby");
      }
      setIsLoading(false);
      return false;
    }

    const typedAllPlayers = await fetchPlayersWithProfiles(lobbyData.id);

    const typedLobby = lobbyData as unknown as GameLobby;
    const typedPlayer = typedAllPlayers.find(p => p.user_id === user.id) || {
      ...playerData,
      profile: undefined,
    } as GamePlayer;

    setLobby(typedLobby);
    setMyPlayer(typedPlayer);
    setPlayers(typedAllPlayers);
    subscribeToLobby(typedLobby.id);
    setIsLoading(false);

    return true;
  }, [user, subscribeToLobby]);

  const leaveLobby = useCallback(async () => {
    if (!lobby || !myPlayer) return;

    await supabase.from("game_players").delete().eq("id", myPlayer.id);

    // If host leaves, delete the lobby
    if (lobby.host_id === user?.id) {
      await supabase.from("game_lobbies").delete().eq("id", lobby.id);
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
    setPublicCountdown(0);
  }, [lobby, myPlayer, user?.id]);

  const startGame = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    if (players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "submitting",
        theme,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id, players.length, themes]);

  const submitSong = useCallback(async (song: { id: string; name: string; artist?: string; image?: string }) => {
    if (!lobby || !myPlayer) return false;

    // Check if submission window has closed
    if (lobby.round_end_at) {
      const endTime = new Date(lobby.round_end_at).getTime();
      if (Date.now() > endTime) {
        toast.error("Submission time has ended");
        return false;
      }
    }

    const { error } = await supabase.from("game_submissions").insert({
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

    const { error } = await supabase.from("game_votes").insert({
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

    await supabase.from("game_chat").insert({
      lobby_id: lobby.id,
      user_id: user.id,
      message,
    });
  }, [lobby, user]);

  const advanceToVoting = useCallback(async () => {
    if (!lobby) return;
    // For private lobbies, only host can advance
    if (lobby.is_private && lobby.host_id !== user?.id) return;

    const roundEnd = new Date(Date.now() + 60 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "voting",
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id]);

  // Auto-advance to voting for public lobbies when time runs out
  const autoAdvanceToVoting = useCallback(async () => {
    if (!lobby || lobby.is_private) return;
    // Only host triggers auto-advance to prevent duplicates
    if (lobby.host_id !== user?.id) return;

    const roundEnd = new Date(Date.now() + 60 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "voting",
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  }, [lobby, user?.id]);

  // Auto-calculate results for public lobbies when voting time runs out
  const autoCalculateResults = useCallback(async () => {
    if (!lobby || lobby.is_private) return;
    // Only host triggers to prevent duplicates
    if (lobby.host_id !== user?.id) return;
    
    // Call the same logic as calculateResults
    await calculateResultsInternal();
  }, [lobby, user?.id]);

  const calculateResultsInternal = useCallback(async () => {
    if (!lobby) return;

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

    // Update ALL players' scores based on their submissions
    for (const sub of roundSubmissions) {
      const playerPoints = roundVotes
        .filter(v => v.submission_id === sub.id)
        .reduce((sum, v) => sum + v.points, 0);
      
      const player = players.find(p => p.id === sub.player_id);
      if (player) {
        const isWinner = sub.player_id === winnerId;
        await supabase
          .from("game_players")
          .update({ 
            score: player.score + playerPoints,
            wins: isWinner ? player.wins + 1 : player.wins
          })
          .eq("id", sub.player_id);
      }
    }

    // Find winner player
    if (winnerId) {
      const winner = players.find(p => p.id === winnerId);
      if (winner && winningSubmission) {
        setRoundWinner({ player: winner, submission: winningSubmission });

        // Check if someone reached 2 wins
        if (winner.wins + 1 >= 2) {
          // Game over
          await supabase
            .from("game_lobbies")
            .update({ status: "finished" })
            .eq("id", lobby.id);

          // Update profile game wins
          await supabase
            .from("profiles")
            .update({ game_wins: ((profile as { game_wins?: number })?.game_wins || 0) + 1 })
            .eq("id", winner.user_id);

          // Award first win badge if applicable
          await awardFirstWinBadge(winner.user_id);

          toast.success(`${winner.profile?.username || "Player"} wins the game!`);
          return;
        }
      }
    }

    // Show results
    await supabase
      .from("game_lobbies")
      .update({
        status: "results",
        round_end_at: new Date(Date.now() + 10 * 1000).toISOString(),
      })
      .eq("id", lobby.id);
  }, [lobby, submissions, votes, players, profile]);

  const calculateResults = useCallback(async () => {
    if (!lobby) return;
    // For private lobbies, only host can trigger
    if (lobby.is_private && lobby.host_id !== user?.id) return;
    
    await calculateResultsInternal();
  }, [lobby, user?.id, calculateResultsInternal]);

  const awardFirstWinBadge = async (userId: string) => {
    // Check if user already has the first win badge
    const { data: existingBadges } = await supabase
      .from("user_badges")
      .select("*, badges!inner(name)")
      .eq("user_id", userId);

    const hasFirstWinBadge = existingBadges?.some((ub: any) => 
      ub.badges?.name === "First Victory"
    );

    if (!hasFirstWinBadge) {
      // Find the first win badge
      const { data: badge } = await supabase
        .from("badges")
        .select("id")
        .eq("name", "First Victory")
        .maybeSingle();

      if (badge) {
        await supabase.from("user_badges").insert({
          user_id: userId,
          badge_id: badge.id,
          displayed: true,
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "badge",
          title: "New Badge Earned!",
          message: "You earned the First Victory badge for your first Song Rush win!",
        });
      }
    }
  };

  const startNextRound = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "submitting",
        theme,
        current_round: lobby.current_round + 1,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);

    setRoundWinner(null);
  }, [lobby, user?.id, themes]);

  return {
    lobby,
    players,
    myPlayer,
    submissions,
    votes,
    chat,
    timeLeft,
    publicCountdown,
    isLoading,
    roundWinner,
    createLobby,
    createPublicLobby,
    joinLobby,
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

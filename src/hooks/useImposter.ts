import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ImposterLobby {
  id: string;
  code: string;
  host_id: string;
  status: "waiting" | "submitting" | "voting" | "results" | "finished";
  is_private: boolean;
  theme: string | null;
  current_round: number;
  max_rounds: number;
  round_end_at: string | null;
  created_at: string;
  game_type: string;
}

export interface ImposterPlayer {
  id: string;
  lobby_id: string;
  user_id: string;
  score: number;
  wins: number;
  is_ready: boolean;
  is_imposter: boolean;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface ImposterSubmission {
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

export interface ImposterVote {
  id: string;
  lobby_id: string;
  voter_id: string;
  voted_player_id: string;
  round: number;
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

export interface UseImposterReturn {
  lobby: ImposterLobby | null;
  players: ImposterPlayer[];
  myPlayer: ImposterPlayer | null;
  submissions: ImposterSubmission[];
  imposterVotes: ImposterVote[];
  chat: ChatMessage[];
  timeLeft: number;
  publicCountdown: number;
  isLoading: boolean;
  isHost: boolean;
  createLobby: (isPrivate: boolean) => Promise<ImposterLobby | null>;
  createPublicLobby: () => Promise<ImposterLobby | null>;
  joinLobby: (code: string) => Promise<boolean>;
  leaveLobby: () => Promise<void>;
  startGame: () => Promise<void>;
  submitSong: (song: { id: string; name: string; artist?: string; image?: string }) => Promise<boolean>;
  voteForImposter: (playerId: string) => Promise<boolean>;
  sendChat: (message: string) => Promise<void>;
  playAgain: () => Promise<void>;
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
];

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useImposter = (): UseImposterReturn => {
  const { user } = useAuth();
  const [lobby, setLobby] = useState<ImposterLobby | null>(null);
  const [players, setPlayers] = useState<ImposterPlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<ImposterPlayer | null>(null);
  const [submissions, setSubmissions] = useState<ImposterSubmission[]>([]);
  const [imposterVotes, setImposterVotes] = useState<ImposterVote[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [publicCountdown, setPublicCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [themes, setThemes] = useState<string[]>(FALLBACK_THEMES);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch themes
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
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
          if (!lobby.is_private && lobby.host_id === user?.id) {
            if (lobby.status === "submitting") {
              autoAdvanceToVoting();
            } else if (lobby.status === "voting") {
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
  }, [lobby?.round_end_at, lobby?.is_private, lobby?.status, lobby?.host_id, user?.id]);

  // Track when 3+ players were first reached
  const threePlayersReachedRef = useRef<number | null>(null);

  // Public lobby countdown - starts when 3 players are reached
  useEffect(() => {
    if (!lobby || lobby.is_private || lobby.status !== "waiting") {
      setPublicCountdown(0);
      threePlayersReachedRef.current = null;
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    if (players.length >= 3) {
      // Set the time when 3 players were first reached
      if (threePlayersReachedRef.current === null) {
        threePlayersReachedRef.current = Date.now();
      }
      
      const countdownEnd = threePlayersReachedRef.current + 120 * 1000;

      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((countdownEnd - now) / 1000));
        setPublicCountdown(remaining);

        if (remaining === 0 && lobby.status === "waiting") {
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (lobby.host_id === user?.id) {
            autoStartPublicGame();
          }
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
      threePlayersReachedRef.current = null;
    }
  }, [lobby?.id, lobby?.is_private, lobby?.status, lobby?.host_id, players.length, user?.id]);

  const autoStartPublicGame = async () => {
    if (!lobby || lobby.is_private || lobby.status !== "waiting") return;
    if (players.length < 3) return;
    await startGameInternal();
  };

  const autoAdvanceToVoting = async () => {
    if (!lobby) return;
    
    // Check if we need another round (max 2 rounds)
    if (lobby.current_round < lobby.max_rounds) {
      // Move to next round with new theme
      const newTheme = themes[Math.floor(Math.random() * themes.length)];
      const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();
      await supabase
        .from("game_lobbies")
        .update({ 
          current_round: lobby.current_round + 1,
          theme: newTheme,
          round_end_at: roundEnd 
        })
        .eq("id", lobby.id);
    } else {
      // All rounds complete, move to voting
      const roundEnd = new Date(Date.now() + 60 * 1000).toISOString();
      await supabase
        .from("game_lobbies")
        .update({ status: "voting", round_end_at: roundEnd })
        .eq("id", lobby.id);
    }
  };

  const autoCalculateResults = async () => {
    if (!lobby) return;
    await calculateResultsInternal();
  };

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
      })) as ImposterPlayer[];
    }
    return [];
  };

  const subscribeToLobby = useCallback((lobbyId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`imposter_lobby_${lobbyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_lobbies", filter: `id=eq.${lobbyId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setLobby(payload.new as ImposterLobby);
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
          if (data) setSubmissions(data as ImposterSubmission[]);
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
          if (data) {
            // Map game_votes to imposter votes format
            setImposterVotes(data.map(v => ({
              id: v.id,
              lobby_id: v.lobby_id,
              voter_id: v.voter_id,
              voted_player_id: v.submission_id, // Reusing submission_id for voted player
              round: v.round,
            })));
          }
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
        game_type: "imposter",
      })
      .select()
      .single();

    if (lobbyError) {
      toast.error("Failed to create lobby");
      setIsLoading(false);
      return null;
    }

    const { data: playerData, error: playerError } = await supabase
      .from("game_players")
      .insert({
        lobby_id: lobbyData.id,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (playerError) {
      toast.error("Failed to join lobby");
      setIsLoading(false);
      return null;
    }

    const { data: profileInfo } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    const typedLobby = lobbyData as unknown as ImposterLobby;
    const typedPlayer: ImposterPlayer = {
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

  const createPublicLobby = useCallback(async () => {
    // Try to find existing public imposter lobby first
    const { data: existingLobbies } = await supabase
      .from("game_lobbies")
      .select("*")
      .eq("is_private", false)
      .eq("game_type", "imposter")
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(5);

    if (existingLobbies && existingLobbies.length > 0) {
      // Try to join an existing one
      for (const existingLobby of existingLobbies) {
        const { count } = await supabase
          .from("game_players")
          .select("*", { count: "exact", head: true })
          .eq("lobby_id", existingLobby.id);
        
        if (count && count < 6) {
          const success = await joinLobby(existingLobby.code);
          if (success) return existingLobby as unknown as ImposterLobby;
        }
      }
    }

    // Create new public lobby
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
      .eq("game_type", "imposter")
      .maybeSingle();

    if (lobbyError || !lobbyData) {
      toast.error("Imposter lobby not found or already started");
      setIsLoading(false);
      return false;
    }

    const { count } = await supabase
      .from("game_players")
      .select("*", { count: "exact", head: true })
      .eq("lobby_id", lobbyData.id);

    if (count && count >= 6) {
      toast.error("Lobby is full (max 6 players)");
      setIsLoading(false);
      return false;
    }

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
        toast.error("Failed to join lobby");
      }
      setIsLoading(false);
      return false;
    }

    const typedAllPlayers = await fetchPlayersWithProfiles(lobbyData.id);

    const typedLobby = lobbyData as unknown as ImposterLobby;
    const typedPlayer = typedAllPlayers.find(p => p.user_id === user.id) || {
      ...playerData,
      profile: undefined,
    } as ImposterPlayer;

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
    setImposterVotes([]);
    setChat([]);
    setPublicCountdown(0);
  }, [lobby, myPlayer, user?.id]);

  const startGameInternal = async () => {
    if (!lobby) return;
    if (players.length < 3) {
      toast.error("Need at least 3 players to start");
      return;
    }

    // Pick random imposter
    const imposterIndex = Math.floor(Math.random() * players.length);
    const imposterPlayer = players[imposterIndex];

    // Use RPC function to set imposter (bypasses RLS)
    const { error: imposterError } = await supabase.rpc("set_game_imposter", {
      p_lobby_id: lobby.id,
      p_imposter_player_id: imposterPlayer.id,
    });

    if (imposterError) {
      console.error("Failed to set imposter:", imposterError);
      toast.error("Failed to start game");
      return;
    }

    // Set theme and start - game has 2 rounds
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const roundEnd = new Date(Date.now() + 120 * 1000).toISOString();

    await supabase
      .from("game_lobbies")
      .update({
        status: "submitting",
        theme,
        current_round: 1,
        max_rounds: 2,
        round_end_at: roundEnd,
      })
      .eq("id", lobby.id);
  };

  const startGame = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;
    await startGameInternal();
  }, [lobby, user?.id, players, themes]);

  const submitSong = useCallback(async (song: { id: string; name: string; artist?: string; image?: string }) => {
    if (!lobby || !myPlayer) return false;

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

  const voteForImposter = useCallback(async (votedPlayerId: string) => {
    if (!lobby || !myPlayer) return false;

    // Reuse game_votes table, storing voted player ID in submission_id field
    const { error } = await supabase.from("game_votes").insert({
      lobby_id: lobby.id,
      voter_id: myPlayer.id,
      submission_id: votedPlayerId, // Storing player ID here for imposter votes
      round: lobby.current_round,
      points: 1,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You already voted");
      } else {
        toast.error("Failed to vote");
      }
      return false;
    }

    toast.success("Vote cast!");
    return true;
  }, [lobby, myPlayer]);

  const calculateResultsInternal = async () => {
    if (!lobby) return;

    // Count votes
    const votesByPlayer: Record<string, number> = {};
    imposterVotes
      .filter(v => v.round === lobby.current_round)
      .forEach((vote) => {
        votesByPlayer[vote.voted_player_id] = (votesByPlayer[vote.voted_player_id] || 0) + 1;
      });

    const mostVotedPlayerId = Object.entries(votesByPlayer).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const imposter = players.find(p => p.is_imposter);
    const imposterCaught = mostVotedPlayerId === imposter?.id;

    // Award wins
    if (imposterCaught) {
      // Everyone except imposter wins (imposter catches)
      for (const player of players) {
        if (!player.is_imposter) {
          await supabase
            .from("profiles")
            .update({ imposter_catches: (player.profile as any)?.imposter_catches + 1 || 1 })
            .eq("id", player.user_id);
        }
      }
      // Award first catch badge
      await awardImposterBadge(players.filter(p => !p.is_imposter), "catch");
    } else {
      // Imposter wins
      if (imposter) {
        await supabase
          .from("profiles")
          .update({ imposter_wins: 1 })
          .eq("id", imposter.user_id);
        // Award first imposter win badge
        await awardImposterBadge([imposter], "imposter");
      }
    }

    await supabase
      .from("game_lobbies")
      .update({ status: "finished" })
      .eq("id", lobby.id);
  };

  const awardImposterBadge = async (winningPlayers: ImposterPlayer[], type: "catch" | "imposter") => {
    const badgeName = type === "catch" ? "Imposter Hunter" : "Master of Deception";

    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("name", badgeName)
      .maybeSingle();

    if (!badge) return;

    for (const player of winningPlayers) {
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", player.user_id)
        .eq("badge_id", badge.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("user_badges").insert({
          user_id: player.user_id,
          badge_id: badge.id,
          displayed: true,
        });

        await supabase.from("notifications").insert({
          user_id: player.user_id,
          type: "badge",
          title: "New Badge Earned!",
          message: `You earned the "${badgeName}" badge!`,
        });
      }
    }
  };

  const sendChat = useCallback(async (message: string) => {
    if (!lobby || !user) return;

    await supabase.from("game_chat").insert({
      lobby_id: lobby.id,
      user_id: user.id,
      message,
    });
  }, [lobby, user]);

  const playAgain = useCallback(async () => {
    if (!lobby || lobby.host_id !== user?.id) return;

    // Reset players
    await supabase
      .from("game_players")
      .update({ is_imposter: false, score: 0, wins: 0 })
      .eq("lobby_id", lobby.id);

    // Reset lobby
    await supabase
      .from("game_lobbies")
      .update({
        status: "waiting",
        theme: null,
        current_round: 1,
        round_end_at: null,
      })
      .eq("id", lobby.id);

    setSubmissions([]);
    setImposterVotes([]);
  }, [lobby, user?.id]);

  return {
    lobby,
    players,
    myPlayer,
    submissions,
    imposterVotes,
    chat,
    timeLeft,
    publicCountdown,
    isLoading,
    isHost: lobby?.host_id === user?.id,
    createLobby,
    createPublicLobby,
    joinLobby,
    leaveLobby,
    startGame,
    submitSong,
    voteForImposter,
    sendChat,
    playAgain,
  };
};

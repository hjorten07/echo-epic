import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  song_name: string;
  song_artist: string | null;
  song_image: string | null;
  position: number;
  added_at: string;
}

export const usePlaylists = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!user,
  });
};

// Fetch public playlists for any user (for viewing other profiles)
export const useUserPublicPlaylists = (userId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-public-playlists", userId],
    queryFn: async () => {
      if (!userId) return [];

      // If viewing own profile, get all playlists
      if (user?.id === userId) {
        const { data, error } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Playlist[];
      }

      // For other users, only get public playlists
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!userId,
  });
};

export const usePlaylist = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      if (!playlistId) return null;

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    enabled: !!playlistId,
  });
};

export const usePlaylistSongs = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: ["playlist-songs", playlistId],
    queryFn: async () => {
      if (!playlistId) return [];

      const { data, error } = await supabase
        .from("playlist_songs")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as PlaylistSong[];
    },
    enabled: !!playlistId,
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, isPublic }: { 
      name: string; 
      description?: string; 
      isPublic?: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist created!");
    },
    onError: () => {
      toast.error("Failed to create playlist");
    },
  });
};

export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description, isPublic, coverImage }: {
      id: string;
      name?: string;
      description?: string;
      isPublic?: boolean;
      coverImage?: string;
    }) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (isPublic !== undefined) updates.is_public = isPublic;
      if (coverImage !== undefined) updates.cover_image = coverImage;

      const { error } = await supabase
        .from("playlists")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      queryClient.invalidateQueries({ queryKey: ["user-public-playlists"] });
    },
  });
};

export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist deleted");
    },
    onError: () => {
      toast.error("Failed to delete playlist");
    },
  });
};

export const useAddSongToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      playlistId, 
      songId, 
      songName, 
      songArtist, 
      songImage 
    }: {
      playlistId: string;
      songId: string;
      songName: string;
      songArtist?: string;
      songImage?: string;
    }) => {
      // Get current max position
      const { data: songs } = await supabase
        .from("playlist_songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = (songs?.[0]?.position || 0) + 1;

      const { error } = await supabase
        .from("playlist_songs")
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          song_name: songName,
          song_artist: songArtist,
          song_image: songImage,
          position: nextPosition,
        });

      if (error) throw error;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["playlist-songs", playlistId] });
      toast.success("Song added to playlist!");
    },
    onError: () => {
      toast.error("Failed to add song");
    },
  });
};

export const useRemoveSongFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("id", songId);

      if (error) throw error;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["playlist-songs", playlistId] });
    },
  });
};

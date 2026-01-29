import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ListMusic, Play, User, ArrowLeft, Loader2, Lock, Globe, Music } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { GridWaveEffect } from "@/components/GridWaveEffect";
import { PlaylistSongImage } from "@/components/PlaylistSongImage";
import { PlaylistThisOrThat } from "@/components/PlaylistThisOrThat";
import { supabase } from "@/integrations/supabase/client";
import type { PlaylistSong } from "@/hooks/usePlaylists";

interface PlaylistData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image: string | null;
  user_id: string;
  created_at: string;
}

interface OwnerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

const PlaylistView = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingThisOrThat, setPlayingThisOrThat] = useState(false);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData(playlistId);
    }
  }, [playlistId]);

  const fetchPlaylistData = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (playlistError || !playlistData) {
        setError("Playlist not found");
        setLoading(false);
        return;
      }

      // Check if playlist is public or user owns it
      const { data: { user } } = await supabase.auth.getUser();
      if (!playlistData.is_public && playlistData.user_id !== user?.id) {
        setError("This playlist is private");
        setLoading(false);
        return;
      }

      setPlaylist(playlistData);

      // Fetch songs
      const { data: songsData } = await supabase
        .from("playlist_songs")
        .select("*")
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (songsData) {
        setSongs(songsData as PlaylistSong[]);
      }

      // Fetch owner profile
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", playlistData.user_id)
        .single();

      if (ownerData) {
        setOwner(ownerData);
      }
    } catch (err) {
      setError("Failed to load playlist");
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <ListMusic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-display text-3xl font-bold mb-4">{error || "Playlist not found"}</h1>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Grid wave effect background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <GridWaveEffect />
      </div>
      
      <Navbar />
      
      <main className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Playlist Header */}
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-6">
              {/* Playlist Cover */}
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden shrink-0">
                {playlist.cover_image ? (
                  <img 
                    src={playlist.cover_image} 
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-16 h-16 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {playlist.is_public ? (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {playlist.is_public ? "Public Playlist" : "Private Playlist"}
                  </span>
                </div>
                
                <h1 className="font-display text-3xl font-bold mb-2">{playlist.name}</h1>
                
                {playlist.description && (
                  <p className="text-muted-foreground mb-4">{playlist.description}</p>
                )}
                
                {/* Owner */}
                {owner && (
                  <Link 
                    to={`/user/${owner.id}`}
                    className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                      {owner.avatar_url ? (
                        <img src={owner.avatar_url} alt={owner.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold">
                          {owner.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span>{owner.username}</span>
                  </Link>
                )}
                
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-muted-foreground">
                    {songs.length} songs
                  </span>
                  {songs.length >= 2 && (
                    <Button onClick={() => setPlayingThisOrThat(true)}>
                      <Play className="w-4 h-4 mr-2" />
                      Play This or That
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Songs List */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Songs</h2>
            
            {songs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No songs in this playlist yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <Link
                    key={song.id}
                    to={`/song/${song.song_id}`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className="w-6 text-center text-muted-foreground font-medium">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <PlaylistSongImage
                        songId={song.song_id}
                        songImage={song.song_image}
                        songName={song.song_name}
                        className="w-full h-full rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{song.song_name}</p>
                      {song.song_artist && (
                        <p className="text-sm text-muted-foreground truncate">
                          {song.song_artist}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* This or That Game Modal */}
      {playingThisOrThat && songs.length >= 2 && (
        <PlaylistThisOrThat
          songs={songs}
          playlistName={playlist.name}
          onClose={() => setPlayingThisOrThat(false)}
        />
      )}
    </div>
  );
};

export default PlaylistView;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ListMusic, Trash2, Play, Loader2, Music, Settings2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { 
  usePlaylists, 
  usePlaylist,
  usePlaylistSongs,
  useCreatePlaylist, 
  useDeletePlaylist,
  useRemoveSongFromPlaylist,
} from "@/hooks/usePlaylists";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const Playlists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  
  const { data: playlists, isLoading } = usePlaylists();
  const { data: playlistDetails } = usePlaylist(selectedPlaylist || undefined);
  const { data: playlistSongs } = usePlaylistSongs(selectedPlaylist || undefined);
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeSong = useRemoveSongFromPlaylist();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist.mutateAsync({ name: newName });
    setNewName("");
    setShowCreate(false);
  };

  const handlePlayThisOrThat = (playlistId: string) => {
    navigate(`/games?playlist=${playlistId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ListMusic className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Sign in to create playlists</h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">My Playlists</h1>
              <p className="text-muted-foreground">
                Create playlists and play This or That with your favorites
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Playlist
            </Button>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Playlists List */}
            <div className="lg:col-span-1 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !playlists || playlists.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <ListMusic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No playlists yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create one to start collecting your favorite songs!
                  </p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist.id)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all",
                      selectedPlaylist === playlist.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "glass-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <ListMusic className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{playlist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(playlist.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Playlist Details */}
            <div className="lg:col-span-2">
              {selectedPlaylist && playlistDetails ? (
                <div className="glass-card rounded-xl p-6">
                  {/* Playlist Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold">{playlistDetails.name}</h2>
                      <p className="text-muted-foreground">
                        {playlistSongs?.length || 0} songs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {playlistSongs && playlistSongs.length >= 2 && (
                        <Button 
                          onClick={() => handlePlayThisOrThat(selectedPlaylist)}
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Play This or That
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this playlist?")) {
                            deletePlaylist.mutate(selectedPlaylist);
                            setSelectedPlaylist(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Songs */}
                  {!playlistSongs || playlistSongs.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No songs yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Find songs and add them to this playlist!
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/search")}
                      >
                        Find Music
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {playlistSongs.map((song, index) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                        >
                          <span className="w-6 text-center text-muted-foreground font-medium">
                            {index + 1}
                          </span>
                          <Link
                            to={`/song/${song.song_id}`}
                            className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0"
                          >
                            {song.song_image ? (
                              <img 
                                src={song.song_image} 
                                alt={song.song_name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </Link>
                          <Link 
                            to={`/song/${song.song_id}`}
                            className="flex-1 min-w-0 hover:text-primary transition-colors"
                          >
                            <p className="font-medium truncate">{song.song_name}</p>
                            {song.song_artist && (
                              <p className="text-sm text-muted-foreground truncate">
                                {song.song_artist}
                              </p>
                            )}
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSong.mutate({ 
                              playlistId: selectedPlaylist, 
                              songId: song.id 
                            })}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Settings2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a playlist to view its songs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Create Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Playlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button 
              onClick={handleCreate} 
              disabled={!newName.trim() || createPlaylist.isPending}
              className="w-full"
            >
              {createPlaylist.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Playlists;

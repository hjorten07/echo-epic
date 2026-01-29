import { useState } from "react";
import { Link } from "react-router-dom";
import { ListMusic, Plus, Trash2, Gamepad2, Loader2, Lock, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlaylists, useUserPublicPlaylists, usePlaylistSongs, useCreatePlaylist, useDeletePlaylist } from "@/hooks/usePlaylists";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaylistThisOrThat } from "@/components/PlaylistThisOrThat";
import { SharePlaylistDialog } from "@/components/SharePlaylistDialog";
import { useAuth } from "@/hooks/useAuth";

interface ProfilePlaylistsProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfilePlaylists = ({ userId, isOwnProfile }: ProfilePlaylistsProps) => {
  const { user } = useAuth();
  const { data: ownPlaylists, isLoading: ownLoading } = usePlaylists();
  const { data: publicPlaylists, isLoading: publicLoading } = useUserPublicPlaylists(userId);
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [sharePlaylistId, setSharePlaylistId] = useState<string | null>(null);

  // Use own playlists for own profile, public playlists for others
  const displayPlaylists = isOwnProfile ? ownPlaylists : publicPlaylists;
  const isLoading = isOwnProfile ? ownLoading : publicLoading;

  // Fetch songs for active playlist
  const { data: playlistSongs } = usePlaylistSongs(activePlaylistId || "");

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist.mutate(
      { name: newPlaylistName, isPublic: newIsPublic },
      {
        onSuccess: () => {
          setNewPlaylistName("");
          setNewIsPublic(false);
          setCreateDialogOpen(false);
        },
      }
    );
  };

  const handleDeletePlaylist = (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist.mutate(playlistId);
    }
  };

  const handlePlayThisOrThat = (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePlaylistId(playlistId);
  };

  const handleSharePlaylist = (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSharePlaylistId(playlistId);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Playlists</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activePlaylist = displayPlaylists?.find(p => p.id === activePlaylistId);
  const sharePlaylist = displayPlaylists?.find(p => p.id === sharePlaylistId);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-primary" />
          Playlists
        </h2>
        {isOwnProfile && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="w-4 h-4 mr-1" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-playlist-name">Playlist Name</Label>
                  <Input
                    id="new-playlist-name"
                    placeholder="My awesome playlist..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    {newIsPublic ? (
                      <Globe className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{newIsPublic ? "Public" : "Private"}</p>
                      <p className="text-xs text-muted-foreground">
                        {newIsPublic ? "Anyone can see this playlist" : "Only you can see this playlist"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={newIsPublic} onCheckedChange={setNewIsPublic} />
                </div>
                <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="w-full">
                  Create Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {displayPlaylists && displayPlaylists.length > 0 ? (
        <div className="grid gap-3">
          {displayPlaylists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlists?id=${playlist.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden">
                {playlist.cover_image ? (
                  <img 
                    src={playlist.cover_image} 
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{playlist.name}</p>
                  {playlist.is_public ? (
                    <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground truncate">{playlist.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {user && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleSharePlaylist(e, playlist.id)}
                    title="Share playlist"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => handlePlayThisOrThat(e, playlist.id)}
                  title="Play This or That"
                  className="text-primary hover:text-primary/80"
                >
                  <Gamepad2 className="w-4 h-4" />
                </Button>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground rounded-xl bg-secondary/30">
          <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No playlists yet</p>
          {isOwnProfile && (
            <p className="text-sm mt-1">Create a playlist to organize your favorite songs!</p>
          )}
        </div>
      )}

      {/* Playlist This or That Game Modal */}
      {activePlaylistId && playlistSongs && activePlaylist && (
        <PlaylistThisOrThat
          songs={playlistSongs}
          playlistName={activePlaylist.name}
          onClose={() => setActivePlaylistId(null)}
        />
      )}

      {/* Share Playlist Dialog */}
      {sharePlaylistId && sharePlaylist && (
        <SharePlaylistDialog
          playlistId={sharePlaylist.id}
          playlistName={sharePlaylist.name}
          playlistImage={sharePlaylist.cover_image || undefined}
          open={!!sharePlaylistId}
          onOpenChange={(open) => !open && setSharePlaylistId(null)}
        />
      )}
    </div>
  );
};

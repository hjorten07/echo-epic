import { useState } from "react";
import { Plus, ListMusic, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists, useCreatePlaylist, useAddSongToPlaylist } from "@/hooks/usePlaylists";
import { cn } from "@/lib/utils";

interface AddToPlaylistDialogProps {
  songId: string;
  songName: string;
  songArtist?: string;
  songImage?: string;
}

export const AddToPlaylistDialog = ({
  songId,
  songName,
  songArtist,
  songImage,
}: AddToPlaylistDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addSong = useAddSongToPlaylist();

  const handleAddToPlaylist = async (playlistId: string) => {
    await addSong.mutateAsync({
      playlistId,
      songId,
      songName,
      songArtist,
      songImage,
    });
    setOpen(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    const playlist = await createPlaylist.mutateAsync({ name: newPlaylistName });
    if (playlist) {
      await addSong.mutateAsync({
        playlistId: playlist.id,
        songId,
        songName,
        songArtist,
        songImage,
      });
    }
    setOpen(false);
    setShowCreate(false);
    setNewPlaylistName("");
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ListMusic className="w-4 h-4" />
          Add to Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Add to Playlist</DialogTitle>
        </DialogHeader>

        {/* Song Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          {songImage ? (
            <img src={songImage} alt={songName} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <span className="font-bold">{songName[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{songName}</p>
            {songArtist && (
              <p className="text-sm text-muted-foreground truncate">{songArtist}</p>
            )}
          </div>
        </div>

        {/* Create New or Select Existing */}
        {showCreate ? (
          <div className="space-y-3">
            <Input
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAndAdd}
                disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                className="flex-1"
              >
                {createPlaylist.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Create & Add
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Create New Playlist Button */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Playlist</span>
            </button>

            {/* Existing Playlists */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addSong.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      "bg-secondary/50 hover:bg-secondary text-left"
                    )}
                  >
                    <ListMusic className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{playlist.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No playlists yet. Create one to get started!
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

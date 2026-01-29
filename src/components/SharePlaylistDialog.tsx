import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Search, Check, Users, MessageSquare, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SharePlaylistDialogProps {
  playlistId: string;
  playlistName: string;
  playlistImage?: string;
  playlistOwnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SharePlaylistDialog = ({
  playlistId,
  playlistName,
  playlistImage,
  playlistOwnerId,
  open,
  onOpenChange,
}: SharePlaylistDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"dm" | "wall">("dm");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; username: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch mutual followers
  const { data: friends, isLoading } = useQuery({
    queryKey: ["mutual-followers", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!following || following.length === 0) return [];

      const followingIds = following.map(f => f.following_id);
      const { data: mutualFollows } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id)
        .in("follower_id", followingIds);

      if (!mutualFollows || mutualFollows.length === 0) return [];

      const mutualIds = mutualFollows.map(f => f.follower_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", mutualIds);

      return profiles || [];
    },
    enabled: !!user && open,
  });

  const filteredFriends = friends?.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build the playlist view URL
  const getPlaylistUrl = () => {
    return `/playlist/${playlistId}`;
  };

  const handleShareDM = async () => {
    if (!user || !selectedFriend) return;

    setSending(true);
    try {
      const playlistUrl = getPlaylistUrl();
      const shareContent = message 
        ? `${message}\n\n🎵 Check out this playlist: ${playlistName}`
        : `🎵 Check out this playlist: ${playlistName}`;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: shareContent,
      });

      if (error) throw error;

      toast.success(`Shared with ${selectedFriend.username}!`);
      onOpenChange(false);
      resetState();
      // Navigate to the playlist on their profile
      navigate(playlistUrl);
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share");
    }
    setSending(false);
  };

  const handleShareWall = async () => {
    if (!user) return;

    setSending(true);
    try {
      const playlistUrl = getPlaylistUrl();
      const shareContent = message 
        ? `${message}\n\n🎵 Check out my playlist: ${playlistName}`
        : `🎵 Check out my playlist: ${playlistName}`;

      const { data: isValid } = await supabase.rpc('validate_message', {
        message_text: shareContent.trim()
      });

      if (!isValid) {
        toast.error("Content contains inappropriate words");
        setSending(false);
        return;
      }

      const { error } = await supabase.from("wall_posts").insert({
        user_id: user.id,
        content: shareContent,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
      toast.success("Shared to wall!");
      onOpenChange(false);
      resetState();
      // Navigate to the playlist on their profile
      navigate(playlistUrl);
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share");
    }
    setSending(false);
  };

  const resetState = () => {
    setSelectedFriend(null);
    setMessage("");
    setSearchQuery("");
    setMode("dm");
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetState(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share Playlist</DialogTitle>
        </DialogHeader>

        {/* Playlist Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          {playlistImage ? (
            <img src={playlistImage} alt={playlistName} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{playlistName}</p>
            <p className="text-xs text-primary">Playlist</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "dm" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("dm")}
          >
            <Users className="w-4 h-4 mr-2" />
            Send to Friend
          </Button>
          <Button
            variant={mode === "wall" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("wall")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Post to Wall
          </Button>
        </div>

        {/* Message */}
        <div>
          <Textarea
            placeholder="Add a message... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
        </div>

        {mode === "dm" ? (
          <>
            {/* Friend Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Friends List */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredFriends || filteredFriends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {searchQuery ? "No friends found" : "Follow someone and have them follow you back to share!"}
                </p>
              ) : (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(
                      selectedFriend?.id === friend.id ? null : friend
                    )}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      selectedFriend?.id === friend.id
                        ? "bg-primary/10 border border-primary"
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold">
                          {friend.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 text-left font-medium">{friend.username}</span>
                    {selectedFriend?.id === friend.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleShareDM}
              disabled={!selectedFriend || sending}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Share with {selectedFriend?.username || "friend"}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleShareWall}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Post to Wall
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

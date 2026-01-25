import { useState } from "react";
import { Share2, Send, Loader2, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareMusicDialogProps {
  itemType: "song" | "album" | "artist";
  itemId: string;
  itemName: string;
  itemImage?: string;
  itemSubtitle?: string;
  itemArtist?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const ShareMusicDialog = ({
  itemType,
  itemId,
  itemName,
  itemImage,
  itemSubtitle,
  itemArtist,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ShareMusicDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; username: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const subtitle = itemSubtitle || itemArtist;

  // Fetch mutual followers (friends who can receive messages)
  const { data: friends, isLoading } = useQuery({
    queryKey: ["mutual-followers", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get users the current user follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!following || following.length === 0) return [];

      // Check which of those follow back (mutual)
      const followingIds = following.map(f => f.following_id);
      const { data: mutualFollows } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id)
        .in("follower_id", followingIds);

      if (!mutualFollows || mutualFollows.length === 0) return [];

      const mutualIds = mutualFollows.map(f => f.follower_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", mutualIds);

      return profiles || [];
    },
    enabled: !!user && isOpen,
  });

  const filteredFriends = friends?.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = async () => {
    if (!user || !selectedFriend) return;

    setSending(true);
    try {
      const shareUrl = `${window.location.origin}/${itemType}/${itemId}`;
      const shareContent = message 
        ? `${message}\n\n🎵 ${itemName}${subtitle ? ` - ${subtitle}` : ""}\n${shareUrl}`
        : `Check this out! 🎵\n\n${itemName}${subtitle ? ` - ${subtitle}` : ""}\n${shareUrl}`;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: shareContent,
      });

      if (error) throw error;

      toast.success(`Shared with ${selectedFriend.username}!`);
      setOpen(false);
      setSelectedFriend(null);
      setMessage("");
      setSearchQuery("");
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share");
    }
    setSending(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share with a friend!</DialogTitle>
        </DialogHeader>

        {/* Item Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          {itemImage ? (
            <img src={itemImage} alt={itemName} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-lg font-bold">{itemName[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{itemName}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
            <p className="text-xs text-primary capitalize">{itemType}</p>
          </div>
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
          onClick={handleShare}
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
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Conversation {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const MessagesDropdown = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Get all mutual followers (people you follow who follow you back)
        const { data: mutualFollowers } = await supabase.rpc("are_mutual_followers", {
          user1_id: user.id,
          user2_id: user.id,
        });

        // Get recent messages grouped by conversation partner
        const { data: messages } = await supabase
          .from("messages")
          .select(`
            *,
            sender:sender_id(id, username, avatar_url),
            receiver:receiver_id(id, username, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(50);

        if (messages) {
          // Group by conversation partner
          const convMap = new Map<string, Conversation>();
          
          messages.forEach((msg: any) => {
            const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;
            
            if (!convMap.has(partnerId)) {
              convMap.set(partnerId, {
                id: partnerId,
                username: partner?.username || "Unknown",
                avatar_url: partner?.avatar_url,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                unreadCount: msg.receiver_id === user.id && !msg.read ? 1 : 0,
              });
            } else if (msg.receiver_id === user.id && !msg.read) {
              const conv = convMap.get(partnerId)!;
              conv.unreadCount++;
            }
          });

          const convList = Array.from(convMap.values());
          setConversations(convList);
          setTotalUnread(convList.reduce((sum, c) => sum + c.unreadCount, 0));
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display font-semibold">Messages</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Follow someone and have them follow you back to start chatting!
            </p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {conversations.slice(0, 5).map((conv) => (
              <DropdownMenuItem key={conv.id} asChild>
                <Link
                  to={`/messages/${conv.id}`}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 ring-2 ring-primary/30">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt={conv.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                        {conv.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.username}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.lastMessageTime), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {/* Open Messages Button */}
        <div className="border-t border-border p-2">
          <Link
            to="/conversations"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Open Messages
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

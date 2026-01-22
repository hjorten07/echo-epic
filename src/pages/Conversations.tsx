import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Loader2, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Conversation {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const Conversations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          read
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, {
        partnerId: string;
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
      }>();

      for (const msg of messages || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: 0,
          });
        }
        
        // Count unread messages
        if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      }

      // Fetch partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", partnerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const convList: Conversation[] = [];
      conversationMap.forEach((conv) => {
        const profile = profileMap.get(conv.partnerId);
        if (profile) {
          convList.push({
            ...conv,
            partnerUsername: profile.username,
            partnerAvatar: profile.avatar_url,
          });
        }
      });

      // Sort by most recent
      convList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(convList);
      setLoading(false);
    };

    fetchConversations();

    // Real-time subscription for new messages
    const channel = supabase
      .channel("conversations")
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
  }, [user, navigate]);

  const filteredConversations = conversations.filter((c) =>
    c.partnerUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">Your conversations with mutual followers</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 bg-secondary/50 border-border/50"
            />
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold mb-2">No conversations yet</h2>
              <p className="text-muted-foreground mb-4">
                Start messaging by visiting a mutual follower's profile
              </p>
              <Link
                to="/social"
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Find People
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              {filteredConversations.map((conv) => (
                <Link
                  key={conv.partnerId}
                  to={`/messages/${conv.partnerId}`}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
                      {conv.partnerAvatar ? (
                        <img
                          src={conv.partnerAvatar}
                          alt={conv.partnerUsername}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-xl">
                          {conv.partnerUsername[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{conv.partnerUsername}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.lastMessageAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Conversations;
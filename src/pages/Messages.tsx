import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

const Messages = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [canMessage, setCanMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!partnerId) {
      navigate("/");
      return;
    }

    const checkMutualFollow = async () => {
      const { data } = await supabase.rpc("are_mutual_followers", {
        user1_id: user.id,
        user2_id: partnerId,
      });
      setCanMessage(!!data);
      
      if (!data) {
        toast.error("You can only message mutual followers");
      }
    };

    const fetchPartner = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", partnerId)
        .single();
      
      if (data) {
        setPartner(data);
      }
    };

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      
      if (data) {
        setMessages(data);
        
        // Mark unread messages as read
        const unreadIds = data
          .filter((m) => m.receiver_id === user.id && !m.read)
          .map((m) => m.id);
        
        if (unreadIds.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in("id", unreadIds);
        }
      }
      setLoading(false);
    };

    checkMutualFollow();
    fetchPartner();
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            
            // Mark as read if we're the receiver
            if (msg.receiver_id === user.id) {
              supabase
                .from("messages")
                .update({ read: true })
                .eq("id", msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, partnerId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !partnerId || !canMessage) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: newMessage.trim(),
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-4 flex flex-col">
        <div className="container mx-auto px-4 max-w-2xl flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {partner && (
              <Link to={`/user/${partner.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden ring-2 ring-primary/30">
                  {partner.avatar_url ? (
                    <img src={partner.avatar_url} alt={partner.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">
                      {partner.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-semibold">{partner.username}</span>
              </Link>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 glass-card rounded-2xl p-4 mb-4 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
                <p>No messages yet</p>
                <p className="text-sm">Send a message to start the conversation!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_id === user.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2",
                        msg.sender_id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        msg.sender_id === user.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {canMessage ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground text-sm">
                You can only message mutual followers
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, MessageCircle, Flag, Trash2, MoreVertical } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { filterContent } from "@/lib/chatFilter";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  deleted_by_sender?: boolean;
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState("");
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
        // Filter out messages deleted by sender (unless we're the receiver)
        const visibleMessages = data.filter(m => 
          !m.deleted_by_sender || m.sender_id !== user.id
        );
        setMessages(visibleMessages);
        
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
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new as Message;
            if (
              (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
              (msg.sender_id === partnerId && msg.receiver_id === user.id)
            ) {
              setMessages((prev) => [...prev, msg]);
              
              if (msg.receiver_id === user.id) {
                supabase
                  .from("messages")
                  .update({ read: true })
                  .eq("id", msg.id);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const msg = payload.new as Message;
            if (msg.deleted_by_sender && msg.sender_id === user.id) {
              setMessages(prev => prev.filter(m => m.id !== msg.id));
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

    // Client-side check for basic patterns
    const filterResult = filterContent(newMessage, []);
    if (!filterResult.isClean) {
      toast.error(filterResult.reason || "Message contains inappropriate content");
      return;
    }

    // Server-side validation against banned words (hidden from client)
    const { data: isValid, error: validationError } = await supabase.rpc('validate_message', {
      message_text: newMessage.trim()
    });
    
    if (validationError || isValid === false) {
      toast.error("Message contains inappropriate content");
      return;
    }

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

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_by_sender: true, deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    }
  };

  const handleReportMessage = async () => {
    if (!reportingMessage || !reportReason.trim() || !user) return;

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportingMessage.sender_id,
      reason: `Message report: "${reportingMessage.content.substring(0, 100)}..." - Reason: ${reportReason}`,
    });

    if (error) {
      toast.error("Failed to submit report");
    } else {
      toast.success("Report submitted. Our team will review it.");
      setReportDialogOpen(false);
      setReportingMessage(null);
      setReportReason("");
    }
  };

  const handleReportConversation = async () => {
    if (!reportReason.trim() || !user || !partnerId || !partner) return;

    // Create a report with the entire conversation context
    const conversationPreview = messages.slice(-10).map(m => 
      `[${m.sender_id === user.id ? 'You' : partner.username}]: ${m.content.substring(0, 50)}`
    ).join('\n');

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: partnerId,
      reason: `Conversation report with ${partner.username}:\n\nReason: ${reportReason}\n\nRecent messages (last 10):\n${conversationPreview}\n\n[Admin: View full conversation in database - partner_id: ${partnerId}, reporter_id: ${user.id}]`,
    });

    if (error) {
      toast.error("Failed to submit report");
    } else {
      toast.success("Conversation reported. Our team will review the full conversation.");
      setReportDialogOpen(false);
      setReportingMessage(null);
      setReportReason("");
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
              <Link to={`/user/${partner.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
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

            {/* Report Conversation Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setReportingMessage(null);
                setReportDialogOpen(true);
              }}
            >
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
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
                      "flex group",
                      msg.sender_id === user.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="flex items-start gap-1">
                      {/* Actions for received messages */}
                      {msg.sender_id !== user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setReportingMessage(msg);
                                setReportDialogOpen(true);
                              }}
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      
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

                      {/* Actions for sent messages */}
                      {msg.sender_id === user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reportingMessage ? "Report Message" : "Report Conversation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reportingMessage ? (
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                "{reportingMessage?.content.substring(0, 100)}..."
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This will report the entire conversation with {partner?.username}. Our team will be able to review all messages, including deleted ones.
              </p>
            )}
            <Textarea
              placeholder={reportingMessage ? "Why are you reporting this message?" : "Why are you reporting this conversation?"}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={reportingMessage ? handleReportMessage : handleReportConversation}
                disabled={!reportReason.trim()}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;

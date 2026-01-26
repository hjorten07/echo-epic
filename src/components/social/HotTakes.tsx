import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, MessageCircle, ChevronRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { 
  useHotTakes, 
  useCreateHotTake, 
  useHotTakeReplies,
  useCreateHotTakeReply,
  useVote, 
  type HotTake 
} from "@/hooks/useSocialFeatures";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Drum icon for upvote
const DrumIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="8" />
    <path d="M12 6V2" />
    <path d="M8 4h8" />
    <path d="M4 10l3 2" />
    <path d="M20 10l-3 2" />
  </svg>
);

// Cello icon for downvote
const CelloIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M12 7v14" />
    <ellipse cx="12" cy="14" rx="6" ry="4" />
    <path d="M6 14v3c0 2 2.5 3 6 3s6-1 6-3v-3" />
  </svg>
);

interface DiscussionModalProps {
  hotTake: HotTake;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiscussionModal = ({ hotTake, open, onOpenChange }: DiscussionModalProps) => {
  const { user } = useAuth();
  const { data: replies, isLoading } = useHotTakeReplies(hotTake.id);
  const createReply = useCreateHotTakeReply();
  const [newReply, setNewReply] = useState("");

  const handleReply = () => {
    if (!newReply.trim()) return;
    createReply.mutate({
      hotTakeId: hotTake.id,
      content: newReply,
    }, {
      onSuccess: () => setNewReply(""),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Discussion</DialogTitle>
        </DialogHeader>
        
        {/* Original hot take */}
        <div className="p-4 rounded-lg bg-secondary/50 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {hotTake.profile?.avatar_url ? (
                <img src={hotTake.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{hotTake.profile?.username?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="font-semibold">{hotTake.profile?.username}</span>
          </div>
          <p className="text-sm">{hotTake.content}</p>
        </div>

        {/* Replies */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : replies && replies.length > 0 ? (
            replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Link to={`/user/${reply.user_id}`}>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {reply.profile?.avatar_url ? (
                      <img src={reply.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{reply.profile?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/${reply.user_id}`} className="text-sm font-semibold hover:text-primary">
                      {reply.profile?.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(reply.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{reply.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm">No replies yet. Start the debate!</p>
          )}
        </div>

        {/* Reply input */}
        {user && (
          <div className="flex gap-2">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Add your take..."
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleReply}
              disabled={!newReply.trim() || createReply.isPending}
              size="icon"
            >
              {createReply.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const HotTakes = () => {
  const { user } = useAuth();
  const { data: hotTakes, isLoading } = useHotTakes();
  const createHotTake = useCreateHotTake();
  const vote = useVote();

  const [newTake, setNewTake] = useState("");
  const [selectedTake, setSelectedTake] = useState<HotTake | null>(null);

  const handlePost = () => {
    if (!newTake.trim()) return;
    createHotTake.mutate(newTake, {
      onSuccess: () => setNewTake(""),
    });
  };

  const handleVote = (take: HotTake, voteType: "upvote" | "downvote") => {
    if (!user) return;
    const newVote = take.userVote === voteType ? null : voteType;
    vote.mutate({
      targetType: "hot_take",
      targetId: take.id,
      voteType: newVote,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post input */}
      {user && (
        <div className="glass-card rounded-xl p-4">
          <Textarea
            value={newTake}
            onChange={(e) => setNewTake(e.target.value)}
            placeholder="Drop your hot take..."
            className="mb-3 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              🔥 Make it spicy!
            </span>
            <Button
              onClick={handlePost}
              disabled={!newTake.trim() || newTake.length > 500 || createHotTake.isPending}
            >
              {createHotTake.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post Take
            </Button>
          </div>
        </div>
      )}

      {/* Hot Takes */}
      {hotTakes && hotTakes.length > 0 ? (
        <div className="space-y-4">
          {hotTakes.map((take) => (
            <div 
              key={take.id} 
              className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelectedTake(take)}
            >
              <div className="flex items-start gap-3">
                <Link to={`/user/${take.user_id}`} onClick={(e) => e.stopPropagation()}>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {take.profile?.avatar_url ? (
                      <img src={take.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold">{take.profile?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/user/${take.user_id}`} 
                      className="font-semibold hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {take.profile?.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(take.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>

                  <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
                    {take.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleVote(take, "upvote")}
                          disabled={!user}
                          className={cn(
                            "flex items-center gap-1 transition-colors",
                            take.userVote === "upvote" 
                              ? "text-green-500" 
                              : "text-muted-foreground hover:text-green-500"
                          )}
                        >
                          <DrumIcon className="w-5 h-5" />
                          <span className="text-sm">{take.upvotes}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Upvote</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleVote(take, "downvote")}
                          disabled={!user}
                          className={cn(
                            "flex items-center gap-1 transition-colors",
                            take.userVote === "downvote" 
                              ? "text-red-500" 
                              : "text-muted-foreground hover:text-red-500"
                          )}
                        >
                          <CelloIcon className="w-5 h-5" />
                          <span className="text-sm">{take.downvotes}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Downvote</TooltipContent>
                    </Tooltip>

                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{take.replyCount}</span>
                    </button>

                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No hot takes yet. Drop the first one!</p>
        </div>
      )}

      {/* Discussion Modal */}
      {selectedTake && (
        <DiscussionModal
          hotTake={selectedTake}
          open={!!selectedTake}
          onOpenChange={(open) => !open && setSelectedTake(null)}
        />
      )}
    </div>
  );
};

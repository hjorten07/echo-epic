import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, X } from "lucide-react";
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
import { useWallPostReplies, useCreateWallPostReply, useVote, type WallPost, type WallPostReply } from "@/hooks/useSocialFeatures";
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

interface WallPostDiscussionProps {
  post: WallPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WallPostDiscussion = ({ post, open, onOpenChange }: WallPostDiscussionProps) => {
  const { user } = useAuth();
  const { data: replies, isLoading } = useWallPostReplies(post.id);
  const createReply = useCreateWallPostReply();
  const vote = useVote();
  const [newReply, setNewReply] = useState("");

  const handleReply = () => {
    if (!newReply.trim()) return;
    createReply.mutate({
      postId: post.id,
      content: newReply,
    }, {
      onSuccess: () => setNewReply(""),
    });
  };

  const handleVote = (voteType: "upvote" | "downvote") => {
    if (!user) return;
    const newVote = post.userVote === voteType ? null : voteType;
    vote.mutate({
      targetType: "wall_post",
      targetId: post.id,
      voteType: newVote,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Discussion</DialogTitle>
        </DialogHeader>
        
        {/* Original post */}
        <div className="p-4 rounded-lg bg-secondary/50 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/user/${post.user_id}`}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {post.profile?.avatar_url ? (
                  <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{post.profile?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </Link>
            <Link to={`/user/${post.user_id}`} className="font-semibold hover:text-primary">
              {post.profile?.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {format(new Date(post.created_at), "MMM d, h:mm a")}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          
          {/* Vote buttons */}
          <div className="flex items-center gap-4 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleVote("upvote")}
                  disabled={!user}
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    post.userVote === "upvote" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <DrumIcon className="w-4 h-4" />
                  <span className="text-sm">{post.upvotes}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Upvote</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleVote("downvote")}
                  disabled={!user}
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    post.userVote === "downvote" 
                      ? "text-destructive" 
                      : "text-muted-foreground hover:text-destructive"
                  )}
                >
                  <CelloIcon className="w-4 h-4" />
                  <span className="text-sm">{post.downvotes}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Downvote</TooltipContent>
            </Tooltip>
          </div>
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
            <p className="text-center text-muted-foreground text-sm">No replies yet. Start the conversation!</p>
          )}
        </div>

        {/* Reply input */}
        {user && (
          <div className="flex gap-2">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Add your reply..."
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

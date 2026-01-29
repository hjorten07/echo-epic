import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, Flag, Trash2, MoreVertical, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useWallPosts, useCreateWallPost, useVote, useReportWallPost, useDeleteWallPost, type WallPost } from "@/hooks/useSocialFeatures";
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

interface WallPostCardProps {
  post: WallPost;
  onReport: (post: WallPost) => void;
}

const WallPostCard = ({ post, onReport }: WallPostCardProps) => {
  const { user } = useAuth();
  const vote = useVote();
  const deletePost = useDeleteWallPost();

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
    <div className="glass-card rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        <Link to={`/user/${post.user_id}`}>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold">{post.profile?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/user/${post.user_id}`} className="font-semibold hover:text-primary">
                {post.profile?.username}
              </Link>
              <span className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), "MMM d, h:mm a")}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {user && user.id !== post.user_id && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onReport(post)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
                {user && user.id === post.user_id && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => deletePost.mutate(post.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
            {post.content}
          </p>

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
                  <DrumIcon className="w-5 h-5" />
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
                  <CelloIcon className="w-5 h-5" />
                  <span className="text-sm">{post.downvotes}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Downvote</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SocialWall = () => {
  const { user } = useAuth();
  const { data: posts, isLoading } = useWallPosts();
  const createPost = useCreateWallPost();
  const reportPost = useReportWallPost();

  const [newPost, setNewPost] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<WallPost | null>(null);
  const [reportReason, setReportReason] = useState("");

  const handlePost = () => {
    if (!newPost.trim()) return;
    createPost.mutate(newPost, {
      onSuccess: () => setNewPost(""),
    });
  };

  const handleOpenReport = (post: WallPost) => {
    setReportingPost(post);
    setReportDialogOpen(true);
  };

  const handleReport = () => {
    if (!reportingPost || !reportReason.trim()) return;
    reportPost.mutate({
      postId: reportingPost.id,
      userId: reportingPost.user_id,
      content: reportingPost.content,
      reason: reportReason,
    }, {
      onSuccess: () => {
        setReportDialogOpen(false);
        setReportingPost(null);
        setReportReason("");
      },
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
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="mb-3 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {newPost.length}/500 characters
            </span>
            <Button
              onClick={handlePost}
              disabled={!newPost.trim() || newPost.length > 500 || createPost.isPending}
            >
              {createPost.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <WallPostCard key={post.id} post={post} onReport={handleOpenReport} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              "{reportingPost?.content.substring(0, 100)}..."
            </div>
            <Textarea
              placeholder="Why are you reporting this post?"
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
                onClick={handleReport}
                disabled={!reportReason.trim() || reportPost.isPending}
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

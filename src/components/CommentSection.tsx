import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MessageCircle, Send, Trash2, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useComments, useCreateComment, useDeleteComment, useReportComment } from "@/hooks/useComments";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommentSectionProps {
  itemType: "artist" | "album" | "song";
  itemId: string;
}

export const CommentSection = ({ itemType, itemId }: CommentSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingComment, setReportingComment] = useState<{ id: string; userId: string } | null>(null);
  const [reportReason, setReportReason] = useState("");

  const { data: comments, isLoading } = useComments(itemType, itemId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const reportComment = useReportComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        itemType,
        itemId,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, itemType, itemId });
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleReport = async () => {
    if (!reportingComment || !reportReason.trim()) return;

    try {
      await reportComment.mutateAsync({
        commentId: reportingComment.id,
        userId: reportingComment.userId,
        reason: reportReason.trim(),
      });
      toast.success("Report submitted. Thank you for helping keep our community safe.");
      setReportDialogOpen(false);
      setReportingComment(null);
      setReportReason("");
    } catch (error) {
      toast.error("Failed to submit report");
    }
  };

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h2 className="font-display text-2xl font-bold">Discussion</h2>
        {comments && comments.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({comments.length} {comments.length === 1 ? "comment" : "comments"})
          </span>
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4 mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Share your thoughts..." : "Log in to join the discussion"}
          className="mb-3 resize-none bg-secondary/50"
          rows={3}
          disabled={!user}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="bg-primary text-primary-foreground"
          >
            {createComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {user ? "Post Comment" : "Log In to Comment"}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Link to={`/user/${comment.user_id}`} className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {comment.profiles.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-primary">
                        {comment.profiles.username[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/user/${comment.user_id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {comment.profiles.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {user && user.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {user && user.id !== comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setReportingComment({ id: comment.id, userId: comment.user_id });
                        setReportDialogOpen(true);
                      }}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Please tell us why you're reporting this comment. Reports are reviewed by our moderation team.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground"
              onClick={handleReport}
              disabled={!reportReason.trim() || reportComment.isPending}
            >
              {reportComment.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface SuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuggestionsModal = ({ open, onOpenChange }: SuggestionsModalProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    if (content.trim().length < 10) {
      toast({
        title: "Too short",
        description: "Please provide more detail in your feedback.",
        variant: "destructive",
      });
      return;
    }

    if (content.trim().length > 1000) {
      toast({
        title: "Too long",
        description: "Please keep your feedback under 1000 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("suggestions").insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      setContent("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Have a suggestion or found a bug? Let us know and help improve Remelic!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="Share your ideas, report bugs, or suggest new features..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/1000 characters
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || content.trim().length < 10}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

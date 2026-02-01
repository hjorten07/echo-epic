import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GameRatingDialogProps {
  lobbyId: string;
  gameType: "song_rush" | "imposter";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GameRatingDialog = ({
  lobbyId,
  gameType,
  open,
  onOpenChange,
}: GameRatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !rating) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("game_session_ratings").insert({
        user_id: user.id,
        lobby_id: lobbyId,
        game_type: gameType,
        rating,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You already rated this game");
        } else {
          throw error;
        }
      } else {
        toast.success("Thanks for rating!");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Rating error:", error);
      toast.error("Failed to submit rating");
    }
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center font-display">
            Rate this game!
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <p className="text-center text-muted-foreground text-sm mb-6">
            How was your {gameType === "song_rush" ? "Song Rush" : "Imposter"} experience?
          </p>

          {/* Star Rating */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>

          {displayRating > 0 && (
            <p className="text-center text-2xl font-bold text-primary mb-4">
              {displayRating}/10
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground mb-6">
            This rating doesn't affect your profile stats
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!rating || isSubmitting}
              className="flex-1"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

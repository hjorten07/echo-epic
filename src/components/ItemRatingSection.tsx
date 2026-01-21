import { useNavigate } from "react-router-dom";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { useUserRating, useItemRating, useRateMutation, useDeleteRatingMutation } from "@/hooks/useRatings";
import { useCheckAndAwardBadges, useUpdateStreak } from "@/hooks/useBadges";
import { Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ItemRatingSectionProps {
  itemType: "artist" | "album" | "song";
  itemId: string;
  itemName: string;
  itemImage?: string;
  itemSubtitle?: string;
}

export const ItemRatingSection = ({
  itemType,
  itemId,
  itemName,
  itemImage,
  itemSubtitle,
}: ItemRatingSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: userRating } = useUserRating(itemType, itemId);
  const { data: itemRating } = useItemRating(itemType, itemId);
  const rateMutation = useRateMutation();
  const deleteMutation = useDeleteRatingMutation();
  const checkBadges = useCheckAndAwardBadges();
  const updateStreak = useUpdateStreak();

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.info("Please log in to rate");
      navigate("/auth");
      return;
    }

    try {
      await rateMutation.mutateAsync({
        itemType,
        itemId,
        itemName,
        itemImage,
        itemSubtitle,
        rating,
      });
      toast.success(`Rated ${itemName} ${rating}/10!`);
      
      // Check for new badges and update streak
      await Promise.all([
        checkBadges.mutateAsync(),
        updateStreak.mutateAsync(),
      ]);
    } catch (error) {
      toast.error("Failed to save rating");
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating?.id) return;
    
    try {
      await deleteMutation.mutateAsync(userRating.id);
      toast.success("Rating deleted");
    } catch (error) {
      toast.error("Failed to delete rating");
    }
  };

  const avgRating = itemRating?.avg_rating || 0;
  const totalRatings = itemRating?.total_ratings || 0;
  const currentUserRating = userRating?.rating || 0;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* User Rating - Interactive Stars */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-2">
          {user ? "Your Rating" : "Rate This"}
        </p>
        <div className="flex items-center gap-3">
          <StarRating
            rating={currentUserRating}
            onRate={handleRate}
            size="lg"
            showValue={currentUserRating > 0}
          />
          {user && currentUserRating > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteRating}
              className="text-destructive hover:text-destructive shrink-0"
              title="Delete rating"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {!user && (
          <p className="text-xs text-muted-foreground mt-2">
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline"
            >
              Log in
            </button>
            {" "}to rate this {itemType}
          </p>
        )}
        {user && currentUserRating === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Click a star to rate
          </p>
        )}
      </div>

      {/* Community Rating - Display Only */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
        <Users className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground mb-1">Community</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-primary">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground">
              / 10
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
          </p>
        </div>
      </div>
    </div>
  );
};

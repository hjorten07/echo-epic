import { useNavigate } from "react-router-dom";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { useUserRating, useItemRating, useRateMutation } from "@/hooks/useRatings";
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
    } catch (error) {
      toast.error("Failed to save rating");
    }
  };

  const avgRating = itemRating?.avg_rating || 0;
  const totalRatings = itemRating?.total_ratings || 0;
  const currentUserRating = userRating?.rating || 0;

  return (
    <div className="space-y-4">
      {/* Community Rating */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Community Rating</p>
        <StarRating
          rating={avgRating}
          readonly
          size="lg"
          showValue
          totalRatings={totalRatings}
        />
      </div>

      {/* User Rating */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          {user ? "Your Rating" : "Rate This"}
        </p>
        <StarRating
          rating={currentUserRating}
          onRate={handleRate}
          size="lg"
          showValue={currentUserRating > 0}
        />
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
    </div>
  );
};

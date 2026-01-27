import { useState, forwardRef, memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  totalRatings?: number;
  className?: string;
}

export const StarRating = memo(forwardRef<HTMLDivElement, StarRatingProps>(({
  rating = 0,
  onRate,
  readonly = false,
  size = "md",
  showValue = false,
  totalRatings,
  className,
}, ref) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const displayRating = hoverRating || rating;

  return (
    <div ref={ref} className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "star transition-all duration-150",
              !readonly && "hover:scale-125 cursor-pointer",
              readonly && "cursor-default"
            )}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRate?.(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                star <= displayRating
                  ? "fill-star-filled text-star-filled"
                  : "fill-transparent text-star-empty"
              )}
            />
          </button>
        ))}
      </div>
      
      {showValue && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-display font-bold text-primary">
            {rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">/10</span>
          {totalRatings !== undefined && (
            <span className="text-muted-foreground text-xs">
              ({totalRatings.toLocaleString()} ratings)
            </span>
          )}
        </div>
      )}
    </div>
  );
}));

StarRating.displayName = "StarRating";

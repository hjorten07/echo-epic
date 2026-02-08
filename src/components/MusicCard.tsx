import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { LazyImage } from "./LazyImage";
import { cn } from "@/lib/utils";

interface MusicCardProps {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  subtitle?: string;
  className?: string;
  /** Mark as priority to eagerly load images */
  priority?: boolean;
}

/**
 * Optimized music card with:
 * - forwardRef support (fixes React warning)
 * - Memoization to prevent unnecessary re-renders
 * - LazyImage for optimized image loading
 */
export const MusicCard = memo(forwardRef<HTMLAnchorElement, MusicCardProps>(({
  id,
  type,
  name,
  imageUrl,
  rating,
  totalRatings,
  subtitle,
  className,
  priority,
}, ref) => {
  const linkPath = `/${type}/${id}`;

  return (
    <Link
      ref={ref}
      to={linkPath}
      className={cn(
        "group block glass-card rounded-xl overflow-hidden transition-all duration-300",
        "hover:shadow-glow hover:-translate-y-1 hover:border-primary/30",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <LazyImage
              src={imageUrl}
              alt={name}
              className="w-full h-full"
              priority={priority}
              fallback={
                <span className="text-4xl font-display font-bold text-muted-foreground/30">
                  {name[0]?.toUpperCase()}
                </span>
              }
            />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-4xl font-display font-bold text-muted-foreground/30">
              {name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded-full capitalize">
            {type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
        )}
        
        {rating !== undefined && (
          <div className="mt-3">
            <StarRating
              rating={rating}
              readonly
              size="sm"
              showValue
              totalRatings={totalRatings}
            />
          </div>
        )}
      </div>
    </Link>
  );
}));

MusicCard.displayName = "MusicCard";

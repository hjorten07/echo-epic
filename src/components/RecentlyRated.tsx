import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { formatDistanceToNow } from "date-fns";

interface RatingItem {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  imageUrl?: string;
  rating: number;
  ratedBy: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  ratedAt: Date;
}

interface RecentlyRatedProps {
  items: RatingItem[];
}

export const RecentlyRated = ({ items }: RecentlyRatedProps) => {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Recently Rated</h2>
        <Link
          to="/recent"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.ratedBy.id}`}
            className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            {/* Item Image */}
            <Link to={`/${item.type}/${item.id}`} className="shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display font-bold">
                    {item.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs bg-secondary rounded-full capitalize">
                  {item.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(item.ratedAt, { addSuffix: true })}
                </span>
              </div>
              <Link
                to={`/${item.type}/${item.id}`}
                className="font-display font-semibold hover:text-primary transition-colors truncate block"
              >
                {item.name}
              </Link>
              <StarRating rating={item.rating} readonly size="sm" />
            </div>

            {/* User */}
            <Link
              to={`/user/${item.ratedBy.id}`}
              className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary">
                {item.ratedBy.avatarUrl ? (
                  <img
                    src={item.ratedBy.avatarUrl}
                    alt={item.ratedBy.username}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold">
                    {item.ratedBy.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {item.ratedBy.username}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

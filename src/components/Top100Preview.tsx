import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp } from "lucide-react";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";

interface TopItem {
  rank: number;
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  imageUrl?: string;
  rating: number;
  totalRatings: number;
  change?: "up" | "down" | "same";
}

interface Top100PreviewProps {
  items: TopItem[];
  category: "artist" | "album" | "song";
}

export const Top100Preview = ({ items, category }: Top100PreviewProps) => {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold capitalize">Top {category}s</h2>
            <p className="text-sm text-muted-foreground">Based on weighted ratings</p>
          </div>
        </div>
        <Link
          to={`/top100?type=${category}`}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Top 100
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            to={`/${item.type}/${item.id}`}
            className="flex items-center gap-4 p-3 glass-card rounded-xl hover:border-primary/30 transition-all group"
          >
            {/* Rank */}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm",
              item.rank === 1 && "bg-primary text-primary-foreground",
              item.rank === 2 && "bg-muted text-foreground",
              item.rank === 3 && "bg-muted text-foreground",
              item.rank > 3 && "text-muted-foreground"
            )}>
              {item.rank}
            </div>

            {/* Image */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display">
                  {item.name[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <StarRating rating={item.rating} readonly size="sm" showValue totalRatings={item.totalRatings} />
            </div>

            {/* Change Indicator */}
            {item.change && item.change !== "same" && (
              <div className={cn(
                "text-xs font-medium",
                item.change === "up" && "text-green-500",
                item.change === "down" && "text-red-500"
              )}>
                {item.change === "up" ? "↑" : "↓"}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CommunityRatingBreakdownProps {
  itemType: string;
  itemId: string;
  avgRating: number;
  totalRatings: number;
}

export const CommunityRatingBreakdown = ({
  itemType,
  itemId,
  avgRating,
  totalRatings,
}: CommunityRatingBreakdownProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: distribution } = useQuery({
    queryKey: ["rating-distribution", itemType, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("rating")
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) throw error;

      // Calculate distribution
      const counts: Record<number, number> = {};
      for (let i = 1; i <= 10; i++) {
        counts[i] = 0;
      }
      data?.forEach((r) => {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
      });

      return counts;
    },
    enabled: isExpanded && totalRatings > 0,
  });

  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  return (
    <div className="rounded-xl bg-secondary/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-secondary/70 transition-colors"
      >
        <Users className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1 text-left">
          <p className="text-xs text-muted-foreground mb-1">Community</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-primary">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
          </p>
        </div>
        {totalRatings > 0 && (
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        )}
      </button>

      {isExpanded && totalRatings > 0 && distribution && (
        <div className="px-4 pb-4 space-y-2">
          <div className="h-px bg-border mb-3" />
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const percentage = getPercentage(count);
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-right font-medium text-muted-foreground">
                  {star}
                </span>
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      star >= 8
                        ? "bg-green-500"
                        : star >= 5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground">
                  {percentage}%
                </span>
                <span className="w-8 text-right text-xs text-muted-foreground">
                  ({count})
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

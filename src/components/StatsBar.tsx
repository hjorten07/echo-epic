import { Star, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import iconVinyl from "@/assets/icon-vinyl.png";

export const StatsBar = () => {
  const { data: publicStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_stats");
      if (error) {
        console.error("Error fetching public stats:", error);
        return { total_users: 0, total_ratings: 0 };
      }
      return data as { total_users: number; total_ratings: number };
    },
    staleTime: 1000 * 60 * 5,
  });

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="py-8 sm:py-10 md:py-12">
      <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-xs sm:max-w-sm md:max-w-lg mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold">
              {formatCount(publicStats?.total_ratings || 0)}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Ratings</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold">
              {formatCount(publicStats?.total_users || 0)}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Users</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <img src={iconVinyl} alt="" className="w-4 h-4 sm:w-5 sm:h-5 invert opacity-80 flex-shrink-0" width={20} height={20} loading="lazy" />
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold">30M+</span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Tracks</span>
        </div>
      </div>
    </div>
  );
};

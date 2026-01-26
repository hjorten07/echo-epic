import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Rating {
  id: string;
  user_id: string;
  item_type: "artist" | "album" | "song";
  item_id: string;
  item_name: string;
  item_image: string | null;
  item_subtitle: string | null;
  rating: number;
  created_at: string;
}

interface ItemRating {
  item_type: string;
  item_id: string;
  item_name: string;
  item_image: string | null;
  item_subtitle: string | null;
  avg_rating: number;
  total_ratings: number;
}

export const useUserRating = (itemType: string, itemId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-rating", itemType, itemId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (error) throw error;
      return data as Rating | null;
    },
    enabled: !!user,
  });
};

export const useItemRating = (itemType: string, itemId: string) => {
  return useQuery({
    queryKey: ["item-rating", itemType, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_ratings")
        .select("*")
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (error) throw error;
      return data as ItemRating | null;
    },
  });
};

export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (error) throw error;
      return data || { min_ratings_for_ranking: 50, global_avg_rating: 7.0 };
    },
  });
};

export const useTopRatings = (itemType: "artist" | "album" | "song", limit = 100) => {
  return useQuery({
    queryKey: ["top-ratings", itemType, limit],
    queryFn: async () => {
      // First get platform settings for Bayesian calculation
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      const minRatings = settings?.min_ratings_for_ranking || 50;
      const globalAvg = settings?.global_avg_rating || 7.0;

      // Get all items with at least 1 rating
      const { data, error } = await supabase
        .from("item_ratings")
        .select("*")
        .eq("item_type", itemType)
        .gte("total_ratings", 1);

      if (error) {
        console.error("Error fetching top ratings:", error);
        throw error;
      }

      // Apply Bayesian weighted ranking: (v / (v + m)) * R + (m / (v + m)) * C
      // Only include items that meet the minimum ratings threshold
      const itemsWithWeightedScore = (data || [])
        .filter(item => item.total_ratings >= minRatings)
        .map(item => {
          const v = item.total_ratings;
          const R = item.avg_rating;
          const m = minRatings;
          const C = globalAvg;
          const weightedScore = (v / (v + m)) * R + (m / (v + m)) * C;
          return { ...item, weightedScore };
        })
        .sort((a, b) => b.weightedScore - a.weightedScore)
        .slice(0, limit);

      return itemsWithWeightedScore as (ItemRating & { weightedScore: number })[];
    },
  });
};

export const useRecentRatings = (limit = 10) => {
  return useQuery({
    queryKey: ["recent-ratings", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            is_private
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};

export const useRateMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      itemName,
      itemImage,
      itemSubtitle,
      rating,
    }: {
      itemType: "artist" | "album" | "song";
      itemId: string;
      itemName: string;
      itemImage?: string;
      itemSubtitle?: string;
      rating: number;
    }) => {
      if (!user) throw new Error("Must be logged in to rate");

      const { data, error } = await supabase
        .from("ratings")
        .upsert(
          {
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            item_name: itemName,
            item_image: itemImage || null,
            item_subtitle: itemSubtitle || null,
            rating,
          },
          {
            onConflict: "user_id,item_type,item_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-rating", variables.itemType, variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ["item-rating", variables.itemType, variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ["top-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["recent-ratings"] });
    },
  });
};

export const useDeleteRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase.from("ratings").delete().eq("id", ratingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-rating"] });
      queryClient.invalidateQueries({ queryKey: ["item-rating"] });
      queryClient.invalidateQueries({ queryKey: ["top-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["recent-ratings"] });
    },
  });
};

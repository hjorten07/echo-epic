import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number | null;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  displayed: boolean;
  display_order: number | null;
  badge?: Badge;
}

export const useBadges = () => {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("threshold", { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });
};

export const useUserBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badge_id (*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!userId,
  });
};

export const useUserStreak = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-streak", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateDisplayedBadges = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (badgeIds: string[]) => {
      if (!user) throw new Error("Must be logged in");

      // Reset all badges to not displayed
      await supabase
        .from("user_badges")
        .update({ displayed: false, display_order: null })
        .eq("user_id", user.id);

      // Set selected badges as displayed
      for (let i = 0; i < badgeIds.length; i++) {
        await supabase
          .from("user_badges")
          .update({ displayed: true, display_order: i })
          .eq("user_id", user.id)
          .eq("badge_id", badgeIds[i]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", user?.id] });
    },
  });
};

export const useCheckAndAwardBadges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return [];

      // Call edge function to award badges securely
      const { data, error } = await supabase.functions.invoke('award-badges');
      
      if (error) {
        console.error('Error awarding badges:', error);
        throw error;
      }

      return data?.newBadges || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useUpdateStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      // Call edge function to update streak securely
      const { data, error } = await supabase.functions.invoke('update-streak');
      
      if (error) {
        console.error('Error updating streak:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    },
  });
};

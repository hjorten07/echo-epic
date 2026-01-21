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
      if (!user) return;

      // Get user's total ratings
      const { count: totalRatings } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get user's average rating
      const { data: ratings } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id);

      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Get all badges
      const { data: allBadges } = await supabase
        .from("badges")
        .select("*");

      // Get user's current badges
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);

      const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

      const newBadges: string[] = [];

      for (const badge of allBadges || []) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let shouldAward = false;

        if (badge.category === "milestone" && badge.threshold) {
          shouldAward = (totalRatings || 0) >= badge.threshold;
        } else if (badge.category === "behavior") {
          if (badge.name === "Song Critic" && avgRating < 3 && (totalRatings || 0) >= 10) {
            shouldAward = true;
          } else if (badge.name === "Balanced Listener" && avgRating >= 4 && avgRating <= 6 && (totalRatings || 0) >= 10) {
            shouldAward = true;
          } else if (badge.name === "Music Lover" && avgRating >= 7 && avgRating <= 8 && (totalRatings || 0) >= 10) {
            shouldAward = true;
          } else if (badge.name === "Easy to Please" && avgRating > 9 && (totalRatings || 0) >= 10) {
            shouldAward = true;
          }
        }

        if (shouldAward) {
          const { error } = await supabase
            .from("user_badges")
            .insert({ user_id: user.id, badge_id: badge.id });

          if (!error) {
            newBadges.push(badge.name);

            // Create notification
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "badge",
              title: "New Badge Earned!",
              message: `You earned the "${badge.name}" badge: ${badge.description}`,
            });
          }
        }
      }

      return newBadges;
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

      const today = new Date().toISOString().split("T")[0];

      // Get current streak
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!streak) {
        // Create new streak
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
      } else if (streak.last_activity_date !== today) {
        const lastDate = new Date(streak.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let newStreak = 1;
        if (diffDays === 1) {
          newStreak = streak.current_streak + 1;
        }

        const newLongest = Math.max(streak.longest_streak, newStreak);

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        // Check for streak badges
        const { data: streakBadges } = await supabase
          .from("badges")
          .select("*")
          .eq("category", "streak");

        const { data: userBadges } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);

        const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

        for (const badge of streakBadges || []) {
          if (!earnedBadgeIds.has(badge.id) && badge.threshold && newLongest >= badge.threshold) {
            await supabase
              .from("user_badges")
              .insert({ user_id: user.id, badge_id: badge.id });

            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "badge",
              title: "Streak Badge Earned!",
              message: `You earned the "${badge.name}" badge for maintaining a ${badge.threshold}-day streak!`,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    },
  });
};

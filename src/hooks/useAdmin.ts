import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ADMIN_EMAIL = "henrikkraghjort@gmail.com";

export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.email === ADMIN_EMAIL;
};

export const useSiteStats = (days: number = 30) => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ["site-stats", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("site_stats")
        .select("*")
        .gte("stat_date", startDate.toISOString().split("T")[0])
        .order("stat_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useTotalStats = () => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ["total-stats"],
    queryFn: async () => {
      // Get total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total ratings
      const { count: ratingsCount } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true });

      return {
        totalUsers: usersCount || 0,
        totalRatings: ratingsCount || 0,
      };
    },
    enabled: isAdmin,
  });
};

export const useReports = (status?: string) => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ["reports", status],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select(`
          *,
          reporter:reporter_id (username),
          reported_user:reported_user_id (username),
          reported_comment:reported_comment_id (content)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      adminNotes,
    }: {
      reportId: string;
      status: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          admin_notes: adminNotes,
          resolved_at: status !== "pending" ? new Date().toISOString() : null,
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useCreateCustomArtist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      bio,
      imageUrl,
      country,
      type,
      tags,
    }: {
      name: string;
      bio?: string;
      imageUrl?: string;
      country?: string;
      type?: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("custom_artists")
        .insert({
          name,
          bio,
          image_url: imageUrl,
          country,
          type: type || "Artist",
          tags,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-artists"] });
    },
  });
};

export const useCustomArtists = () => {
  return useQuery({
    queryKey: ["custom-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_artists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete user's profile (cascades to ratings, comments, etc.)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["total-stats"] });
    },
  });
};

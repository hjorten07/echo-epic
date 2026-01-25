import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useAdmin";

export const useSuggestions = (status?: string) => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ["suggestions", status],
    queryFn: async () => {
      // First get all suggestions
      let query = supabase
        .from("suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data: suggestions, error } = await query;
      if (error) throw error;
      
      if (!suggestions || suggestions.length === 0) return [];
      
      // Get unique user IDs
      const userIds = [...new Set(suggestions.map(s => s.user_id))];
      
      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      
      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Combine the data
      return suggestions.map(suggestion => ({
        ...suggestion,
        profiles: profileMap.get(suggestion.user_id) || null
      }));
    },
    enabled: isAdmin,
  });
};

export const useUpdateSuggestionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: string;
      admin_notes?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (admin_notes !== undefined) {
        updateData.admin_notes = admin_notes;
      }
      if (status === "resolved" || status === "dismissed") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("suggestions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
};

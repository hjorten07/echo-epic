import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useAdmin";

export const useSuggestions = (status?: string) => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ["suggestions", status],
    queryFn: async () => {
      let query = (supabase as any).from("suggestions")
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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

      const { error } = await (supabase as any).from("suggestions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
};

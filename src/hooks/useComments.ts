import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Comment {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export const useComments = (itemType: string, itemId: string) => {
  return useQuery({
    queryKey: ["comments", itemType, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      content,
      parentId,
    }: {
      itemType: string;
      itemId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to comment");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.itemType, variables.itemId],
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      itemType,
      itemId,
    }: {
      commentId: string;
      itemType: string;
      itemId: string;
    }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.itemType, variables.itemId],
      });
    },
  });
};

export const useReportComment = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      commentId,
      userId,
      reason,
    }: {
      commentId: string;
      userId: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Must be logged in to report");

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_comment_id: commentId,
        reported_user_id: userId,
        reason,
      });

      if (error) throw error;
    },
  });
};

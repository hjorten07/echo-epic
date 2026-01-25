import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useAdmin";
import { toast } from "sonner";

export interface BannedWord {
  id: string;
  word: string;
  created_at: string;
}

export const useBannedWords = () => {
  return useQuery({
    queryKey: ["banned-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_words")
        .select("*")
        .order("word", { ascending: true });

      if (error) throw error;
      return data as BannedWord[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useAddBannedWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      const { error } = await supabase
        .from("banned_words")
        .insert({ word: word.toLowerCase().trim() });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast.success("Word added to filter");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Word already exists in filter");
      } else {
        toast.error("Failed to add word");
      }
    },
  });
};

export const useDeleteBannedWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordId: string) => {
      const { error } = await supabase
        .from("banned_words")
        .delete()
        .eq("id", wordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-words"] });
      toast.success("Word removed from filter");
    },
    onError: () => {
      toast.error("Failed to remove word");
    },
  });
};

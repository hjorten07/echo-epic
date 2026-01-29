import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Wall Posts
export interface WallPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  upvotes: number;
  downvotes: number;
  userVote?: "upvote" | "downvote" | null;
  replyCount?: number;
}

export interface WallPostReply {
  id: string;
  wall_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

// Hot Takes
export interface HotTake {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  upvotes: number;
  downvotes: number;
  userVote?: "upvote" | "downvote" | null;
  replyCount: number;
}

export interface HotTakeReply {
  id: string;
  hot_take_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

// Following Activity
export interface FollowingActivity {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  action_type: "rating" | "comment";
  item_type: string;
  item_id: string;
  item_name: string;
  item_image?: string | null;
  rating?: number;
  created_at: string;
}

// Similar User
export interface SimilarUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  similarity: number;
}

// Leaderboard filters
export type LeaderboardPeriod = "all" | "month" | "week";

export const useWallPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wall-posts"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("wall_posts")
        .select(`
          *,
          profile:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get votes and reply counts for all posts
      const postIds = posts?.map(p => p.id) || [];
      
      const [votesResult, repliesResult] = await Promise.all([
        supabase
          .from("votes")
          .select("*")
          .eq("target_type", "wall_post")
          .in("target_id", postIds),
        supabase
          .from("wall_post_replies" as any)
          .select("wall_post_id")
          .in("wall_post_id", postIds),
      ]);

      // Calculate vote counts and user's vote
      return posts?.map(post => {
        const postVotes = votesResult.data?.filter(v => v.target_id === post.id) || [];
        const upvotes = postVotes.filter(v => v.vote_type === "upvote").length;
        const downvotes = postVotes.filter(v => v.vote_type === "downvote").length;
        const userVote = user ? postVotes.find(v => v.user_id === user.id)?.vote_type : null;
        const replyCount = (repliesResult.data as any[])?.filter((r: any) => r.wall_post_id === post.id).length || 0;
        
        return {
          ...post,
          upvotes,
          downvotes,
          userVote,
          replyCount,
        } as WallPost;
      }) || [];
    },
  });
};

export const useCreateWallPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");

      // Validate against banned words
      const { data: isValid } = await supabase.rpc('validate_message', {
        message_text: content.trim()
      });

      if (!isValid) {
        throw new Error("Content contains inappropriate words");
      }

      const { error } = await supabase.from("wall_posts").insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
      toast.success("Posted to wall!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post");
    },
  });
};

export const useWallPostReplies = (postId: string | undefined) => {
  return useQuery({
    queryKey: ["wall-post-replies", postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from("wall_post_replies" as any)
        .select(`
          *,
          profile:user_id (username, avatar_url)
        `)
        .eq("wall_post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as WallPostReply[];
    },
    enabled: !!postId,
  });
};

export const useCreateWallPostReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { 
      postId: string; 
      content: string; 
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: isValid } = await supabase.rpc('validate_message', {
        message_text: content.trim()
      });

      if (!isValid) {
        throw new Error("Content contains inappropriate words");
      }

      const { error } = await supabase.from("wall_post_replies" as any).insert({
        wall_post_id: postId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["wall-post-replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reply");
    },
  });
};

export const useHotTakes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["hot-takes"],
    queryFn: async () => {
      const { data: takes, error } = await supabase
        .from("hot_takes")
        .select(`
          *,
          profile:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get votes and reply counts
      const takeIds = takes?.map(t => t.id) || [];
      
      const [votesResult, repliesResult] = await Promise.all([
        supabase
          .from("votes")
          .select("*")
          .eq("target_type", "hot_take")
          .in("target_id", takeIds),
        supabase
          .from("hot_take_replies")
          .select("hot_take_id")
          .in("hot_take_id", takeIds),
      ]);

      return takes?.map(take => {
        const takeVotes = votesResult.data?.filter(v => v.target_id === take.id) || [];
        const upvotes = takeVotes.filter(v => v.vote_type === "upvote").length;
        const downvotes = takeVotes.filter(v => v.vote_type === "downvote").length;
        const userVote = user ? takeVotes.find(v => v.user_id === user.id)?.vote_type : null;
        const replyCount = repliesResult.data?.filter(r => r.hot_take_id === take.id).length || 0;

        return {
          ...take,
          upvotes,
          downvotes,
          userVote,
          replyCount,
        } as HotTake;
      }) || [];
    },
  });
};

export const useCreateHotTake = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");

      const { data: isValid } = await supabase.rpc('validate_message', {
        message_text: content.trim()
      });

      if (!isValid) {
        throw new Error("Content contains inappropriate words");
      }

      const { error } = await supabase.from("hot_takes").insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hot-takes"] });
      toast.success("Hot take posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post");
    },
  });
};

export const useHotTakeReplies = (hotTakeId: string | undefined) => {
  return useQuery({
    queryKey: ["hot-take-replies", hotTakeId],
    queryFn: async () => {
      if (!hotTakeId) return [];

      const { data, error } = await supabase
        .from("hot_take_replies")
        .select(`
          *,
          profile:user_id (username, avatar_url)
        `)
        .eq("hot_take_id", hotTakeId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as HotTakeReply[];
    },
    enabled: !!hotTakeId,
  });
};

export const useCreateHotTakeReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ hotTakeId, content, parentId }: { 
      hotTakeId: string; 
      content: string; 
      parentId?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: isValid } = await supabase.rpc('validate_message', {
        message_text: content.trim()
      });

      if (!isValid) {
        throw new Error("Content contains inappropriate words");
      }

      const { error } = await supabase.from("hot_take_replies").insert({
        hot_take_id: hotTakeId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      });

      if (error) throw error;
    },
    onSuccess: (_, { hotTakeId }) => {
      queryClient.invalidateQueries({ queryKey: ["hot-take-replies", hotTakeId] });
      queryClient.invalidateQueries({ queryKey: ["hot-takes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reply");
    },
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      targetType, 
      targetId, 
      voteType 
    }: { 
      targetType: "wall_post" | "hot_take"; 
      targetId: string; 
      voteType: "upvote" | "downvote" | null;
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Delete existing vote
      await supabase
        .from("votes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      // Insert new vote if not null
      if (voteType) {
        const { error } = await supabase.from("votes").insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          vote_type: voteType,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetType }) => {
      if (targetType === "wall_post") {
        queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["hot-takes"] });
      }
    },
  });
};

export const useFollowingActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["following-activity", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get users I follow
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);

      // Get recent ratings from followed users
      const { data: ratings } = await supabase
        .from("ratings")
        .select(`
          id,
          user_id,
          item_type,
          item_id,
          item_name,
          item_image,
          rating,
          created_at
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(20);

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followingIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return ratings?.map(r => ({
        id: r.id,
        user_id: r.user_id,
        username: profileMap.get(r.user_id)?.username || "Unknown",
        avatar_url: profileMap.get(r.user_id)?.avatar_url,
        action_type: "rating" as const,
        item_type: r.item_type,
        item_id: r.item_id,
        item_name: r.item_name,
        item_image: r.item_image,
        rating: r.rating,
        created_at: r.created_at,
      })) || [];
    },
    enabled: !!user,
  });
};

export const useSimilarUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["similar-users", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_similar_users', {
        target_user_id: user.id,
        limit_count: 10,
      });

      if (error) throw error;
      return (data || []).filter((u: SimilarUser) => u.similarity !== null) as SimilarUser[];
    },
    enabled: !!user,
  });
};

export const useLeaderboard = (period: LeaderboardPeriod = "all") => {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      // Get all public profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_private")
        .eq("is_private", false);

      if (!profiles) return [];

      // Calculate date filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (period === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (period === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }

      // For each profile, get ratings
      const leaderboardData: Array<{
        rank: number;
        id: string;
        username: string;
        avatar_url?: string;
        total_ratings: number;
        avg_rating: number;
      }> = [];

      for (const profile of profiles) {
        let query = supabase
          .from("ratings")
          .select("rating", { count: "exact" })
          .eq("user_id", profile.id);

        if (dateFilter) {
          query = query.gte("created_at", dateFilter);
        }

        const { count, data: ratings } = await query;

        if (count && count > 0) {
          const avgRating = ratings ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
          leaderboardData.push({
            rank: 0,
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url || undefined,
            total_ratings: count,
            avg_rating: avgRating,
          });
        }
      }

      // Sort and rank
      leaderboardData.sort((a, b) => b.total_ratings - a.total_ratings);
      leaderboardData.forEach((user, index) => {
        user.rank = index + 1;
      });

      return leaderboardData;
    },
  });
};

export const useReportWallPost = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, userId, content, reason }: {
      postId: string;
      userId: string;
      content: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: userId,
        reason: `Wall post report: "${content.substring(0, 100)}..." - Reason: ${reason}`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted");
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });
};

export const useDeleteWallPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("wall_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
      toast.success("Post deleted");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });
};

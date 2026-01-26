import { Link } from "react-router-dom";
import { Loader2, UserPlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimilarUsers } from "@/hooks/useSocialFeatures";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const SimilarTaste = () => {
  const { user, profile } = useAuth();
  const { data: similarUsers, isLoading } = useSimilarUsers();
  const queryClient = useQueryClient();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  if (!user) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground">Sign in to find users with similar taste</p>
        <Link to="/auth" className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!similarUsers || similarUsers.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Not enough data yet</h3>
        <p className="text-muted-foreground">Rate more music to find users with similar taste!</p>
        <Link to="/search" className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Start Rating
        </Link>
      </div>
    );
  }

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      // Create notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "new_follower",
        title: "New Follower",
        message: `${profile?.username || "Someone"} started following you`,
        related_item_type: "user",
        related_item_id: user.id,
      });

      setFollowingIds(prev => new Set([...prev, targetUserId]));
      toast.success("Followed!");
      queryClient.invalidateQueries({ queryKey: ["similar-users"] });
    } catch (error) {
      toast.error("Failed to follow");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Based on your ratings, these users have similar music taste:
      </p>

      {similarUsers.map((similarUser) => (
        <div key={similarUser.user_id} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Link to={`/user/${similarUser.user_id}`}>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary/30">
                {similarUser.avatar_url ? (
                  <img src={similarUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg">{similarUser.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </Link>

            <div className="flex-1">
              <Link to={`/user/${similarUser.user_id}`} className="font-semibold hover:text-primary">
                {similarUser.username}
              </Link>
              <div className="flex items-center gap-1 mt-1">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="text-sm font-bold text-pink-500">
                  {similarUser.similarity}% similar taste
                </span>
              </div>
            </div>

            {!followingIds.has(similarUser.user_id) && (
              <Button
                size="sm"
                onClick={() => handleFollow(similarUser.user_id)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Follow
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

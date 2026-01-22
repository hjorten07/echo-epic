import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  is_private: boolean;
}

interface FollowersModalProps {
  userId: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
  isProfilePrivate?: boolean;
}

export const FollowersModal = ({ userId, type, isOpen, onClose, isProfilePrivate = false }: FollowersModalProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [canViewList, setCanViewList] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const checkAccessAndFetch = async () => {
      setLoading(true);
      
      // For "following" list on private profiles, check if current user can view
      if (type === "following" && isProfilePrivate && user?.id !== userId) {
        // Check if current user follows this profile
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user?.id || "")
          .eq("following_id", userId)
          .maybeSingle();
        
        if (!followData) {
          setCanViewList(false);
          setLoading(false);
          return;
        }
      }
      
      setCanViewList(true);
      
      try {
        if (type === "followers") {
          // Get people who follow this user - everyone can see followers
          const { data } = await supabase
            .from("follows")
            .select(`
              follower:follower_id (
                id,
                username,
                avatar_url,
                is_private
              )
            `)
            .eq("following_id", userId);
          
          setUsers(data?.map((d: any) => d.follower).filter(Boolean) || []);
        } else {
          // Get people this user follows
          const { data } = await supabase
            .from("follows")
            .select(`
              following:following_id (
                id,
                username,
                avatar_url,
                is_private
              )
            `)
            .eq("follower_id", userId);
          
          setUsers(data?.map((d: any) => d.following).filter(Boolean) || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    };

    checkAccessAndFetch();
  }, [isOpen, userId, type, user?.id, isProfilePrivate]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !canViewList ? (
            <div className="text-center py-12">
              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">This list is private</p>
              <p className="text-sm text-muted-foreground">Follow this user to see who they follow</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {type === "followers" ? "No followers yet" : "Not following anyone"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <Link
                  key={user.id}
                  to={`/user/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg">
                        {user.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.username}</p>
                    {user.is_private && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Private profile
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

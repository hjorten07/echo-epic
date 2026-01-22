import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { BadgesSection } from "@/components/BadgesSection";
import { FollowersModal } from "@/components/FollowersModal";
import { AllRatingsModal } from "@/components/AllRatingsModal";
import { FollowRequestsSection } from "@/components/FollowRequestsSection";
import { Loader2, Calendar, Edit2, Check, X, Users, Plus, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProfileData {
  id: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  is_private: boolean;
  created_at: string;
}

interface UserRating {
  id: string;
  item_type: "artist" | "album" | "song";
  item_id: string;
  item_name: string;
  item_image: string | null;
  rating: number;
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, loading: authLoading, updateProfile } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"song" | "album" | "artist">("song");
  const [stats, setStats] = useState({ total: 0, avg: 0, high: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [allRatingsModalOpen, setAllRatingsModalOpen] = useState(false);
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [isMutualFollower, setIsMutualFollower] = useState(false);

  const isOwnProfile = user?.id === userId || (!userId && !!user);
  const displayUserId = userId || user?.id;

  useEffect(() => {
    if (!displayUserId && !authLoading && !user) {
      return;
    }

    if (displayUserId) {
      fetchProfileData(displayUserId);
    }
  }, [displayUserId, authLoading, user]);

  const fetchProfileData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError || !profile) {
        setProfileData(null);
        setLoading(false);
        return;
      }

      setProfileData(profile);
      setEditBio(profile.bio || "");

      // Check if current user can view this profile
      const isOwn = user?.id === id;
      const isPublic = !profile.is_private;
      
      // Check if following (for private profiles)
      let following = false;
      if (user && user.id !== id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .maybeSingle();
        following = !!followData;
        setIsFollowing(following);
        
        // Check for pending request
        if (!following && profile.is_private) {
          const { data: requestData } = await supabase
            .from("follow_requests")
            .select("id")
            .eq("requester_id", user.id)
            .eq("target_id", id)
            .eq("status", "pending")
            .maybeSingle();
          setHasPendingRequest(!!requestData);
        }
        
        // Check if mutual followers (for messaging)
        if (following) {
          const { data: reverseFollow } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", id)
            .eq("following_id", user.id)
            .maybeSingle();
          setIsMutualFollower(!!reverseFollow);
        }
      }

      const viewable = isOwn || isPublic || following;
      setCanViewProfile(viewable);

      if (viewable) {
        // Fetch ratings
        const { data: ratings } = await supabase
          .from("ratings")
          .select("*")
          .eq("user_id", id)
          .order("rating", { ascending: false });

        if (ratings) {
          setUserRatings(ratings as UserRating[]);
          
          const total = ratings.length;
          const avg = total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
          const high = ratings.filter(r => r.rating >= 8).length;
          setStats({ total, avg, high });
        }
      }

      // Fetch follow counts
      const [followersResult, followingResult] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      ]);
      setFollowersCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    setLoading(false);
  };

  const handleSaveBio = async () => {
    if (editBio.split(/\s+/).length > 200) {
      return;
    }
    await updateProfile({ bio: editBio });
    setProfileData(prev => prev ? { ...prev, bio: editBio } : null);
    setIsEditing(false);
  };

  const handleFollow = async () => {
    if (!user || !displayUserId) return;

    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", user.id)
        .eq("following_id", displayUserId);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else if (profileData?.is_private) {
      // Send follow request for private profiles
      if (hasPendingRequest) {
        // Cancel request
        await supabase.from("follow_requests").delete()
          .eq("requester_id", user.id)
          .eq("target_id", displayUserId);
        setHasPendingRequest(false);
      } else {
        await supabase.from("follow_requests").insert({
          requester_id: user.id,
          target_id: displayUserId,
        });
        setHasPendingRequest(true);
        
        // Create notification for target user
        await supabase.from("notifications").insert({
          user_id: displayUserId,
          type: "follow_request",
          title: "New Follow Request",
          message: `${currentUserProfile?.username || "Someone"} wants to follow you`,
          related_item_type: "user",
          related_item_id: user.id,
        });
      }
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: displayUserId,
      });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      
      // Create notification
      await supabase.from("notifications").insert({
        user_id: displayUserId,
        type: "new_follower",
        title: "New Follower",
        message: `${currentUserProfile?.username || "Someone"} started following you`,
        related_item_type: "user",
        related_item_id: user.id,
      });
    }
  };

  const filteredRatings = userRatings.filter(r => r.item_type === selectedCategory).slice(0, 10);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!displayUserId || (!user && !userId)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to view your profile</h1>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to start rating music and building your profile.
            </p>
            <Link
              to="/auth"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In / Sign Up
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="font-display text-3xl font-bold mb-4">User not found</h1>
            <p className="text-muted-foreground mb-6">
              This user doesn't exist or their profile is private.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-full ring-4 ring-primary/30 bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center overflow-hidden">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt={profileData.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-display font-bold text-primary-foreground">
                    {profileData.username[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{profileData.username}</h1>
                  {profileData.is_private && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(profileData.created_at), "MMMM yyyy")}</span>
                </div>
                
                {/* Bio */}
                {canViewProfile && (
                  <div className="mt-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="What music are you into?"
                          className="resize-none"
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleSaveBio}>
                            <Check className="w-4 h-4 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {editBio.split(/\s+/).filter(Boolean).length}/200 words
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <p className="text-muted-foreground">
                          {profileData.bio || (isOwnProfile ? `What music are you into, ${profileData.username}?` : "No bio yet")}
                        </p>
                        {isOwnProfile && (
                          <button onClick={() => setIsEditing(true)} className="text-primary hover:text-primary/80">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Private profile message */}
                {!canViewProfile && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">This profile is private</p>
                    <p className="text-sm text-muted-foreground">Follow this user to see their ratings</p>
                  </div>
                )}

                {/* Follow button & counts */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setFollowersModalOpen(true)}
                    className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{followersCount}</span>
                    <span className="text-muted-foreground">followers</span>
                  </button>
                  <button
                    onClick={() => setFollowingModalOpen(true)}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-muted-foreground"> following</span>
                  </button>
                  {!isOwnProfile && user && (
                    <>
                      <Button
                        size="sm"
                        variant={isFollowing ? "secondary" : hasPendingRequest ? "outline" : "default"}
                        onClick={handleFollow}
                      >
                        {isFollowing ? "Unfollow" : hasPendingRequest ? "Requested" : profileData.is_private ? "Request" : "Follow"}
                      </Button>
                      {/* Message button - only show if mutual followers or public profile */}
                      {(isMutualFollower || (!profileData.is_private && isFollowing)) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/messages/${displayUserId}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Follow Requests Section - only on own profile */}
            {isOwnProfile && <FollowRequestsSection />}

            {canViewProfile && (
              <>
                {/* Top 10 Ratings */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold">Top 10 Rated</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {(["song", "album", "artist"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1 text-sm rounded-lg transition-colors capitalize",
                              selectedCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {cat}s
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setAllRatingsModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        All Ratings
                      </button>
                    </div>
                  </div>
                  
                  {filteredRatings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No {selectedCategory} ratings yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredRatings.map((rating, index) => (
                        <Link
                          key={rating.id}
                          to={`/${rating.item_type}/${rating.item_id}`}
                          className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <span className="w-6 text-center font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {rating.item_image ? (
                              <img src={rating.item_image} alt={rating.item_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold">{rating.item_name[0]}</span>
                            )}
                          </div>
                          <span className="flex-1 font-medium truncate">{rating.item_name}</span>
                          <StarRating rating={rating.rating} readonly size="sm" showValue />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-display font-bold">{stats.avg.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-display font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Ratings</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-display font-bold">{stats.high}</p>
                    <p className="text-sm text-muted-foreground">High Ratings (8+)</p>
                  </div>
                </div>

                {/* Badges */}
                <BadgesSection userId={displayUserId} canView={canViewProfile} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <FollowersModal
        userId={displayUserId}
        type="followers"
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        isProfilePrivate={profileData?.is_private}
      />
      <FollowersModal
        userId={displayUserId}
        type="following"
        isOpen={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        isProfilePrivate={profileData?.is_private}
      />
      {isOwnProfile && displayUserId && (
        <AllRatingsModal
          userId={displayUserId}
          isOpen={allRatingsModalOpen}
          onClose={() => setAllRatingsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Profile;

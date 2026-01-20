import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/Badge";
import { Loader2, Calendar, Edit2, Check, X, Users } from "lucide-react";
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
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile = user?.id === userId || (!userId && !!user);
  const displayUserId = userId || user?.id;

  useEffect(() => {
    if (!displayUserId && !authLoading && !user) {
      // Not logged in and no userId in URL
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

      // Fetch ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", id)
        .order("rating", { ascending: false });

      if (ratings) {
        setUserRatings(ratings as UserRating[]);
        
        // Calculate stats
        const total = ratings.length;
        const avg = total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
        const high = ratings.filter(r => r.rating >= 8).length;
        setStats({ total, avg, high });
      }

      // Fetch follow counts
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      ]);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      // Check if current user is following this profile
      if (user && user.id !== id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
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
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: displayUserId,
      });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const filteredRatings = userRatings.filter(r => r.item_type === selectedCategory).slice(0, 10);

  const getBadges = (): ("10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings")[] => {
    const badges: ("10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings")[] = [];
    if (stats.total >= 10) badges.push("10_ratings");
    if (stats.total >= 50) badges.push("50_ratings");
    if (stats.total >= 100) badges.push("100_ratings");
    if (stats.total >= 1000) badges.push("1000_ratings");
    if (stats.total >= 10000) badges.push("10000_ratings");
    return badges;
  };

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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt={profileData.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-display font-bold text-primary-foreground">
                    {profileData.username[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold">{profileData.username}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(profileData.created_at), "MMMM yyyy")}</span>
                </div>
                
                {/* Bio */}
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

                {/* Follow button & counts */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{followersCount}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-muted-foreground"> following</span>
                  </div>
                  {!isOwnProfile && user && (
                    <Button
                      size="sm"
                      variant={isFollowing ? "secondary" : "default"}
                      onClick={handleFollow}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Top 10 Ratings */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold">Top 10 Rated</h2>
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
            {getBadges().length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {getBadges().map((badge) => (
                    <Badge key={badge} type={badge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;

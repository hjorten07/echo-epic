import { useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Calendar, ChevronRight, Star, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "./Badge";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TopRatedItem {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  imageUrl?: string;
  rating: number;
}

interface UserProfileCardProps {
  username: string;
  avatarUrl?: string;
  bio?: string;
  joinedAt: Date;
  isOwnProfile?: boolean;
  totalRatings: number;
  averageRating: number;
  highRatingsCount: number;
  favoriteGenres: string[];
  badges: ("10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings")[];
  topRated: TopRatedItem[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  onFollow?: () => void;
  onEditBio?: (bio: string) => void;
}

export const UserProfileCard = ({
  username,
  avatarUrl,
  bio,
  joinedAt,
  isOwnProfile = false,
  totalRatings,
  averageRating,
  highRatingsCount,
  favoriteGenres,
  badges,
  topRated,
  followersCount,
  followingCount,
  isFollowing,
  onFollow,
  onEditBio,
}: UserProfileCardProps) => {
  const [topCategory, setTopCategory] = useState<"song" | "album" | "artist">("song");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || "");

  const defaultBio = isOwnProfile
    ? `What Music are you into, ${username}?`
    : "No bio yet";

  const filteredTopRated = topRated.filter((item) => item.type === topCategory).slice(0, 10);

  const handleSaveBio = () => {
    onEditBio?.(editedBio);
    setIsEditingBio(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-secondary border-4 border-primary/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-4xl font-display font-bold">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-3xl font-bold mb-2">{username}</h1>
            
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(joinedAt, "MMMM yyyy")}</span>
            </div>

            {/* Bio */}
            <div className="relative mb-4">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value.slice(0, 200))}
                    className="w-full p-3 rounded-lg bg-secondary border border-border text-sm resize-none"
                    rows={3}
                    placeholder="Write something about yourself..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{editedBio.length}/200</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingBio(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveBio}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-muted-foreground">{bio || defaultBio}</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="shrink-0 p-1 rounded hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Genres */}
            {favoriteGenres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {favoriteGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Follow Stats & Button */}
            <div className="flex items-center gap-4">
              <div className="flex gap-4 text-sm">
                <span>
                  <strong>{followersCount.toLocaleString()}</strong> followers
                </span>
                <span>
                  <strong>{followingCount.toLocaleString()}</strong> following
                </span>
              </div>
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={onFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Top 10</h2>
          <div className="flex gap-2">
            {(["song", "album", "artist"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setTopCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                  topCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                )}
              >
                {cat}s
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTopRated.length > 0 ? (
            filteredTopRated.map((item, index) => (
              <Link
                key={item.id}
                to={`/${item.type}/${item.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <span className="w-6 font-display font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {item.name[0]}
                    </div>
                  )}
                </div>
                <span className="flex-1 font-medium truncate">{item.name}</span>
                <StarRating rating={item.rating} readonly size="sm" />
              </Link>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No ratings yet. Start rating to build your Top 10!
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{averageRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{totalRatings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Ratings</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{highRatingsCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">High Ratings (8+)</p>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-xl font-bold mb-6">Badges</h2>
        <div className="flex flex-wrap gap-6 justify-center">
          {(["10_ratings", "50_ratings", "100_ratings", "1000_ratings", "10000_ratings"] as const).map(
            (badge) => (
              <Badge key={badge} type={badge} earned={badges.includes(badge)} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

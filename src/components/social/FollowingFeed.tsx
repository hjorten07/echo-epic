import { Link } from "react-router-dom";
import { Loader2, Star, Music, Disc, User } from "lucide-react";
import { useFollowingActivity } from "@/hooks/useSocialFeatures";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export const FollowingFeed = () => {
  const { user } = useAuth();
  const { data: activity, isLoading } = useFollowingActivity();

  if (!user) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground">Sign in to see what people you follow are up to</p>
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

  if (!activity || activity.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No activity yet</h3>
        <p className="text-muted-foreground">Follow more users to see their activity here</p>
        <Link to="/social" className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Find People
        </Link>
      </div>
    );
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "song": return <Music className="w-4 h-4" />;
      case "album": return <Disc className="w-4 h-4" />;
      case "artist": return <User className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getItemLink = (type: string, id: string) => {
    switch (type) {
      case "song": return `/song/${id}`;
      case "album": return `/album/${id}`;
      case "artist": return `/artist/${id}`;
      default: return "/";
    }
  };

  return (
    <div className="space-y-4">
      {activity.map((item) => (
        <div key={item.id} className="glass-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Link to={`/user/${item.user_id}`}>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold">{item.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <Link to={`/user/${item.user_id}`} className="font-semibold hover:text-primary">
                  {item.username}
                </Link>
                <span className="text-muted-foreground">rated</span>
                <Link 
                  to={getItemLink(item.item_type, item.item_id)} 
                  className="font-medium hover:text-primary flex items-center gap-1"
                >
                  {getItemIcon(item.item_type)}
                  {item.item_name}
                </Link>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="font-bold text-primary">{item.rating}/10</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            </div>

            {item.item_image && (
              <Link to={getItemLink(item.item_type, item.item_id)}>
                <img 
                  src={item.item_image} 
                  alt={item.item_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

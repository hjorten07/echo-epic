import { Link } from "react-router-dom";
import { Trophy, Loader2, Info } from "lucide-react";
import { useLeaderboard, type LeaderboardPeriod } from "@/hooks/useSocialFeatures";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  period: LeaderboardPeriod;
}

export const Leaderboard = ({ period }: LeaderboardProps) => {
  const { data: leaderboard, isLoading } = useLeaderboard(period);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-display text-xl font-semibold mb-2">No ratings yet</h2>
        <p className="text-muted-foreground">
          Be the first to rate music and claim the top spot!
        </p>
        <Link
          to="/search"
          className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Rating
        </Link>
      </div>
    );
  }

  // Top 3 Podium
  if (leaderboard.length >= 3) {
    return (
      <>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-8">
            <Link
              to={`/user/${leaderboard[1].id}`}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-2xl font-bold text-white">
                2
              </div>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center font-display font-bold overflow-hidden">
                {leaderboard[1].avatar_url ? (
                  <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  leaderboard[1].username[0]?.toUpperCase()
                )}
              </div>
              <p className="font-semibold truncate">{leaderboard[1].username}</p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[1].total_ratings.toLocaleString()} ratings
              </p>
            </Link>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <Link
              to={`/user/${leaderboard[0].id}`}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full shadow-glow"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-white animate-pulse-glow">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center font-display font-bold text-primary-foreground text-xl overflow-hidden">
                {leaderboard[0].avatar_url ? (
                  <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  leaderboard[0].username[0]?.toUpperCase()
                )}
              </div>
              <p className="font-semibold truncate">{leaderboard[0].username}</p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[0].total_ratings.toLocaleString()} ratings
              </p>
            </Link>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-12">
            <Link
              to={`/user/${leaderboard[2].id}`}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xl font-bold text-white">
                3
              </div>
              <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center font-display font-bold overflow-hidden">
                {leaderboard[2].avatar_url ? (
                  <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  leaderboard[2].username[0]?.toUpperCase()
                )}
              </div>
              <p className="font-semibold truncate">{leaderboard[2].username}</p>
              <p className="text-sm text-muted-foreground">
                {leaderboard[2].total_ratings.toLocaleString()} ratings
              </p>
            </Link>
          </div>
        </div>

        {/* Rest of Leaderboard */}
        {leaderboard.length > 3 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            {leaderboard.slice(3).map((user) => (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
              >
                <span className="w-8 font-display font-bold text-muted-foreground">
                  {user.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.username[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Avg rating: {user.avg_rating.toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-primary">
                    {user.total_ratings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">ratings</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // Less than 3 users
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {leaderboard.map((user) => (
        <Link
          key={user.id}
          to={`/user/${user.id}`}
          className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
        >
          <span className="w-8 font-display font-bold text-muted-foreground">
            {user.rank}
          </span>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.username[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              Avg rating: {user.avg_rating.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-primary">
              {user.total_ratings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">ratings</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

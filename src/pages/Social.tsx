import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trophy, Users, TrendingUp, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  avatar_url?: string;
  total_ratings: number;
  avg_rating: number;
}

const Social = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "search">("leaderboard");

  // Fetch leaderboard from database
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Get profiles with their rating counts
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          is_private
        `)
        .eq("is_private", false);

      if (error) throw error;

      // For each profile, get their ratings count
      const leaderboardData: LeaderboardUser[] = [];
      
      for (const profile of profiles || []) {
        const { count, data: ratings } = await supabase
          .from("ratings")
          .select("rating", { count: "exact" })
          .eq("user_id", profile.id);

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

      // Sort by total ratings and assign ranks
      leaderboardData.sort((a, b) => b.total_ratings - a.total_ratings);
      leaderboardData.forEach((user, index) => {
        user.rank = index + 1;
      });

      return leaderboardData;
    },
  });

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_private")
        .eq("is_private", false)
        .ilike("username", `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  const displayedUsers = activeTab === "search" && searchQuery ? searchResults : leaderboard;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">Social</h1>
            <p className="text-muted-foreground">
              Connect with other music lovers and see who's rating the most
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                activeTab === "leaderboard"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              )}
            >
              <Trophy className="w-5 h-5" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                activeTab === "search"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              )}
            >
              <Users className="w-5 h-5" />
              Find Users
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 bg-secondary/50 border-border/50"
            />
          </div>

          {isLoading || searchLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeTab === "leaderboard" ? (
            <div className="space-y-4">
              {leaderboard && leaderboard.length >= 3 ? (
                <>
                  {/* Top 3 Podium */}
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
              ) : leaderboard && leaderboard.length > 0 ? (
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
              ) : (
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
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              {searchResults && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/user/${user.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-lg overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.username[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))
              ) : searchQuery ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Enter a username to search</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Social;

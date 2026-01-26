import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trophy, Users, TrendingUp, Loader2, Lock, Info, MessageSquare, Flame, Activity, Heart, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SocialWall } from "@/components/social/SocialWall";
import { HotTakes } from "@/components/social/HotTakes";
import { FollowingFeed } from "@/components/social/FollowingFeed";
import { SimilarTaste } from "@/components/social/SimilarTaste";
import { Leaderboard } from "@/components/social/Leaderboard";
import type { LeaderboardPeriod } from "@/hooks/useSocialFeatures";

type SocialTab = "leaderboard" | "wall" | "hot-takes" | "following" | "similar" | "search";

const Social = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SocialTab>("leaderboard");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all");

  // Search users - show ALL users including private ones
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_private")
        .ilike("username", `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  const tabs = [
    { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
    { id: "wall" as const, label: "Wall", icon: MessageSquare },
    { id: "hot-takes" as const, label: "Hot Takes", icon: Flame },
    { id: "following" as const, label: "Following", icon: Activity },
    { id: "similar" as const, label: "Similar Taste", icon: Heart },
    { id: "search" as const, label: "Find Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold mb-4">Social</h1>
            <p className="text-muted-foreground">
              Connect with other music lovers
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard Period Filter */}
          {activeTab === "leaderboard" && (
            <div className="mb-6">
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-primary/10 border border-primary/20">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The leaderboard displays users ranked by how many ratings they've submitted.
                </p>
              </div>
              
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-2">Filter:</span>
                {(["all", "month", "week"] as LeaderboardPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-lg transition-colors capitalize",
                      leaderboardPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {period === "all" ? "All Time" : period === "month" ? "This Month" : "This Week"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar - only show for search tab */}
          {activeTab === "search" && (
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
          )}

          {/* Tab Content */}
          {activeTab === "leaderboard" && (
            <Leaderboard period={leaderboardPeriod} />
          )}

          {activeTab === "wall" && <SocialWall />}

          {activeTab === "hot-takes" && <HotTakes />}

          {activeTab === "following" && <FollowingFeed />}

          {activeTab === "similar" && <SimilarTaste />}

          {activeTab === "search" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {searchLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((searchUser) => (
                  <Link
                    key={searchUser.id}
                    to={`/user/${searchUser.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-lg overflow-hidden">
                      {searchUser.avatar_url ? (
                        <img src={searchUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        searchUser.username[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{searchUser.username}</p>
                        {searchUser.is_private && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {searchUser.is_private && (
                        <p className="text-xs text-muted-foreground">Private profile</p>
                      )}
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

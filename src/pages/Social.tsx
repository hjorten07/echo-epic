import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trophy, Users, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  avatarUrl?: string;
  totalRatings: number;
  averageRating: number;
}

const mockLeaderboard: LeaderboardUser[] = [
  { rank: 1, id: "u1", username: "MusicMaster", totalRatings: 12847, averageRating: 7.8 },
  { rank: 2, id: "u2", username: "SoundExplorer", totalRatings: 11234, averageRating: 8.1 },
  { rank: 3, id: "u3", username: "RhythmKing", totalRatings: 10456, averageRating: 7.5 },
  { rank: 4, id: "u4", username: "MelodyQueen", totalRatings: 9876, averageRating: 8.3 },
  { rank: 5, id: "u5", username: "BeatDropper", totalRatings: 8543, averageRating: 7.9 },
  { rank: 6, id: "u6", username: "VinylCollector", totalRatings: 7654, averageRating: 8.0 },
  { rank: 7, id: "u7", username: "TuneTaster", totalRatings: 6789, averageRating: 7.7 },
  { rank: 8, id: "u8", username: "AudioPhile", totalRatings: 5432, averageRating: 8.5 },
  { rank: 9, id: "u9", username: "NoteNinja", totalRatings: 4567, averageRating: 7.6 },
  { rank: 10, id: "u10", username: "ChordChaser", totalRatings: 3456, averageRating: 8.2 },
];

const Social = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "search">("leaderboard");

  const filteredUsers = mockLeaderboard.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn username="MusicLover42" />
      
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

          {/* Leaderboard */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center pt-8">
                  <Link
                    to={`/user/${mockLeaderboard[1].id}`}
                    className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-2xl font-bold text-white">
                      2
                    </div>
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center font-display font-bold">
                      {mockLeaderboard[1].username[0]}
                    </div>
                    <p className="font-semibold truncate">{mockLeaderboard[1].username}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockLeaderboard[1].totalRatings.toLocaleString()} ratings
                    </p>
                  </Link>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <Link
                    to={`/user/${mockLeaderboard[0].id}`}
                    className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full shadow-glow"
                  >
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-white animate-pulse-glow">
                      <Trophy className="w-10 h-10" />
                    </div>
                    <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center font-display font-bold text-primary-foreground text-xl">
                      {mockLeaderboard[0].username[0]}
                    </div>
                    <p className="font-semibold truncate">{mockLeaderboard[0].username}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockLeaderboard[0].totalRatings.toLocaleString()} ratings
                    </p>
                  </Link>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center pt-12">
                  <Link
                    to={`/user/${mockLeaderboard[2].id}`}
                    className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors w-full"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xl font-bold text-white">
                      3
                    </div>
                    <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center font-display font-bold">
                      {mockLeaderboard[2].username[0]}
                    </div>
                    <p className="font-semibold truncate">{mockLeaderboard[2].username}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockLeaderboard[2].totalRatings.toLocaleString()} ratings
                    </p>
                  </Link>
                </div>
              </div>

              {/* Rest of Leaderboard */}
              <div className="glass-card rounded-2xl overflow-hidden">
                {filteredUsers.slice(3).map((user) => (
                  <Link
                    key={user.id}
                    to={`/user/${user.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <span className="w-8 font-display font-bold text-muted-foreground">
                      {user.rank}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold">
                      {user.username[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg rating: {user.averageRating.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-primary">
                        {user.totalRatings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">ratings</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {activeTab === "search" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Link
                    key={user.id}
                    to={`/user/${user.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-lg">
                      {user.username[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{user.totalRatings.toLocaleString()} ratings</span>
                        <span>Avg: {user.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found</p>
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

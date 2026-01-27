import { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Music2, Loader2, Sparkles, TrendingUp, Users, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  getTopRecordings,
  getTopArtists,
  getTopReleaseGroups,
  getSimilarArtists,
  getSimilarRecordings,
} from "@/lib/listenbrainz";
import { getCoverArt, getRecording } from "@/lib/musicbrainz";
import { cn } from "@/lib/utils";

type RecommendationType = "forYou" | "trending" | "topArtists" | "topAlbums";

const Recommendations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<RecommendationType>("forYou");

  // Fetch user's highly rated items for personalized recommendations
  const { data: userRatings } = useQuery({
    queryKey: ["user-ratings-for-recs", user?.id],
    queryFn: async () => {
      if (!user) return { artists: [], songs: [] };
      
      // Get top rated artists
      const { data: artists } = await supabase
        .from("ratings")
        .select("item_id, item_name, rating")
        .eq("user_id", user.id)
        .eq("item_type", "artist")
        .gte("rating", 7)
        .order("rating", { ascending: false })
        .limit(5);
      
      // Get top rated songs
      const { data: songs } = await supabase
        .from("ratings")
        .select("item_id, item_name, rating")
        .eq("user_id", user.id)
        .eq("item_type", "song")
        .gte("rating", 7)
        .order("rating", { ascending: false })
        .limit(5);
      
      return { 
        artists: artists || [], 
        songs: songs || [] 
      };
    },
    enabled: !!user,
  });

  // Fetch personalized recommendations based on user's favorite artists AND songs
  const { data: personalizedRecs, isLoading: personalizedLoading, refetch: refetchPersonalized } = useQuery({
    queryKey: ["personalized-recs-v2", userRatings],
    queryFn: async () => {
      if (!userRatings || (userRatings.artists.length === 0 && userRatings.songs.length === 0)) {
        // Fallback to trending if no user data
        return getTopRecordings("week", 20);
      }

      const recommendations: { 
        recording_mbid: string; 
        recording_name: string; 
        artist_name: string; 
        score: number;
        source: string;
      }[] = [];
      
      // Get similar artists for user's favorite artists
      for (const rating of userRatings.artists.slice(0, 3)) {
        if (!rating.item_id.startsWith("custom_")) {
          try {
            const similar = await getSimilarArtists(rating.item_id, 4);
            similar.forEach((a) => {
              recommendations.push({
                recording_mbid: a.artist_mbid,
                recording_name: a.artist_name,
                artist_name: `Similar to ${rating.item_name}`,
                score: a.score,
                source: "artist",
              });
            });
          } catch (e) {
            console.log("Error fetching similar artists:", e);
          }
        }
      }

      // Get similar songs for user's favorite songs
      for (const rating of userRatings.songs.slice(0, 3)) {
        if (!rating.item_id.startsWith("custom_")) {
          try {
            const similar = await getSimilarRecordings(rating.item_id, 4);
            similar.forEach((r) => {
              recommendations.push({
                recording_mbid: r.recording_mbid,
                recording_name: r.recording_name || "Unknown",
                artist_name: r.artist_name || `Similar to ${rating.item_name}`,
                score: r.score || 0,
                source: "song",
              });
            });
          } catch (e) {
            console.log("Error fetching similar songs:", e);
          }
        }
      }
      
      // Remove duplicates and shuffle
      const uniqueRecs = recommendations.reduce((acc, rec) => {
        if (!acc.find(r => r.recording_mbid === rec.recording_mbid)) {
          acc.push(rec);
        }
        return acc;
      }, [] as typeof recommendations);

      // Shuffle and return top 20
      const shuffled = uniqueRecs.sort(() => Math.random() - 0.5);
      
      if (shuffled.length === 0) {
        // Fallback to trending
        return getTopRecordings("week", 20);
      }
      
      return shuffled.slice(0, 20);
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes - shorter for freshness
  });

  // Fetch trending songs from ListenBrainz
  const { data: trendingSongs, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-songs"],
    queryFn: () => getTopRecordings("week", 20),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch top artists from ListenBrainz
  const { data: topArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ["top-artists-lb"],
    queryFn: () => getTopArtists("month", 20),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch top albums from ListenBrainz
  const { data: topAlbums, isLoading: albumsLoading } = useQuery({
    queryKey: ["top-albums-lb"],
    queryFn: async () => {
      const albums = await getTopReleaseGroups("month", 20);
      
      // Fetch cover art for albums
      const albumsWithCovers = await Promise.all(
        albums.map(async (album) => {
          const cover = album.release_group_mbid 
            ? await getCoverArt(album.release_group_mbid)
            : null;
          return { ...album, cover };
        })
      );
      
      return albumsWithCovers;
    },
    staleTime: 1000 * 60 * 10,
  });

  const tabs = [
    { id: "forYou" as const, label: "For You", icon: Sparkles },
    { id: "trending" as const, label: "Trending", icon: TrendingUp },
    { id: "topArtists" as const, label: "Top Artists", icon: Users },
    { id: "topAlbums" as const, label: "Top Albums", icon: Disc3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "forYou":
        if (personalizedLoading) {
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!user) {
          return (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Personalized Recommendations
              </h3>
              <p className="text-muted-foreground mb-4">
                Sign in and rate some music to get personalized recommendations!
              </p>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </div>
          );
        }

        const hasUserData = userRatings && (userRatings.artists.length > 0 || userRatings.songs.length > 0);
        
        return (
          <div className="space-y-4">
            {hasUserData && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Based on your {userRatings.artists.length} favorite artist{userRatings.artists.length !== 1 ? 's' : ''} and {userRatings.songs.length} favorite song{userRatings.songs.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchPersonalized()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            )}
            {!hasUserData && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Rate some artists and songs to get personalized recommendations! Showing trending music for now.
              </p>
            )}
            <div className="space-y-3">
              {personalizedRecs?.map((rec: any, index: number) => {
                // Determine link based on source type
                const linkPath = rec.source === "artist" 
                  ? `/artist/${rec.recording_mbid}`
                  : `/song/${rec.recording_mbid}`;
                
                return (
                  <Link
                    key={rec.recording_mbid || index}
                    to={linkPath}
                    className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/30 transition-all"
                  >
                    <span className={cn(
                      "w-8 text-center font-bold",
                      index < 3 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Music2 className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rec.recording_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{rec.artist_name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      case "trending":
        if (trendingLoading) {
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {trendingSongs?.map((rec, index) => (
              <Link
                key={rec.recording_mbid || index}
                to={`/song/${rec.recording_mbid}`}
                className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/30 transition-all"
              >
                <span className={cn(
                  "w-8 text-center font-bold",
                  index < 3 ? "text-primary" : "text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Music2 className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{rec.recording_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{rec.artist_name}</p>
                </div>
                {rec.score && (
                  <span className="text-xs text-muted-foreground">
                    {rec.score.toLocaleString()} plays
                  </span>
                )}
              </Link>
            ))}
          </div>
        );

      case "topArtists":
        if (artistsLoading) {
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {topArtists?.map((artist, index) => (
              <Link
                key={artist.artist_mbid || index}
                to={artist.artist_mbid ? `/artist/${artist.artist_mbid}` : "#"}
                className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/30 transition-all"
              >
                <span className={cn(
                  "w-8 text-center font-bold",
                  index < 3 ? "text-primary" : "text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="font-bold text-muted-foreground">
                    {artist.artist_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{artist.artist_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {artist.listen_count.toLocaleString()} plays this month
                  </p>
                </div>
              </Link>
            ))}
          </div>
        );

      case "topAlbums":
        if (albumsLoading) {
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            {topAlbums?.map((album, index) => (
              <Link
                key={album.release_group_mbid || index}
                to={album.release_group_mbid ? `/album/${album.release_group_mbid}` : "#"}
                className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/30 transition-all"
              >
                <span className={cn(
                  "w-8 text-center font-bold",
                  index < 3 ? "text-primary" : "text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                  {album.cover ? (
                    <img
                      src={album.cover}
                      alt={album.release_group_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{album.release_group_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{album.artist_name}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {album.listen_count.toLocaleString()} plays
                </span>
              </Link>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold mb-2">Recommendations</h1>
            <p className="text-muted-foreground">
              Discover new music based on what's trending and your taste
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by ListenBrainz
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Recommendations;

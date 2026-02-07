import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ThisOrThat } from "@/components/ThisOrThat";
import { HigherLowerGame } from "@/components/HigherLowerGame";
import { MusicCard } from "@/components/MusicCard";
import { StarRating } from "@/components/StarRating";
import { SoundWaveAnimation } from "@/components/SoundWaveAnimation";
import { GridWaveEffect } from "@/components/GridWaveEffect";
import { LazyImage } from "@/components/LazyImage";
import { Loader2 } from "lucide-react";
import { useRecentRatings } from "@/hooks/useRatings";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const games = ["thisOrThat", "higherLower"] as const;

const Index = () => {
  const [randomGame] = useState(() => games[Math.floor(Math.random() * games.length)]);
  
  const { data: recentRatings, isLoading: recentLoading } = useRecentRatings(8);

  // Fetch recently rated music with high ratings (8+)
  const { data: discoverMusic, isLoading: discoverLoading } = useQuery({
    queryKey: ["discover-music-highly-rated"],
    queryFn: async () => {
      const { data: highlyRated } = await supabase
        .from("ratings")
        .select("item_id, item_type, item_name, item_image, item_subtitle, rating, created_at")
        .gte("rating", 8)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (!highlyRated || highlyRated.length === 0) return [];
      
      // Deduplicate by item_id and take first 4
      const seen = new Set<string>();
      const unique = highlyRated.filter(item => {
        if (seen.has(item.item_id)) return false;
        seen.add(item.item_id);
        return true;
      }).slice(0, 4);
      
      return unique.map(item => ({
        id: item.item_id,
        name: item.item_name,
        type: item.item_type as "song" | "album" | "artist",
        imageUrl: item.item_image?.replace("http://", "https://") || undefined,
        subtitle: item.item_subtitle || undefined,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-background relative">
      {/* Grid wave effect background - covers hero through games section */}
      <div className="absolute inset-x-0 top-0 h-[1100px] overflow-hidden pointer-events-none z-0">
        <GridWaveEffect />
      </div>
      
      <Navbar />
      
      <main className="pt-16 relative z-10">
        <HeroSection />
        
        <div className="container mx-auto px-4 pb-20">
          {/* Sound Wave Animation */}
          <div className="relative mb-8 py-4">
            <SoundWaveAnimation />
          </div>
          
          {/* Random Game */}
          <div className="mb-12">
            {randomGame === "thisOrThat" ? <ThisOrThat /> : <HigherLowerGame />}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Discover */}
              <section>
                <h2 className="font-display text-2xl font-bold mb-6">Discover Music</h2>
                {discoverLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : discoverMusic && discoverMusic.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {discoverMusic.map((item, index) => (
                      <MusicCard
                        key={`${item.type}-${item.id}`}
                        {...item}
                        priority={index < 2}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">Use the search to find music!</p>
                  </div>
                )}
              </section>

              {/* Recently Rated */}
              <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Recently Rated</h2>
                </div>
                {recentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : recentRatings && recentRatings.length > 0 ? (
                  <div className="space-y-3">
                    {recentRatings.map((rating: any) => (
                      <Link
                        key={rating.id}
                        to={`/${rating.item_type}/${rating.item_id}`}
                        className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/30 transition-all"
                      >
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {rating.item_image ? (
                            <LazyImage
                              src={rating.item_image}
                              alt={rating.item_name}
                              className="w-full h-full"
                              priority
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg font-bold text-muted-foreground">
                                {rating.item_name[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{rating.item_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Rated by{" "}
                            <span className="text-primary">{rating.profiles?.username || "Unknown"}</span>
                            {" · "}
                            {format(new Date(rating.created_at), "MMM d")}
                          </p>
                        </div>
                        <StarRating rating={rating.rating} readonly size="sm" showValue />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">
                      No ratings yet. Be the first to rate something!
                    </p>
                    <Link
                      to="/search"
                      className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Start Rating
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Links */}
              <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Explore</h2>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/top100"
                    className="flex items-center gap-3 p-4 rounded-lg glass-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <p className="font-medium">Top 100</p>
                      <p className="text-xs text-muted-foreground">Best rated music</p>
                    </div>
                  </Link>
                  <Link
                    to="/recommendations"
                    className="flex items-center gap-3 p-4 rounded-lg glass-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <p className="font-medium">For You</p>
                      <p className="text-xs text-muted-foreground">Personalized picks</p>
                    </div>
                  </Link>
                  <Link
                    to="/games"
                    className="flex items-center gap-3 p-4 rounded-lg glass-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xl">🎮</span>
                    </div>
                    <div>
                      <p className="font-medium">Games</p>
                      <p className="text-xs text-muted-foreground">Fun music challenges</p>
                    </div>
                  </Link>
                  <Link
                    to="/social"
                    className="flex items-center gap-3 p-4 rounded-lg glass-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                    <div>
                      <p className="font-medium">Social</p>
                      <p className="text-xs text-muted-foreground">Connect with others</p>
                    </div>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Remelic. All rights reserved.</p>
          <p className="mt-2">
            Powered by MusicBrainz (CC0), Cover Art Archive (CC0) &amp; ListenBrainz
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ThisOrThat } from "@/components/ThisOrThat";
import { MusicCard } from "@/components/MusicCard";
import { StarRating } from "@/components/StarRating";
import { Loader2 } from "lucide-react";
import { useRecentRatings, useTopRatings } from "@/hooks/useRatings";
import { useQuery } from "@tanstack/react-query";
import { searchAll } from "@/lib/musicbrainz";
import { format } from "date-fns";

const Index = () => {
  const { data: recentRatings, isLoading: recentLoading } = useRecentRatings(8);
  const { data: topAlbums, isLoading: topLoading } = useTopRatings("album", 5);

  // Fetch some music to discover
  const { data: discoverMusic, isLoading: discoverLoading } = useQuery({
    queryKey: ["discover-music"],
    queryFn: () => searchAll("popular", 4),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        <HeroSection />
        
        <div className="container mx-auto px-4 pb-20">
          {/* This or That Game */}
          <div className="mb-12">
            <ThisOrThat />
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
                    {discoverMusic.map((item) => (
                      <MusicCard
                        key={`${item.type}-${item.id}`}
                        {...item}
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
                            <img
                              src={rating.item_image}
                              alt={rating.item_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
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
              {/* Top Albums Preview */}
              <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Top Albums</h2>
                  <Link
                    to="/top100"
                    className="text-sm text-primary hover:underline"
                  >
                    View Top 100
                  </Link>
                </div>
                {topLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : topAlbums && topAlbums.length > 0 ? (
                  <div className="space-y-2">
                    {topAlbums.map((item, index) => (
                      <Link
                        key={`${item.item_type}-${item.item_id}`}
                        to={`/${item.item_type}/${item.item_id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                          {item.item_image ? (
                            <img
                              src={item.item_image}
                              alt={item.item_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs font-bold">{item.item_name[0]}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.item_name}</p>
                          {item.item_subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{item.item_subtitle}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {Number(item.avg_rating).toFixed(1)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      Top 100 will populate as users rate music.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 RateTheMusic. All rights reserved.</p>
          <p className="mt-2">
            Powered by MusicBrainz, Wikipedia &amp; Wikipedia Commons
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

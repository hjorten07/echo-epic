import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ThisOrThat } from "@/components/ThisOrThat";
import { MusicCard } from "@/components/MusicCard";
import { Loader2 } from "lucide-react";
import { searchAll, SearchResult } from "@/lib/musicbrainz";

const Index = () => {
  const [trendingMusic, setTrendingMusic] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      // Fetch some popular artists/albums to showcase
      const results = await searchAll("taylor swift", 4);
      setTrendingMusic(results);
      setLoading(false);
    };

    fetchTrending();
  }, []);

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
              {/* Trending */}
              <section>
                <h2 className="font-display text-2xl font-bold mb-6">Discover Music</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {trendingMusic.map((item) => (
                      <MusicCard
                        key={`${item.type}-${item.id}`}
                        {...item}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Recently Rated placeholder */}
              <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Recently Rated</h2>
                </div>
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
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Top 100 Preview placeholder */}
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
                <div className="glass-card rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Top 100 will populate as users rate music.
                  </p>
                </div>
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

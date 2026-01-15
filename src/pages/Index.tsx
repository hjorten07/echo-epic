import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { RecentlyRated } from "@/components/RecentlyRated";
import { ThisOrThat } from "@/components/ThisOrThat";
import { Top100Preview } from "@/components/Top100Preview";
import { MusicCard } from "@/components/MusicCard";

// Mock data for demonstration
const recentlyRated = [
  {
    id: "1",
    type: "album" as const,
    name: "Abbey Road",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
    rating: 9,
    ratedBy: { id: "u1", username: "MusicFan42" },
    ratedAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "2",
    type: "song" as const,
    name: "Bohemian Rhapsody",
    rating: 10,
    ratedBy: { id: "u2", username: "RockLover" },
    ratedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "3",
    type: "artist" as const,
    name: "Kendrick Lamar",
    rating: 9,
    ratedBy: { id: "u3", username: "HipHopHead" },
    ratedAt: new Date(Date.now() - 1000 * 60 * 45),
  },
];

const topAlbums = [
  { rank: 1, id: "a1", type: "album" as const, name: "To Pimp a Butterfly", rating: 9.4, totalRatings: 15420, change: "same" as const },
  { rank: 2, id: "a2", type: "album" as const, name: "OK Computer", rating: 9.3, totalRatings: 12890, change: "up" as const },
  { rank: 3, id: "a3", type: "album" as const, name: "The Dark Side of the Moon", rating: 9.2, totalRatings: 18540, change: "down" as const },
  { rank: 4, id: "a4", type: "album" as const, name: "Abbey Road", rating: 9.1, totalRatings: 16780, change: "same" as const },
  { rank: 5, id: "a5", type: "album" as const, name: "Blonde", rating: 9.0, totalRatings: 11230, change: "up" as const },
];

const trendingMusic = [
  { id: "t1", type: "artist" as const, name: "Taylor Swift", rating: 8.7, totalRatings: 45000 },
  { id: "t2", type: "album" as const, name: "SOS", subtitle: "SZA", rating: 8.9, totalRatings: 8900 },
  { id: "t3", type: "song" as const, name: "Vampire", subtitle: "Olivia Rodrigo", rating: 8.5, totalRatings: 12000 },
  { id: "t4", type: "artist" as const, name: "Tyler, the Creator", rating: 8.8, totalRatings: 32000 },
];

const Index = () => {
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
                <h2 className="font-display text-2xl font-bold mb-6">Trending Now</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {trendingMusic.map((item) => (
                    <MusicCard
                      key={item.id}
                      {...item}
                    />
                  ))}
                </div>
              </section>

              {/* Recently Rated */}
              <RecentlyRated items={recentlyRated} />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <Top100Preview items={topAlbums} category="album" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 RateTheMusic. All rights reserved.</p>
          <p className="mt-2">
            Powered by MusicBrainz, Wikipedia & Wikipedia Commons
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

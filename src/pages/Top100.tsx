import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TrendingUp, Music2, Disc3, Mic2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MusicCard } from "@/components/MusicCard";
import { cn } from "@/lib/utils";

type Category = "song" | "album" | "artist";

interface TopItem {
  id: string;
  type: Category;
  name: string;
  imageUrl?: string;
  rating: number;
  totalRatings: number;
  subtitle?: string;
}

const mockData: Record<Category, TopItem[]> = {
  song: Array.from({ length: 20 }, (_, i) => ({
    id: `song-${i + 1}`,
    type: "song" as const,
    name: ["Bohemian Rhapsody", "Stairway to Heaven", "Hotel California", "Imagine", "Smells Like Teen Spirit", "Hey Jude", "Like a Rolling Stone", "Purple Haze", "What's Going On", "Respect"][i % 10],
    subtitle: ["Queen", "Led Zeppelin", "Eagles", "John Lennon", "Nirvana", "The Beatles", "Bob Dylan", "Jimi Hendrix", "Marvin Gaye", "Aretha Franklin"][i % 10],
    rating: 9.8 - (i * 0.05),
    totalRatings: 50000 - (i * 1000),
  })),
  album: Array.from({ length: 20 }, (_, i) => ({
    id: `album-${i + 1}`,
    type: "album" as const,
    name: ["To Pimp a Butterfly", "OK Computer", "Abbey Road", "The Dark Side of the Moon", "Blonde", "Nevermind", "Thriller", "Purple Rain", "Kind of Blue", "Rumours"][i % 10],
    subtitle: ["Kendrick Lamar", "Radiohead", "The Beatles", "Pink Floyd", "Frank Ocean", "Nirvana", "Michael Jackson", "Prince", "Miles Davis", "Fleetwood Mac"][i % 10],
    rating: 9.5 - (i * 0.04),
    totalRatings: 45000 - (i * 900),
  })),
  artist: Array.from({ length: 20 }, (_, i) => ({
    id: `artist-${i + 1}`,
    type: "artist" as const,
    name: ["The Beatles", "Pink Floyd", "Led Zeppelin", "Queen", "Kendrick Lamar", "Radiohead", "David Bowie", "Prince", "Stevie Wonder", "Miles Davis"][i % 10],
    rating: 9.4 - (i * 0.03),
    totalRatings: 60000 - (i * 1200),
  })),
};

const Top100 = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get("type") as Category) || "album";
  const [category, setCategory] = useState<Category>(initialCategory);

  const categories = [
    { value: "song" as const, label: "Songs", icon: Music2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
  ];

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSearchParams({ type: cat });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">Top 100</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The highest-rated music according to RateTheMusic users. Rankings are weighted by total ratings.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  category === cat.value
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <cat.icon className="w-5 h-5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockData[category].map((item, index) => (
              <div key={item.id} className="relative">
                {/* Rank Badge */}
                <div className={cn(
                  "absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-lg",
                  index === 0 && "bg-gradient-to-br from-yellow-400 to-amber-600 text-white",
                  index === 1 && "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
                  index === 2 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
                  index > 2 && "bg-secondary text-foreground"
                )}>
                  {index + 1}
                </div>
                
                <MusicCard
                  id={item.id}
                  type={item.type}
                  name={item.name}
                  imageUrl={item.imageUrl}
                  rating={item.rating}
                  totalRatings={item.totalRatings}
                  subtitle={item.subtitle}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Top100;

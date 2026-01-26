import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TrendingUp, Music2, Disc3, Mic2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MusicCard } from "@/components/MusicCard";
import { cn } from "@/lib/utils";
import { useTopRatings } from "@/hooks/useRatings";

type Category = "song" | "album" | "artist";

const Top100 = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get("type") as Category) || "song";
  const [category, setCategory] = useState<Category>(initialCategory);

  const { data: topItems, isLoading } = useTopRatings(category, 100);

  // Order: Albums, Songs, Artists (Songs in middle)
  const categories = [
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "song" as const, label: "Songs", icon: Music2 },
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !topItems || topItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="glass-card rounded-xl p-8 max-w-md mx-auto">
                <h2 className="font-display text-xl font-semibold mb-2">No ratings yet</h2>
                <p className="text-muted-foreground mb-4">
                  Be the first to rate {category}s and help build the Top 100!
                </p>
                <Link
                  to="/search"
                  className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Rating
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {topItems.map((item, index) => (
                <div key={`${item.item_type}-${item.item_id}`} className="relative">
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
                    id={item.item_id}
                    type={item.item_type as "artist" | "album" | "song"}
                    name={item.item_name}
                    imageUrl={item.item_image || undefined}
                    rating={Number(item.avg_rating)}
                    totalRatings={Number(item.total_ratings)}
                    subtitle={item.item_subtitle || undefined}
                  />
                  
                  {/* Weighted Score Display */}
                  {'weightedScore' in item && (
                    <div className="mt-1 text-center text-xs text-muted-foreground">
                      Weighted: {item.weightedScore.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Top100;

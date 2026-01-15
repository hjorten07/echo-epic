import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Music2, Disc3, Mic2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MusicCard } from "@/components/MusicCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchType = "all" | "artist" | "album" | "song";

interface SearchResult {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  subtitle?: string;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const types = [
    { value: "all" as const, label: "All", icon: SearchIcon },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "song" as const, label: "Songs", icon: Music2 },
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const mockResults: SearchResult[] = [
        { id: "1", type: "artist" as const, name: "The Beatles", rating: 9.2, totalRatings: 45000 },
        { id: "2", type: "album" as const, name: "Abbey Road", subtitle: "The Beatles", rating: 9.5, totalRatings: 32000 },
        { id: "3", type: "song" as const, name: "Here Comes The Sun", subtitle: "The Beatles", rating: 9.3, totalRatings: 28000 },
        { id: "4", type: "artist" as const, name: "Queen", rating: 9.1, totalRatings: 41000 },
        { id: "5", type: "album" as const, name: "A Night at the Opera", subtitle: "Queen", rating: 9.4, totalRatings: 29000 },
        { id: "6", type: "song" as const, name: "Bohemian Rhapsody", subtitle: "Queen", rating: 9.8, totalRatings: 55000 },
      ].filter((item) => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(mockResults);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = activeType === "all" 
    ? results 
    : results.filter((r) => r.type === activeType);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl font-bold text-center mb-8">Search Music</h1>
            
            <form onSubmit={handleSearch}>
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for artists, albums, or songs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 py-6 text-lg bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
            </form>

            <div className="flex justify-center gap-2 mt-6">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setActiveType(type.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    activeType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : query && filteredResults.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResults.map((result) => (
                <MusicCard key={`${result.type}-${result.id}`} {...result} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
                <SearchIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">Start searching</h2>
              <p className="text-muted-foreground">Find your favorite artists, albums, and songs to rate</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;

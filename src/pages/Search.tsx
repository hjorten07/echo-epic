import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Music2, Disc3, Mic2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MusicCard } from "@/components/MusicCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  searchAll,
  searchArtists,
  searchAlbums,
  searchSongs,
  SearchResult,
} from "@/lib/musicbrainz";

type SearchType = "all" | "artist" | "album" | "song";

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

  const performSearch = useCallback(async (searchQuery: string, type: SearchType) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      let searchResults: SearchResult[];
      
      switch (type) {
        case "artist":
          searchResults = await searchArtists(searchQuery, 20);
          break;
        case "album":
          searchResults = await searchAlbums(searchQuery, 20);
          break;
        case "song":
          searchResults = await searchSongs(searchQuery, 20);
          break;
        default:
          searchResults = await searchAll(searchQuery, 8);
      }
      
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeType);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, activeType, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      performSearch(query, activeType);
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
          ) : query && results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((result) => (
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

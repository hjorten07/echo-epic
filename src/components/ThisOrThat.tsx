import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music2, Disc3, Mic2, Shuffle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { searchAll, SearchResult, getCoverArt } from "@/lib/musicbrainz";
import { useRateMutation } from "@/hooks/useRatings";
import { toast } from "sonner";

interface ThisOrThatProps {
  isLoggedIn?: boolean;
  onPlay?: () => void;
}

export const ThisOrThat = ({ isLoggedIn = false, onPlay }: ThisOrThatProps) => {
  const [selectedType, setSelectedType] = useState<"song" | "album" | "artist">("song");
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [options, setOptions] = useState<(SearchResult & { coverUrl?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const rateMutation = useRateMutation();

  const types = [
    { value: "song" as const, label: "Songs", icon: Music2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
  ];

  const searchTerms = ["love", "life", "heart", "night", "summer", "dream", "fire", "star", "dance", "happy"];

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const results = await searchAll(randomTerm, 20);
      
      // Filter by type
      const filteredResults = results.filter(r => r.type === selectedType);
      
      if (filteredResults.length >= 2) {
        // Pick two random items
        const shuffled = filteredResults.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        // Fetch cover art for albums
        if (selectedType === "album") {
          const withCovers = await Promise.all(
            selected.map(async (item) => {
              const coverUrl = await getCoverArt(item.id);
              return { ...item, coverUrl };
            })
          );
          setOptions(withCovers);
        } else {
          setOptions(selected);
        }
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
    setLoading(false);
  };

  const handlePlay = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsPlaying(true);
    fetchOptions();
  };

  const handleChoice = async (choice: SearchResult & { coverUrl?: string }) => {
    if (!user) return;

    try {
      await rateMutation.mutateAsync({
        itemType: choice.type,
        itemId: choice.id,
        itemName: choice.name,
        itemImage: choice.coverUrl,
        itemSubtitle: choice.subtitle,
        rating: 8, // High rating for chosen item
      });
      toast.success(`Great choice! You picked ${choice.name}`);
      setRound(r => r + 1);
      fetchOptions();
    } catch (error) {
      toast.error("Failed to save choice");
    }
  };

  const handleSkip = () => {
    fetchOptions();
  };

  return (
    <section 
      className="relative glass-card rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className={cn(
        "absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500",
        isHovered && "opacity-100"
      )} />

      <div className="relative p-6 md:p-8">
        {!isPlaying ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Side */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse-glow">
                    <Shuffle className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">This or That?</h2>
                    <p className="text-muted-foreground text-sm">Choose your favorite!</p>
                  </div>
                </div>

                {/* Game Description */}
                <div className="glass-card rounded-lg p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">How it works:</strong> We'll show you two random {selectedType}s.
                    Pick your favorite to rate it and build your taste profile. The more you play, the better 
                    recommendations you'll get!
                  </p>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2">
                  {types.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                        selectedType === type.value
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

              {/* Play Button */}
              <Button
                size="lg"
                onClick={handlePlay}
                className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                <Shuffle className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                {user ? "Play Now" : "Sign Up to Play"}
              </Button>
            </div>

            {/* Preview Cards */}
            <div className="mt-6 flex gap-4">
              <div className="flex-1 h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Option A</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-display font-bold text-primary">VS</span>
              </div>
              <div className="flex-1 h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Option B</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Playing State */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">This or That?</h2>
                  <p className="text-sm text-muted-foreground">Round {round + 1} • {selectedType}s</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsPlaying(false)}
                className="text-muted-foreground"
              >
                Exit Game
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : options.length >= 2 ? (
              <div className="flex gap-4 items-stretch">
                {/* Option A */}
                <button
                  onClick={() => handleChoice(options[0])}
                  className="flex-1 glass-card rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
                    {options[0].coverUrl ? (
                      <img
                        src={options[0].coverUrl}
                        alt={options[0].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-muted-foreground/30">
                        {options[0].name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                    {options[0].name}
                  </h3>
                  {options[0].subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{options[0].subtitle}</p>
                  )}
                </button>

                {/* VS */}
                <div className="flex items-center px-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-primary">VS</span>
                  </div>
                </div>

                {/* Option B */}
                <button
                  onClick={() => handleChoice(options[1])}
                  className="flex-1 glass-card rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
                    {options[1].coverUrl ? (
                      <img
                        src={options[1].coverUrl}
                        alt={options[1].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-muted-foreground/30">
                        {options[1].name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                    {options[1].name}
                  </h3>
                  {options[1].subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{options[1].subtitle}</p>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No options found. Try again!</p>
                <Button onClick={fetchOptions}>Retry</Button>
              </div>
            )}

            {/* Skip Button */}
            {!loading && options.length >= 2 && (
              <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                  Skip this one
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

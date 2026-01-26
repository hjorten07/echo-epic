import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { Music2, Disc3, Mic2, Shuffle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { searchAll, SearchResult, getCoverArt, getRecording } from "@/lib/musicbrainz";
import { useRateMutation } from "@/hooks/useRatings";
import { toast } from "sonner";
import { coverArtCache, recordingReleaseCache } from "@/lib/coverArtCache";

// Stable type definitions outside component to prevent recreation
const TYPES = [
  { value: "song" as const, label: "Songs", icon: Music2 },
  { value: "album" as const, label: "Albums", icon: Disc3 },
  { value: "artist" as const, label: "Artists", icon: Mic2 },
] as const;

const SEARCH_TERMS = ["love", "life", "heart", "night", "summer", "dream", "fire", "star", "dance", "happy"] as const;

interface ThisOrThatProps {
  isLoggedIn?: boolean;
  onPlay?: () => void;
}

// Optimized cover art fetcher with caching
const fetchCoverForItem = async (item: SearchResult): Promise<SearchResult & { coverUrl?: string }> => {
  if (item.type === "album") {
    const cacheKey = `album_${item.id}`;
    let coverUrl = coverArtCache.get(cacheKey);
    
    if (coverUrl === undefined) {
      coverUrl = await getCoverArt(item.id);
      coverArtCache.set(cacheKey, coverUrl);
    }
    
    return { ...item, coverUrl: coverUrl || undefined };
  } else if (item.type === "song") {
    const songCacheKey = `song_${item.id}`;
    let coverUrl = coverArtCache.get(songCacheKey);
    
    if (coverUrl !== undefined) {
      return { ...item, coverUrl: coverUrl || undefined };
    }

    try {
      // Check recording cache first
      let releaseInfo = recordingReleaseCache.get(item.id);
      
      if (releaseInfo === undefined) {
        const recording = await getRecording(item.id);
        if (recording?.releases?.[0]) {
          const release = recording.releases[0];
          const releaseGroupId = release["release-group"]?.id;
          if (releaseGroupId) {
            releaseInfo = { releaseGroupId, releaseId: release.id };
          }
        }
        recordingReleaseCache.set(item.id, releaseInfo || null);
      }

      if (releaseInfo) {
        coverUrl = await getCoverArt(releaseInfo.releaseGroupId, releaseInfo.releaseId);
        coverArtCache.set(songCacheKey, coverUrl);
        return { ...item, coverUrl: coverUrl || undefined };
      }
    } catch {
      // Ignore errors
    }
    
    coverArtCache.set(songCacheKey, null);
  }
  
  return item;
};

export const ThisOrThat = memo(({ isLoggedIn = false, onPlay }: ThisOrThatProps) => {
  const [selectedType, setSelectedType] = useState<"song" | "album" | "artist">("song");
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [options, setOptions] = useState<(SearchResult & { coverUrl?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const [chosenItem, setChosenItem] = useState<(SearchResult & { coverUrl?: string }) | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const rateMutation = useRateMutation();
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const randomTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
      const results = await searchAll(randomTerm, 20);
      
      // Filter by type
      const filteredResults = results.filter(r => r.type === selectedType);
      
      if (filteredResults.length >= 2 && mountedRef.current) {
        // Pick two random items
        const shuffled = filteredResults.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        // Fetch cover art in parallel with caching
        const withCovers = await Promise.all(selected.map(fetchCoverForItem));
        if (mountedRef.current) {
          setOptions(withCovers);
        }
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
    if (mountedRef.current) {
      setLoading(false);
    }
  }, [selectedType]);

  const handlePlay = useCallback(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsPlaying(true);
    fetchOptions();
  }, [user, navigate, fetchOptions]);

  const handleChoice = useCallback((choice: SearchResult & { coverUrl?: string }) => {
    if (!user) return;
    setChosenItem(choice);
    setShowRatingPrompt(true);
    toast.success(`Great choice! You picked ${choice.name}`);
  }, [user]);

  const handleRateChoice = useCallback(async (rating: number) => {
    if (!user || !chosenItem) return;

    try {
      await rateMutation.mutateAsync({
        itemType: chosenItem.type,
        itemId: chosenItem.id,
        itemName: chosenItem.name,
        itemImage: chosenItem.coverUrl,
        itemSubtitle: chosenItem.subtitle,
        rating,
      });
      toast.success(`Rated ${chosenItem.name} ${rating}/10!`);
    } catch (error) {
      toast.error("Failed to save rating");
    }
    setShowRatingPrompt(false);
    setChosenItem(null);
    setRound(r => r + 1);
    fetchOptions();
  }, [user, chosenItem, rateMutation, fetchOptions]);

  const handleSkipRating = useCallback(() => {
    setShowRatingPrompt(false);
    setChosenItem(null);
    setRound(r => r + 1);
    fetchOptions();
  }, [fetchOptions]);

  const handleSkip = useCallback(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleExitGame = useCallback(() => setIsPlaying(false), []);
  const handleTypeSelect = useCallback((type: "song" | "album" | "artist") => setSelectedType(type), []);

  return (
    <section 
      className="relative glass-card rounded-2xl overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
                  {TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleTypeSelect(type.value)}
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
                onClick={handleExitGame}
                className="text-muted-foreground"
              >
                Exit Game
              </Button>
            </div>

            {showRatingPrompt && chosenItem ? (
              /* Rating Prompt after Choice */
              <div className="text-center py-8">
                <div className="w-24 h-24 rounded-xl bg-secondary overflow-hidden mx-auto mb-4">
                  {chosenItem.coverUrl ? (
                    <img
                      src={chosenItem.coverUrl}
                      alt={chosenItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-muted-foreground/30">
                      {chosenItem.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="font-display text-xl font-semibold mb-1">{chosenItem.name}</h3>
                {chosenItem.subtitle && (
                  <p className="text-sm text-muted-foreground mb-4">{chosenItem.subtitle}</p>
                )}
                <p className="text-sm text-muted-foreground mb-4">Would you like to rate it?</p>
                <div className="flex justify-center mb-4">
                  <StarRating onRate={handleRateChoice} size="lg" />
                </div>
                <Button variant="ghost" onClick={handleSkipRating} className="text-muted-foreground">
                  Skip rating
                </Button>
              </div>
            ) : loading ? (
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
            {!loading && !showRatingPrompt && options.length >= 2 && (
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
});

ThisOrThat.displayName = "ThisOrThat";

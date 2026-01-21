import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Loader2, Trophy, Music2, Disc3, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { searchAll, SearchResult, getCoverArt } from "@/lib/musicbrainz";
import { useItemRating } from "@/hooks/useRatings";
import { toast } from "sonner";

interface ItemWithRating extends SearchResult {
  coverUrl?: string;
  rating?: number;
}

export const HigherLowerGame = () => {
  const [selectedType, setSelectedType] = useState<"song" | "album" | "artist">("song");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState<ItemWithRating | null>(null);
  const [nextItem, setNextItem] = useState<ItemWithRating | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const types = [
    { value: "song" as const, label: "Songs", icon: Music2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
  ];

  const searchTerms = ["love", "life", "heart", "night", "summer", "dream", "fire", "star", "dance", "happy", "world", "day"];

  const fetchRandomItem = async (): Promise<ItemWithRating | null> => {
    try {
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const results = await searchAll(randomTerm, 20);
      const filtered = results.filter(r => r.type === selectedType);
      
      if (filtered.length === 0) return null;
      
      const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
      
      let coverUrl: string | undefined;
      if (selectedType === "album") {
        coverUrl = await getCoverArt(randomItem.id) || undefined;
      }
      
      // Generate a random "community rating" for demo purposes
      // In production, this would come from actual ratings
      const rating = Math.round((Math.random() * 4 + 5) * 10) / 10; // 5.0 - 9.0
      
      return { ...randomItem, coverUrl, rating };
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  };

  const startGame = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setLoading(true);
    
    const first = await fetchRandomItem();
    const second = await fetchRandomItem();
    
    if (first && second) {
      setCurrentItem(first);
      setNextItem(second);
    }
    
    setLoading(false);
  };

  const handleGuess = async (guessHigher: boolean) => {
    if (!currentItem || !nextItem || showResult) return;

    const currentRating = currentItem.rating || 0;
    const nextRating = nextItem.rating || 0;
    
    const correct = guessHigher 
      ? nextRating >= currentRating 
      : nextRating <= currentRating;
    
    setIsCorrect(correct);
    setShowResult(true);

    setTimeout(async () => {
      if (correct) {
        const newScore = score + 1;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
        }
        
        setCurrentItem(nextItem);
        setLoading(true);
        const newNext = await fetchRandomItem();
        setNextItem(newNext);
        setLoading(false);
        setShowResult(false);
      } else {
        setGameOver(true);
        toast.error(`Game Over! Final score: ${score}`);
      }
    }, 1500);
  };

  if (!isPlaying) {
    return (
      <section className="glass-card rounded-2xl overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <ArrowUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Higher or Lower?</h2>
                <p className="text-muted-foreground text-sm">Guess the rating!</p>
              </div>
            </div>

            <div className="glass-card rounded-lg p-4 bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> We'll show you two {selectedType}s.
                Guess if the next one has a higher or lower community rating. 
                Keep your streak going as long as you can!
              </p>
            </div>

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

          <Button
            size="lg"
            onClick={startGame}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            {user ? "Play Now" : "Sign Up to Play"}
          </Button>
        </div>
      </section>
    );
  }

  if (loading || !currentItem || !nextItem) {
    return (
      <section className="glass-card rounded-2xl overflow-hidden p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (gameOver) {
    return (
      <section className="glass-card rounded-2xl overflow-hidden p-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h2 className="font-display text-2xl font-bold mb-2">Game Over!</h2>
        <p className="text-muted-foreground mb-4">
          You scored <span className="text-primary font-bold">{score}</span> points
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          High Score: {highScore}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={startGame}>Play Again</Button>
          <Button variant="outline" onClick={() => setIsPlaying(false)}>
            Exit
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-2xl overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Higher or Lower?</h2>
            <p className="text-sm text-muted-foreground">Score: {score} | High: {highScore}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setIsPlaying(false)}>
          Exit Game
        </Button>
      </div>

      <div className="flex gap-4 items-stretch">
        {/* Current Item */}
        <div className="flex-1 glass-card rounded-xl p-4 text-center">
          <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
            {currentItem.coverUrl ? (
              <img
                src={currentItem.coverUrl}
                alt={currentItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-muted-foreground/30">
                {currentItem.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="font-display font-semibold truncate">{currentItem.name}</h3>
          {currentItem.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{currentItem.subtitle}</p>
          )}
          <p className="text-2xl font-bold text-primary mt-2">
            {currentItem.rating?.toFixed(1)}
          </p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center gap-3">
          <span className="text-xl font-display font-bold text-primary">VS</span>
          {!showResult && (
            <>
              <Button
                size="sm"
                onClick={() => handleGuess(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowUp className="w-4 h-4 mr-1" /> Higher
              </Button>
              <Button
                size="sm"
                onClick={() => handleGuess(false)}
                className="bg-red-600 hover:bg-red-700"
              >
                <ArrowDown className="w-4 h-4 mr-1" /> Lower
              </Button>
            </>
          )}
        </div>

        {/* Next Item */}
        <div className={cn(
          "flex-1 glass-card rounded-xl p-4 text-center transition-all",
          showResult && (isCorrect ? "border-green-500" : "border-red-500")
        )}>
          <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
            {nextItem.coverUrl ? (
              <img
                src={nextItem.coverUrl}
                alt={nextItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-muted-foreground/30">
                {nextItem.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="font-display font-semibold truncate">{nextItem.name}</h3>
          {nextItem.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{nextItem.subtitle}</p>
          )}
          {showResult && (
            <p className={cn(
              "text-2xl font-bold mt-2",
              isCorrect ? "text-green-500" : "text-red-500"
            )}>
              {nextItem.rating?.toFixed(1)}
            </p>
          )}
          {!showResult && (
            <p className="text-2xl font-bold text-muted-foreground mt-2">?</p>
          )}
        </div>
      </div>
    </section>
  );
};

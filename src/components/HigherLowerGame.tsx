import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Loader2, Trophy, Music2, Disc3, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RatingItemImage } from "@/components/RatingItemImage";

interface RatedItem {
  item_id: string;
  item_name: string;
  item_image: string | null;
  item_subtitle: string | null;
  item_type: string;
  avg_rating: number;
  total_ratings: number;
}

export const HigherLowerGame = () => {
  const [selectedType, setSelectedType] = useState<"song" | "album" | "artist">("song");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState<RatedItem | null>(null);
  const [nextItem, setNextItem] = useState<RatedItem | null>(null);
  const [allItems, setAllItems] = useState<RatedItem[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
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

  // Fetch all rated items of the selected type
  const fetchRatedItems = async (type: string): Promise<RatedItem[]> => {
    const { data, error } = await supabase
      .from("item_ratings")
      .select("*")
      .eq("item_type", type)
      .gte("total_ratings", 1) // Only items with at least 1 rating
      .order("total_ratings", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching rated items:", error);
      return [];
    }

    return (data || []).map((item) => ({
      item_id: item.item_id || "",
      item_name: item.item_name || "",
      item_image: item.item_image,
      item_subtitle: item.item_subtitle,
      item_type: item.item_type || "",
      avg_rating: Number(item.avg_rating) || 0,
      total_ratings: Number(item.total_ratings) || 0,
    }));
  };

  const getRandomItem = (items: RatedItem[], usedIds: Set<string>): RatedItem | null => {
    const available = items.filter((item) => !usedIds.has(item.item_id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  const startGame = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Reset all game state first
    setGameOver(false);
    setShowResult(false);
    setIsCorrect(false);
    setCurrentItem(null);
    setNextItem(null);
    setScore(0);
    setUsedIds(new Set());
    setAllItems([]);
    
    setIsPlaying(true);
    setLoading(true);

    // Fetch fresh items
    const items = await fetchRatedItems(selectedType);

    if (items.length < 2) {
      toast.error(`Not enough rated ${selectedType}s to play. Need at least 2 items with ratings.`);
      setIsPlaying(false);
      setLoading(false);
      return;
    }

    setAllItems(items);

    // Get two random unique items
    const freshUsed = new Set<string>();
    const first = getRandomItem(items, freshUsed);
    if (first) freshUsed.add(first.item_id);
    
    const second = getRandomItem(items, freshUsed);
    if (second) freshUsed.add(second.item_id);

    setUsedIds(freshUsed);
    setCurrentItem(first);
    setNextItem(second);
    setLoading(false);
  };

  const handleGuess = async (guessHigher: boolean) => {
    if (!currentItem || !nextItem || showResult) return;

    const currentRating = currentItem.avg_rating;
    const nextRating = nextItem.avg_rating;

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
        const newUsed = new Set(usedIds);
        
        const newNext = getRandomItem(allItems, newUsed);
        
        if (!newNext) {
          // No more items available
          toast.success(`Amazing! You've gone through all available items! Final score: ${newScore}`);
          setGameOver(true);
        } else {
          newUsed.add(newNext.item_id);
          setUsedIds(newUsed);
          setNextItem(newNext);
        }
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
                <p className="text-muted-foreground text-sm">Guess the community rating!</p>
              </div>
            </div>

            <div className="glass-card rounded-lg p-4 bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> We'll show you two {selectedType}s with real community ratings.
                Guess if the next one has a higher or lower average rating.
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
        <p className="text-sm text-muted-foreground mb-6">High Score: {highScore}</p>
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
            <RatingItemImage
              itemId={currentItem.item_id}
              itemType={currentItem.item_type as "artist" | "album" | "song"}
              itemImage={currentItem.item_image}
              itemName={currentItem.item_name}
              className="w-full h-full"
            />
          </div>
          <h3 className="font-display font-semibold truncate">{currentItem.item_name}</h3>
          {currentItem.item_subtitle && (
            <p className="text-sm text-muted-foreground truncate">{currentItem.item_subtitle}</p>
          )}
          <p className="text-2xl font-bold text-primary mt-2">
            {currentItem.avg_rating.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">{currentItem.total_ratings} ratings</p>
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
        <div
          className={cn(
            "flex-1 glass-card rounded-xl p-4 text-center transition-all",
            showResult && (isCorrect ? "border-green-500" : "border-red-500")
          )}
        >
          <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
            <RatingItemImage
              itemId={nextItem.item_id}
              itemType={nextItem.item_type as "artist" | "album" | "song"}
              itemImage={nextItem.item_image}
              itemName={nextItem.item_name}
              className="w-full h-full"
            />
          </div>
          <h3 className="font-display font-semibold truncate">{nextItem.item_name}</h3>
          {nextItem.item_subtitle && (
            <p className="text-sm text-muted-foreground truncate">{nextItem.item_subtitle}</p>
          )}
          {showResult ? (
            <>
              <p
                className={cn(
                  "text-2xl font-bold mt-2",
                  isCorrect ? "text-green-500" : "text-red-500"
                )}
              >
                {nextItem.avg_rating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">{nextItem.total_ratings} ratings</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground mt-2">?</p>
          )}
        </div>
      </div>
    </section>
  );
};
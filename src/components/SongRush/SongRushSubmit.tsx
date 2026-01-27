import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSongRush } from "@/hooks/useSongRush";
import { searchSongs } from "@/lib/musicbrainz";
import { Clock, Search, Check, Music } from "lucide-react";
import { VinylLoader } from "@/components/VinylLoader";
import { LazyImage } from "@/components/LazyImage";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  image?: string;
}

export const SongRushSubmit = ({ game }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasSubmitted = game.submissions.some(
    (s) => s.player_id === game.myPlayer?.id && s.round === game.lobby?.current_round
  );

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchSongs(searchQuery, 10);
      setResults(
        data.map((item) => ({
          id: item.id,
          title: item.name,
          artist: item.subtitle || "Unknown",
          image: item.imageUrl,
        }))
      );
    } catch (error) {
      console.error("Search failed:", error);
    }
    setIsSearching(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => handleSearch(value), 400);
  };

  const handleSubmit = async (result: SearchResult) => {
    const success = await game.submitSong({
      id: result.id,
      name: result.title,
      artist: result.artist,
      image: result.image,
    });
    if (success) {
      setSubmitted(true);
      setQuery("");
      setResults([]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-4">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Round {game.lobby?.current_round}
        </h2>
        <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Theme</p>
          <p className="font-display text-xl font-bold text-primary">
            {game.lobby?.theme || "Loading..."}
          </p>
        </div>
      </div>

      {/* Search / Submitted State */}
      {hasSubmitted || submitted ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Song Submitted!</h3>
          <p className="text-muted-foreground">
            Waiting for other players... ({game.submissions.filter(s => s.round === game.lobby?.current_round).length}/{game.players.length})
          </p>

          {game.isHost && game.submissions.filter(s => s.round === game.lobby?.current_round).length === game.players.length && (
            <Button onClick={game.advanceToVoting} className="mt-6">
              Start Voting
            </Button>
          )}
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for a song..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {isSearching ? (
            <div className="flex justify-center py-8">
              <VinylLoader size="md" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSubmit(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {result.image ? (
                      <LazyImage
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <p className="text-center text-muted-foreground py-8">
              No results found
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Search for a song that fits the theme "{game.lobby?.theme}"
            </p>
          )}
        </div>
      )}

      {/* Player submission status */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {game.players.map((player) => {
          const hasSubmittedRound = game.submissions.some(
            (s) => s.player_id === player.id && s.round === game.lobby?.current_round
          );
          return (
            <div
              key={player.id}
              className={`px-3 py-1 rounded-full text-sm ${
                hasSubmittedRound
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {player.profile?.username}
              {hasSubmittedRound && " ✓"}
            </div>
          );
        })}
      </div>
    </div>
  );
};

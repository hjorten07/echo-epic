import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseImposterReturn } from "@/hooks/useImposter";
import { supabase } from "@/integrations/supabase/client";
import { Search, Music, Clock, Check, UserX, Eye } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { VinylLoader } from "@/components/VinylLoader";
import { toast } from "sonner";

interface Props {
  game: UseImposterReturn;
}

interface SearchResult {
  id: string;
  title: string;
  "artist-credit"?: Array<{ name: string }>;
  releases?: Array<{ id: string }>;
}

export const ImposterPlaying = ({ game }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const mySubmission = game.submissions.find(
    (s) => s.player_id === game.myPlayer?.id && s.round === game.lobby?.current_round
  );

  useEffect(() => {
    if (mySubmission) {
      setHasSubmitted(true);
    }
  }, [mySubmission]);

  const searchSongs = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(searchQuery)}&limit=10&fmt=json`,
        { headers: { "User-Agent": "Remelic/1.0" } }
      );
      const data = await response.json();
      setSearchResults(data.recordings || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search songs");
    }
    setIsSearching(false);
  };

  const handleSubmit = async (song: SearchResult) => {
    const artist = song["artist-credit"]?.[0]?.name || "Unknown Artist";
    const releaseId = song.releases?.[0]?.id;
    
    let imageUrl: string | undefined;
    if (releaseId) {
      imageUrl = `https://coverartarchive.org/release/${releaseId}/front-250`;
    }

    const success = await game.submitSong({
      id: song.id,
      name: song.title,
      artist,
      image: imageUrl,
    });

    if (success) {
      setHasSubmitted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const amImposter = game.myPlayer?.is_imposter;

  if (hasSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Song Submitted!</h2>
        <p className="text-muted-foreground">Waiting for other players...</p>
        
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>

        {/* Show submission count */}
        <div className="mt-4 text-sm text-muted-foreground">
          {game.submissions.filter(s => s.round === game.lobby?.current_round).length} / {game.players.length} submitted
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
          </div>
        </div>
        
        {/* Role indicator */}
        {amImposter ? (
          <div className="glass-card p-6 rounded-2xl bg-destructive/10 border-destructive/30 mb-6">
            <div className="flex items-center justify-center gap-3 text-destructive">
              <UserX className="w-8 h-8" />
              <span className="font-display text-2xl font-bold">You are the IMPOSTER!</span>
            </div>
            <p className="text-muted-foreground mt-2">
              You don't know the theme. Pick a song that might blend in!
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl bg-green-500/10 border-green-500/30 mb-6">
            <div className="flex items-center justify-center gap-3 text-green-600">
              <Eye className="w-8 h-8" />
              <span className="font-display text-2xl font-bold">Theme: {game.lobby?.theme}</span>
            </div>
            <p className="text-muted-foreground mt-2">
              Pick a song that matches. One player doesn't know the theme!
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for a song..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchSongs()}
          />
          <Button onClick={searchSongs} disabled={isSearching}>
            {isSearching ? (
              <VinylLoader size="sm" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSubmit(song)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {song.releases?.[0]?.id ? (
                  <LazyImage
                    src={`https://coverartarchive.org/release/${song.releases[0].id}/front-250`}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {song["artist-credit"]?.[0]?.name || "Unknown Artist"}
                </p>
              </div>
            </button>
          ))}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <p className="text-center text-muted-foreground py-8">
              No songs found. Try a different search!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

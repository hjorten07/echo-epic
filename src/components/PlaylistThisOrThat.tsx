import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music2, Shuffle, Loader2, X, ListMusic } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlaylistSong {
  id: string;
  song_id: string;
  song_name: string;
  song_artist: string | null;
  song_image: string | null;
}

interface PlaylistThisOrThatProps {
  songs: PlaylistSong[];
  playlistName: string;
  onClose: () => void;
}

export const PlaylistThisOrThat = memo(({ songs, playlistName, onClose }: PlaylistThisOrThatProps) => {
  const [options, setOptions] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getNewPair = useCallback(() => {
    if (songs.length < 2) return null;
    
    // Try to find an unused pair
    for (let attempts = 0; attempts < 50; attempts++) {
      const shuffled = [...songs].sort(() => 0.5 - Math.random());
      const pair = shuffled.slice(0, 2);
      const pairKey = [pair[0].song_id, pair[1].song_id].sort().join("-");
      
      if (!usedPairs.has(pairKey)) {
        return { pair, pairKey };
      }
    }
    
    // If all pairs used, reset and pick random
    setUsedPairs(new Set());
    const shuffled = [...songs].sort(() => 0.5 - Math.random());
    const pair = shuffled.slice(0, 2);
    const pairKey = [pair[0].song_id, pair[1].song_id].sort().join("-");
    return { pair, pairKey };
  }, [songs, usedPairs]);

  const fetchOptions = useCallback(() => {
    setLoading(true);
    const result = getNewPair();
    if (result && mountedRef.current) {
      setOptions(result.pair);
      setUsedPairs(prev => new Set([...prev, result.pairKey]));
    }
    setLoading(false);
  }, [getNewPair]);

  // Start immediately
  useEffect(() => {
    if (songs.length >= 2) {
      fetchOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoice = useCallback((choice: PlaylistSong) => {
    if (!user) return;
    // For own playlist, skip rating prompt and go to next round immediately
    toast.success(`Great choice! You picked ${choice.song_name}`);
    setRound(r => r + 1);
    fetchOptions();
  }, [user, fetchOptions]);

  const handleSkip = useCallback(() => {
    fetchOptions();
  }, [fetchOptions]);

  if (songs.length < 2) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <ListMusic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-bold mb-2">Not Enough Songs</h3>
          <p className="text-muted-foreground mb-4">
            Add at least 2 songs to this playlist to play This or That!
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">This or That?</h2>
              <p className="text-sm text-muted-foreground">
                Round {round + 1} • {playlistName}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
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
                {options[0].song_image ? (
                  <img
                    src={options[0].song_image}
                    alt={options[0].song_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                {options[0].song_name}
              </h3>
              {options[0].song_artist && (
                <p className="text-sm text-muted-foreground truncate">{options[0].song_artist}</p>
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
                {options[1].song_image ? (
                  <img
                    src={options[1].song_image}
                    alt={options[1].song_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                {options[1].song_name}
              </h3>
              {options[1].song_artist && (
                <p className="text-sm text-muted-foreground truncate">{options[1].song_artist}</p>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No options available. Try again!</p>
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
      </div>
    </div>
  );
});

PlaylistThisOrThat.displayName = "PlaylistThisOrThat";

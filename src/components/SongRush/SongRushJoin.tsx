import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Lock, Globe, Zap, Trophy, HelpCircle } from "lucide-react";
import { useSongRush } from "@/hooks/useSongRush";
import { VinylLoader } from "@/components/VinylLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushJoin = ({ game }: Props) => {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");
  const [totalWins, setTotalWins] = useState<number>(0);

  useEffect(() => {
    const fetchWins = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("game_wins")
        .eq("id", user.id)
        .single();
      if (data) {
        setTotalWins(data.game_wins || 0);
      }
    };
    fetchWins();
  }, [user]);

  const handleJoin = async () => {
    if (joinCode.length === 6) {
      await game.joinLobby(joinCode);
    }
  };

  if (mode === "join") {
    return (
      <div className="text-center py-8">
        <h3 className="font-display text-2xl font-bold mb-6">Join Game</h3>
        <div className="max-w-xs mx-auto space-y-4">
          <Input
            placeholder="Enter 6-digit code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            className="text-center text-2xl tracking-widest font-mono"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("menu")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleJoin} disabled={joinCode.length !== 6 || game.isLoading} className="flex-1">
              {game.isLoading ? <VinylLoader size="sm" /> : "Join"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Song Rush</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Race to find the perfect song for each theme. Submit your pick, vote on others, and compete to win!
        </p>

        {/* Total Wins Display */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-600">
          <Trophy className="w-5 h-5" />
          <span className="font-bold">{totalWins}</span>
          <span className="text-sm">Total Wins</span>
        </div>
      </div>

      <div className="grid gap-4 max-w-md mx-auto">
        <Button
          size="lg"
          onClick={() => game.createPublicLobby()}
          disabled={game.isLoading}
          className="h-16 text-lg"
        >
          {game.isLoading ? (
            <VinylLoader size="sm" />
          ) : (
            <>
              <Globe className="w-5 h-5 mr-3" />
              Quick Play
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => game.createLobby(true)}
            disabled={game.isLoading}
            className="h-14"
          >
            <Lock className="w-4 h-4 mr-2" />
            Private Game
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMode("join")}
            disabled={game.isLoading}
            className="h-14"
          >
            <Users className="w-4 h-4 mr-2" />
            Join with Code
          </Button>
        </div>
      </div>

      {/* How to Play */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="mt-6 gap-2">
            <HelpCircle className="w-4 h-4" />
            How to Play
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              How to Play Song Rush
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Get a Theme</p>
                <p className="text-muted-foreground">Each round has a theme like "Summer Vibes" or "Heartbreak"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Submit a Song (2 minutes)</p>
                <p className="text-muted-foreground">Search and pick a song that best fits the theme</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Vote on Songs (1 minute)</p>
                <p className="text-muted-foreground">Give 1-3 points to each song (you can't vote for your own)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium">Win Rounds!</p>
                <p className="text-muted-foreground">The song with the most points wins. First to 2 round wins takes the game!</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-muted-foreground">
                <strong>Quick Play:</strong> Joins a public game or creates one. Game auto-starts after 2 min countdown when 2+ players join.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Private Game:</strong> Create a lobby with a code to share with friends. Host controls when to start.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
        <div>
          <div className="text-3xl mb-2">🎵</div>
          <p className="text-sm text-muted-foreground">Pick a song that fits the theme</p>
        </div>
        <div>
          <div className="text-3xl mb-2">🗳️</div>
          <p className="text-sm text-muted-foreground">Vote on your favorites</p>
        </div>
        <div>
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-muted-foreground">First to 2 wins!</p>
        </div>
      </div>
    </div>
  );
};

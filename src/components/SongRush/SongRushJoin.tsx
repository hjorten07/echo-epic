import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Lock, Globe, Zap } from "lucide-react";
import { useSongRush } from "@/hooks/useSongRush";
import { VinylLoader } from "@/components/VinylLoader";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushJoin = ({ game }: Props) => {
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");

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
      </div>

      <div className="grid gap-4 max-w-md mx-auto">
        <Button
          size="lg"
          onClick={() => game.findPublicLobby()}
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

      <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Lock, Globe, Eye, Trophy, HelpCircle, UserX } from "lucide-react";
import { UseImposterReturn } from "@/hooks/useImposter";
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
  game: UseImposterReturn;
}

export const ImposterJoin = ({ game }: Props) => {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");
  const [imposterWins, setImposterWins] = useState(0);
  const [catches, setCatches] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("imposter_wins, imposter_catches")
        .eq("id", user.id)
        .single();
      if (data) {
        setImposterWins(data.imposter_wins || 0);
        setCatches(data.imposter_catches || 0);
      }
    };
    fetchStats();
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
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
          <UserX className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Imposter</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          One player doesn't know the theme. Find the imposter before they blend in, or deceive everyone if you're it!
        </p>

        {/* Stats Display */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/20 text-destructive">
            <UserX className="w-5 h-5" />
            <span className="font-bold">{imposterWins}</span>
            <span className="text-sm">Imposter Wins</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-600">
            <Eye className="w-5 h-5" />
            <span className="font-bold">{catches}</span>
            <span className="text-sm">Catches</span>
          </div>
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
              <UserX className="w-5 h-5 text-destructive" />
              How to Play Imposter
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Roles Assigned</p>
                <p className="text-muted-foreground">One random player becomes the Imposter and doesn't see the theme</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Submit a Song</p>
                <p className="text-muted-foreground">Everyone picks a song. Normal players match the theme, the Imposter tries to blend in</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Vote for the Imposter</p>
                <p className="text-muted-foreground">Look at everyone's songs and vote who you think is the Imposter</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium">Reveal!</p>
                <p className="text-muted-foreground">If the Imposter gets the most votes, everyone else wins. If not, the Imposter wins!</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-muted-foreground">
                <strong>Minimum 3 players</strong> are required to start the game.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
        <div>
          <div className="text-3xl mb-2">🎭</div>
          <p className="text-sm text-muted-foreground">One imposter among you</p>
        </div>
        <div>
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm text-muted-foreground">Find who doesn't know</p>
        </div>
        <div>
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-muted-foreground">Catch or deceive!</p>
        </div>
      </div>
    </div>
  );
};

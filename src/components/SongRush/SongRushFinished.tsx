import { useSongRush } from "@/hooks/useSongRush";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, Home, Medal } from "lucide-react";
import { toast } from "sonner";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushFinished = ({ game }: Props) => {
  const sortedPlayers = [...game.players].sort((a, b) => b.wins - a.wins);
  const winner = sortedPlayers[0];

  const shareResults = async () => {
    const text = `🎵 Song Rush Results!\n\n🏆 Winner: ${winner?.profile?.username}\n\nPlayers:\n${sortedPlayers
      .map((p, i) => `${i + 1}. ${p.profile?.username} - ${p.wins} wins`)
      .join("\n")}\n\nPlay at ${window.location.origin}/games`;

    try {
      await navigator.share({ text });
    } catch {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied to clipboard!");
    }
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Trophy Animation */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4 animate-bounce-slow shadow-2xl">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-2">Game Over!</h1>
      </div>

      {/* Winner Showcase */}
      {winner && (
        <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-primary/5 to-transparent" />
          <div className="relative z-10">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-yellow-500 shadow-xl">
              <AvatarImage src={winner.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {winner.profile?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-display text-2xl font-bold mb-1">
              {winner.profile?.username}
            </h2>
            <p className="text-primary text-lg font-medium">
              🏆 Champion - {winner.wins} wins
            </p>
          </div>
        </div>
      )}

      {/* Final Standings */}
      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="font-display text-lg font-bold mb-4">Final Standings</h3>
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                index === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-muted/30"
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                {index === 0 ? (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                ) : index === 1 ? (
                  <Medal className="w-5 h-5 text-gray-400" />
                ) : index === 2 ? (
                  <Medal className="w-5 h-5 text-amber-700" />
                ) : (
                  <span className="font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={player.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {player.profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left font-medium">
                {player.profile?.username}
              </span>
              <div className="text-right">
                <p className="font-bold">{player.wins} wins</p>
                <p className="text-xs text-muted-foreground">{player.score} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={shareResults} className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Button onClick={game.leaveLobby} className="flex-1">
          <Home className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
};

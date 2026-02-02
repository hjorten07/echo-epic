import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UseImposterReturn } from "@/hooks/useImposter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Check, Music, UserX } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  game: UseImposterReturn;
}

export const ImposterVoting = ({ game }: Props) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Group submissions by player - show all their submissions across rounds
  const playerSubmissions = game.players.map((player) => {
    const submissions = game.submissions.filter((s) => s.player_id === player.id);
    return { player, submissions };
  });

  const handleVote = async () => {
    if (!selectedPlayer) return;
    
    const success = await game.voteForImposter(selectedPlayer);
    if (success) {
      setHasVoted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (hasVoted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Vote Cast!</h2>
        <p className="text-muted-foreground">Waiting for other players to vote...</p>
        
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Who is the Imposter?</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          Review all submitted songs and vote for who you think is the imposter
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>
      </div>

      {/* All players and their submissions */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {playerSubmissions.map(({ player, submissions }) => {
          const isSelected = selectedPlayer === player.id;
          const isMe = player.id === game.myPlayer?.id;

          return (
            <button
              key={player.id}
              onClick={() => !isMe && setSelectedPlayer(player.id)}
              disabled={isMe}
              className={cn(
                "glass-card p-4 rounded-xl text-left transition-all",
                isMe && "opacity-50 cursor-not-allowed",
                isSelected && "ring-2 ring-destructive bg-destructive/10",
                !isMe && !isSelected && "hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/user/${player.user_id}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={player.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {player.profile?.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="font-medium">{player.profile?.username}</p>
                  {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                </div>
                {isSelected && (
                  <UserX className="w-5 h-5 text-destructive" />
                )}
              </div>

              {/* Show all submissions for this player */}
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div key={submission.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {submission.song_image ? (
                        <LazyImage
                          src={submission.song_image}
                          alt={submission.song_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{submission.song_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {submission.song_artist}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">R{submission.round}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          onClick={handleVote}
          disabled={!selectedPlayer}
          className="bg-destructive hover:bg-destructive/90"
        >
          <UserX className="w-4 h-4 mr-2" />
          Vote as Imposter
        </Button>
      </div>
    </div>
  );
};

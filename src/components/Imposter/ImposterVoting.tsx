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

  const roundSubmissions = game.submissions.filter(
    (s) => s.round === game.lobby?.current_round
  );

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
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold mb-2">Who is the Imposter?</h2>
        <p className="text-muted-foreground mb-4">
          Theme: <span className="text-primary font-semibold">{game.lobby?.theme}</span>
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>
      </div>

      {/* All submissions */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {roundSubmissions.map((submission) => {
          const player = game.players.find((p) => p.id === submission.player_id);
          const isSelected = selectedPlayer === submission.player_id;
          const isMe = submission.player_id === game.myPlayer?.id;

          return (
            <button
              key={submission.id}
              onClick={() => !isMe && setSelectedPlayer(submission.player_id)}
              disabled={isMe}
              className={cn(
                "glass-card p-4 rounded-xl text-left transition-all",
                isMe && "opacity-50 cursor-not-allowed",
                isSelected && "ring-2 ring-destructive bg-destructive/10",
                !isMe && !isSelected && "hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/user/${player?.user_id}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={player?.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {player?.profile?.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="font-medium">{player?.profile?.username}</p>
                  {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                </div>
                {isSelected && (
                  <UserX className="w-5 h-5 text-destructive" />
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                  {submission.song_image ? (
                    <LazyImage
                      src={submission.song_image}
                      alt={submission.song_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{submission.song_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {submission.song_artist}
                  </p>
                </div>
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

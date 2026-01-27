import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSongRush } from "@/hooks/useSongRush";
import { Clock, Music, Star } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { cn } from "@/lib/utils";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushVoting = ({ game }: Props) => {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, number>>({});

  const roundSubmissions = game.submissions.filter(
    (s) => s.round === game.lobby?.current_round && s.player_id !== game.myPlayer?.id
  );

  const myVotes = game.votes.filter(
    (v) => v.voter_id === game.myPlayer?.id && v.round === game.lobby?.current_round
  );

  const handleVote = async (submissionId: string, points: number) => {
    const success = await game.vote(submissionId, points);
    if (success) {
      setSelectedVotes((prev) => ({ ...prev, [submissionId]: points }));
    }
  };

  const hasVotedFor = (submissionId: string): boolean => {
    return myVotes.some((v) => v.submission_id === submissionId) || !!selectedVotes[submissionId];
  };

  const getVotePoints = (submissionId: string): number | undefined => {
    return selectedVotes[submissionId] || myVotes.find(v => v.submission_id === submissionId)?.points;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const allVoted = roundSubmissions.every((s) => hasVotedFor(s.id));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-4">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(game.timeLeft)}</span>
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Vote for Your Favorites</h2>
        <p className="text-muted-foreground">
          Theme: <span className="text-primary font-medium">{game.lobby?.theme}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Give 1-3 points to each song (can't vote for your own)
        </p>
      </div>

      {/* Submissions */}
      <div className="grid gap-4">
        {roundSubmissions.map((submission) => {
          const voted = hasVotedFor(submission.id);
          const points = getVotePoints(submission.id);

          return (
            <div
              key={submission.id}
              className={cn(
                "glass-card p-4 rounded-2xl transition-all",
                voted && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {submission.song_image ? (
                    <LazyImage
                      src={submission.song_image}
                      alt={submission.song_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{submission.song_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {submission.song_artist}
                  </p>
                </div>

                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <Button
                      key={p}
                      variant={points === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(submission.id, p)}
                      disabled={voted}
                      className={cn(
                        "w-10 h-10",
                        points === p && "bg-primary text-primary-foreground"
                      )}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="mt-8 text-center">
        {allVoted ? (
          <div className="glass-card p-6 rounded-2xl">
            <Star className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium">All votes cast!</p>
            <p className="text-sm text-muted-foreground">
              Waiting for other players...
            </p>
            {game.isHost && (
              <Button onClick={game.calculateResults} className="mt-4">
                Show Results
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Vote for {roundSubmissions.filter((s) => !hasVotedFor(s.id)).length} more song(s)
          </p>
        )}
      </div>
    </div>
  );
};

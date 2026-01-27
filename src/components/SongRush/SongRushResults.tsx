import { useSongRush } from "@/hooks/useSongRush";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Music, Trophy } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushResults = ({ game }: Props) => {
  const roundSubmissions = game.submissions.filter(
    (s) => s.round === game.lobby?.current_round
  );

  // Calculate points per submission
  const submissionPoints = roundSubmissions.map((sub) => {
    const points = game.votes
      .filter((v) => v.submission_id === sub.id)
      .reduce((sum, v) => sum + v.points, 0);
    const player = game.players.find((p) => p.id === sub.player_id);
    return { submission: sub, points, player };
  }).sort((a, b) => b.points - a.points);

  const winner = submissionPoints[0];

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="font-display text-2xl font-bold mb-2">
        Round {game.lobby?.current_round} Results
      </h2>
      <p className="text-muted-foreground mb-8">
        Theme: <span className="text-primary">{game.lobby?.theme}</span>
      </p>

      {/* Winner Showcase */}
      {winner && (
        <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Round Winner</p>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage src={winner.player?.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {winner.player?.profile?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-display text-xl font-bold">
                {winner.player?.profile?.username}
              </span>
            </div>

            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-muted/50">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                {winner.submission.song_image ? (
                  <LazyImage
                    src={winner.submission.song_image}
                    alt={winner.submission.song_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="font-medium">{winner.submission.song_name}</p>
                <p className="text-sm text-muted-foreground">
                  {winner.submission.song_artist}
                </p>
                <p className="text-primary font-bold mt-1">
                  {winner.points} points
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Submissions */}
      <div className="space-y-3">
        {submissionPoints.slice(1).map(({ submission, points, player }, index) => (
          <div
            key={submission.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-muted/30"
          >
            <span className="w-8 text-center font-bold text-muted-foreground">
              #{index + 2}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={player?.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {player?.profile?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">{submission.song_name}</p>
              <p className="text-xs text-muted-foreground">{player?.profile?.username}</p>
            </div>
            <span className="font-bold">{points} pts</span>
          </div>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="mt-8 glass-card p-4 rounded-xl">
        <h3 className="font-display font-bold mb-3">Scoreboard</h3>
        <div className="flex justify-center gap-4 flex-wrap">
          {game.players
            .sort((a, b) => b.wins - a.wins)
            .map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={player.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {player.profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{player.profile?.username}</span>
                <span className="font-bold text-primary">{player.wins}</span>
                <Trophy className="w-3 h-3 text-yellow-500" />
              </div>
            ))}
        </div>
      </div>

      {/* Next Round */}
      {game.isHost && (
        <Button onClick={game.startNextRound} className="mt-6" size="lg">
          Next Round
        </Button>
      )}
    </div>
  );
};

import { UseImposterReturn } from "@/hooks/useImposter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserX, Trophy, Eye, Music, Home } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { Link } from "react-router-dom";
import { GameRatingDialog } from "@/components/GameRatingDialog";
import { useState } from "react";

interface Props {
  game: UseImposterReturn;
}

export const ImposterResults = ({ game }: Props) => {
  const [showRating, setShowRating] = useState(true);
  
  const imposter = game.players.find((p) => p.is_imposter);
  const imposterSubmission = game.submissions.find(
    (s) => s.player_id === imposter?.id && s.round === game.lobby?.current_round
  );

  // Calculate who got the most votes
  const votesByPlayer: Record<string, number> = {};
  game.imposterVotes.forEach((vote) => {
    votesByPlayer[vote.voted_player_id] = (votesByPlayer[vote.voted_player_id] || 0) + 1;
  });

  const mostVotedPlayerId = Object.entries(votesByPlayer).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const imposterCaught = mostVotedPlayerId === imposter?.id;

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Result Header */}
      <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${imposterCaught ? "from-green-500/10" : "from-destructive/10"} to-transparent`} />
        <div className="relative z-10">
          <div className={`w-20 h-20 rounded-full ${imposterCaught ? "bg-green-500/20" : "bg-destructive/20"} flex items-center justify-center mx-auto mb-4`}>
            {imposterCaught ? (
              <Eye className="w-10 h-10 text-green-500" />
            ) : (
              <UserX className="w-10 h-10 text-destructive" />
            )}
          </div>
          
          <h2 className="font-display text-3xl font-bold mb-2">
            {imposterCaught ? "Imposter Caught!" : "Imposter Wins!"}
          </h2>
          <p className="text-muted-foreground">
            {imposterCaught 
              ? "The group successfully identified the imposter!"
              : "The imposter blended in successfully!"}
          </p>
        </div>
      </div>

      {/* Imposter Reveal */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center justify-center gap-2">
          <UserX className="w-5 h-5 text-destructive" />
          The Imposter Was...
        </h3>
        
        <Link to={`/user/${imposter?.user_id}`} className="inline-flex items-center gap-3 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors">
          <Avatar className="w-12 h-12 border-2 border-destructive">
            <AvatarImage src={imposter?.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {imposter?.profile?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-display text-xl font-bold">
            {imposter?.profile?.username}
          </span>
        </Link>

        {/* Imposter's submission */}
        {imposterSubmission && (
          <div className="mt-4 flex items-center justify-center gap-4 p-4 rounded-xl bg-muted/50">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
              {imposterSubmission.song_image ? (
                <LazyImage
                  src={imposterSubmission.song_image}
                  alt={imposterSubmission.song_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="font-medium">{imposterSubmission.song_name}</p>
              <p className="text-sm text-muted-foreground">
                {imposterSubmission.song_artist}
              </p>
              <p className="text-xs text-destructive mt-1">
                Submitted without knowing: "{game.lobby?.theme}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Vote Distribution */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <h3 className="font-display text-lg font-bold mb-4">Vote Results</h3>
        <div className="space-y-2">
          {game.players.map((player) => {
            const voteCount = votesByPlayer[player.id] || 0;
            const isImposter = player.is_imposter;
            
            return (
              <Link
                key={player.id}
                to={`/user/${player.user_id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={player.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {player.profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left">{player.profile?.username}</span>
                <span className="font-bold">{voteCount} votes</span>
                {isImposter && (
                  <UserX className="w-4 h-4 text-destructive" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        {game.isHost && (
          <Button onClick={game.playAgain} size="lg">
            <Trophy className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
        <Button variant="outline" onClick={game.leaveLobby} size="lg">
          <Home className="w-4 h-4 mr-2" />
          Leave Game
        </Button>
      </div>

      {/* Rating Dialog */}
      {showRating && game.lobby && (
        <GameRatingDialog
          lobbyId={game.lobby.id}
          gameType="imposter"
          open={showRating}
          onOpenChange={setShowRating}
        />
      )}
    </div>
  );
};

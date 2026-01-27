import { useState } from "react";
import { useSongRush } from "@/hooks/useSongRush";
import { SongRushLobby } from "./SongRushLobby";
import { SongRushSubmit } from "./SongRushSubmit";
import { SongRushVoting } from "./SongRushVoting";
import { SongRushResults } from "./SongRushResults";
import { SongRushFinished } from "./SongRushFinished";
import { SongRushJoin } from "./SongRushJoin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export const SongRushGame = () => {
  const { user } = useAuth();
  const game = useSongRush();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="font-display text-xl font-bold mb-4">Login Required</h3>
        <p className="text-muted-foreground mb-6">
          You need to be logged in to play Song Rush
        </p>
        <Link to="/auth">
          <Button>
            <LogIn className="w-4 h-4 mr-2" />
            Log In to Play
          </Button>
        </Link>
      </div>
    );
  }

  if (!game.lobby) {
    return <SongRushJoin game={game} />;
  }

  switch (game.lobby.status) {
    case "waiting":
      return <SongRushLobby game={game} />;
    case "submitting":
      return <SongRushSubmit game={game} />;
    case "voting":
      return <SongRushVoting game={game} />;
    case "results":
      return <SongRushResults game={game} />;
    case "finished":
      return <SongRushFinished game={game} />;
    default:
      return <SongRushJoin game={game} />;
  }
};

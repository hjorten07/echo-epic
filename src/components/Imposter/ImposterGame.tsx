import React from "react";
import { useImposter } from "@/hooks/useImposter";
import { ImposterJoin } from "./ImposterJoin";
import { ImposterLobby } from "./ImposterLobby";
import { ImposterPlaying } from "./ImposterPlaying";
import { ImposterVoting } from "./ImposterVoting";
import { ImposterResults } from "./ImposterResults";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export const ImposterGame = () => {
  const { user } = useAuth();
  const game = useImposter();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="font-display text-xl font-bold mb-4">Login Required</h3>
        <p className="text-muted-foreground mb-6">
          You need to be logged in to play Imposter
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
    return <ImposterJoin game={game} />;
  }

  switch (game.lobby.status) {
    case "waiting":
      return <ImposterLobby game={game} />;
    case "submitting":
      return <ImposterPlaying game={game} />;
    case "voting":
      return <ImposterVoting game={game} />;
    case "results":
    case "finished":
      return <ImposterResults game={game} />;
    default:
      return <ImposterJoin game={game} />;
  }
};

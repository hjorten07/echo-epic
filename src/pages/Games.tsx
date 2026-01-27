import { useState } from "react";
import { Gamepad2, Shuffle, ArrowUpDown, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ThisOrThat } from "@/components/ThisOrThat";
import { HigherLowerGame } from "@/components/HigherLowerGame";
import { SongRushGame } from "@/components/SongRush/SongRushGame";
import { cn } from "@/lib/utils";

type GameType = "this-or-that" | "higher-lower" | "song-rush";

const Games = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>("this-or-that");

  const games = [
    {
      id: "this-or-that" as const,
      name: "This or That",
      description: "Choose your favorite between two options",
      icon: Shuffle,
    },
    {
      id: "higher-lower" as const,
      name: "Higher or Lower",
      description: "Guess which has the higher community rating",
      icon: ArrowUpDown,
    },
    {
      id: "song-rush" as const,
      name: "Song Rush",
      description: "Multiplayer: find songs for themes",
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">Games</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Play fun music games and discover new artists, albums, and songs!
            </p>
          </div>

          {/* Game Selector */}
          <div className="flex justify-center gap-4 mb-12">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-6 rounded-2xl transition-all min-w-[200px]",
                  selectedGame === game.id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "glass-card hover:border-primary/30"
                )}
              >
                <game.icon className="w-8 h-8" />
                <span className="font-display font-bold">{game.name}</span>
                <span className={cn(
                  "text-sm text-center",
                  selectedGame === game.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {game.description}
                </span>
              </button>
            ))}
          </div>

          {/* Game Content */}
          <div className="max-w-4xl mx-auto">
            {selectedGame === "this-or-that" && <ThisOrThat />}
            {selectedGame === "higher-lower" && <HigherLowerGame />}
            {selectedGame === "song-rush" && <SongRushGame />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Games;

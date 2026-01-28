import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Crown, LogOut, Play, Send, Users, Clock, Globe, Lock } from "lucide-react";
import { useSongRush } from "@/hooks/useSongRush";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface Props {
  game: ReturnType<typeof useSongRush>;
}

export const SongRushLobby = ({ game }: Props) => {
  const [chatMessage, setChatMessage] = useState("");

  const copyCode = () => {
    if (game.lobby?.code) {
      navigator.clipboard.writeText(game.lobby.code);
      toast.success("Code copied!");
    }
  };

  const handleSendChat = () => {
    if (chatMessage.trim()) {
      game.sendChat(chatMessage.trim());
      setChatMessage("");
    }
  };

  const isPublicLobby = !game.lobby?.is_private;
  const hasEnoughPlayers = game.players.length >= 2;

  // Calculate countdown progress for public lobbies
  const countdownProgress = game.publicCountdown > 0 
    ? (game.publicCountdown / 120) * 100 
    : 0;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Players */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Players ({game.players.length}/6)
          </h3>
          <div className="flex items-center gap-2">
            {isPublicLobby ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Public
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
            <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
              <Copy className="w-4 h-4" />
              {game.lobby?.code}
            </Button>
          </div>
        </div>

        {/* Public lobby waiting/countdown message */}
        {isPublicLobby && (
          <div className="mb-4 p-3 rounded-xl bg-muted/50">
            {!hasEnoughPlayers ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Waiting for more players...</span>
              </div>
            ) : game.publicCountdown > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Game starting in...</span>
                  <span className="font-mono font-bold text-primary">
                    {formatCountdown(game.publicCountdown)}
                  </span>
                </div>
                <Progress value={countdownProgress} className="h-2" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-500">
                <Play className="w-4 h-4" />
                <span>Starting game...</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {game.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={player.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {player.profile?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium flex-1">
                {player.profile?.username || "Player"}
              </span>
              {player.user_id === game.lobby?.host_id && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          ))}

          {Array.from({ length: 6 - game.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/30"
            >
              <div className="w-10 h-10 rounded-full bg-muted/30" />
              <span className="text-muted-foreground">Waiting...</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={game.leaveLobby} className="flex-1">
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
          {game.isHost && !isPublicLobby && (
            <Button
              onClick={game.startGame}
              disabled={game.players.length < 2}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="glass-card p-6 rounded-2xl flex flex-col">
        <h3 className="font-display text-xl font-bold mb-4">Lobby Chat</h3>

        <ScrollArea className="flex-1 h-64 mb-4">
          <div className="space-y-3 pr-4">
            {game.chat.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet...
              </p>
            ) : (
              game.chat.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={msg.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.profile?.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium text-primary">
                      {msg.profile?.username}:
                    </span>{" "}
                    <span className="text-sm">{msg.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          />
          <Button size="icon" onClick={handleSendChat}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

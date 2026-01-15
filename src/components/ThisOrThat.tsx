import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music2, Disc3, Mic2, Shuffle, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThisOrThatProps {
  isLoggedIn?: boolean;
  onPlay?: () => void;
}

export const ThisOrThat = ({ isLoggedIn = false, onPlay }: ThisOrThatProps) => {
  const [selectedType, setSelectedType] = useState<"song" | "album" | "artist">("song");
  const [isHovered, setIsHovered] = useState(false);

  const types = [
    { value: "song" as const, label: "Songs", icon: Music2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
  ];

  return (
    <section 
      className="relative glass-card rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className={cn(
        "absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500",
        isHovered && "opacity-100"
      )} />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse-glow">
                <Shuffle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">This or That?</h2>
                <p className="text-muted-foreground text-sm">Choose your favorite!</p>
              </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    selectedType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Play Button */}
          <Button
            size="lg"
            onClick={onPlay}
            className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            {isLoggedIn ? "Play Now" : "Sign Up to Play"}
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Preview Cards */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1 h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Option A</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-display font-bold text-primary">VS</span>
          </div>
          <div className="flex-1 h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Option B</span>
          </div>
        </div>
      </div>
    </section>
  );
};

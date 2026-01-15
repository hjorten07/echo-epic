import { cn } from "@/lib/utils";
import { Star, Award, Trophy, Crown, Gem } from "lucide-react";

type BadgeType = "10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings";

interface BadgeProps {
  type: BadgeType;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeConfig: Record<BadgeType, { 
  icon: typeof Star; 
  label: string; 
  description: string;
  colors: string;
}> = {
  "10_ratings": {
    icon: Star,
    label: "Newcomer",
    description: "Rated 10 items",
    colors: "from-amber-600 to-amber-800",
  },
  "50_ratings": {
    icon: Award,
    label: "Music Lover",
    description: "Rated 50 items",
    colors: "from-slate-400 to-slate-600",
  },
  "100_ratings": {
    icon: Trophy,
    label: "Critic",
    description: "Rated 100 items",
    colors: "from-yellow-500 to-amber-600",
  },
  "1000_ratings": {
    icon: Crown,
    label: "Expert",
    description: "Rated 1,000 items",
    colors: "from-purple-500 to-purple-700",
  },
  "10000_ratings": {
    icon: Gem,
    label: "Legend",
    description: "Rated 10,000 items",
    colors: "from-cyan-400 to-blue-600",
  },
};

export const Badge = ({ type, earned = true, size = "md", showLabel = true }: BadgeProps) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all",
          sizeClasses[size],
          earned
            ? `bg-gradient-to-br ${config.colors} shadow-lg`
            : "bg-muted opacity-40"
        )}
      >
        <Icon className={cn(iconSizes[size], earned ? "text-white" : "text-muted-foreground")} />
        {earned && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20" />
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn(
            "text-xs font-semibold",
            earned ? "text-foreground" : "text-muted-foreground"
          )}>
            {config.label}
          </p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      )}
    </div>
  );
};

export const BadgeGrid = ({ badges }: { badges: BadgeType[] }) => {
  const allBadges: BadgeType[] = ["10_ratings", "50_ratings", "100_ratings", "1000_ratings", "10000_ratings"];

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {allBadges.map((badge) => (
        <Badge key={badge} type={badge} earned={badges.includes(badge)} />
      ))}
    </div>
  );
};

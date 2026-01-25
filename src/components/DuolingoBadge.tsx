import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";

interface DuolingoBadgeProps {
  icon: string;
  name: string;
  description: string;
  earnedAt?: string;
  category?: string;
  threshold?: number | null;
  currentProgress?: number;
  size?: "sm" | "md" | "lg";
  earned?: boolean;
}

export const DuolingoBadge = ({
  icon,
  name,
  description,
  earnedAt,
  category,
  threshold,
  currentProgress = 0,
  size = "md",
  earned = true,
}: DuolingoBadgeProps) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate progress percentage for milestone badges
  const progress = threshold ? Math.min((currentProgress / threshold) * 100, 100) : earned ? 100 : 0;

  const sizeConfig = {
    sm: { 
      container: "w-14 h-14", 
      icon: "text-xl",
      ring: 48,
      stroke: 3,
    },
    md: { 
      container: "w-20 h-20", 
      icon: "text-3xl",
      ring: 72,
      stroke: 4,
    },
    lg: { 
      container: "w-28 h-28", 
      icon: "text-5xl",
      ring: 100,
      stroke: 5,
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * (config.ring / 2 - config.stroke);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Category-based colors
  const getCategoryColor = () => {
    switch (category) {
      case "welcome":
        return "from-emerald-400 to-teal-600";
      case "milestone":
        return "from-amber-400 to-orange-600";
      case "streak":
        return "from-red-400 to-rose-600";
      case "behavior":
        return "from-purple-400 to-violet-600";
      default:
        return "from-primary to-primary/80";
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className={cn(
          "relative group transition-all duration-300 hover:scale-110 focus:outline-none",
          config.container
        )}
      >
        {/* Progress ring SVG */}
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox={`0 0 ${config.ring} ${config.ring}`}
        >
          {/* Background ring */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={config.ring / 2 - config.stroke}
            fill="none"
            className={cn(
              "transition-colors",
              earned ? "stroke-secondary" : "stroke-muted"
            )}
            strokeWidth={config.stroke}
          />
          {/* Progress ring */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={config.ring / 2 - config.stroke}
            fill="none"
            className={cn(
              "transition-all duration-500",
              earned ? "stroke-primary" : "stroke-muted-foreground/30"
            )}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={earned ? 0 : strokeDashoffset}
          />
        </svg>

        {/* Badge center */}
        <div
          className={cn(
            "absolute inset-1 rounded-full flex items-center justify-center transition-all",
            earned 
              ? `bg-gradient-to-br ${getCategoryColor()} shadow-lg`
              : "bg-muted/50"
          )}
        >
          <span className={cn(config.icon, earned ? "grayscale-0" : "grayscale opacity-40")}>
            {icon}
          </span>
        </div>

        {/* Glow effect on hover */}
        {earned && (
          <div className={cn(
            "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            `bg-gradient-to-br ${getCategoryColor()} blur-md -z-10`
          )} />
        )}
      </button>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-center">{name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center",
              earned 
                ? `bg-gradient-to-br ${getCategoryColor()} shadow-xl`
                : "bg-muted"
            )}>
              <span className="text-5xl">{icon}</span>
            </div>
            
            <p className="text-center text-muted-foreground">{description}</p>
            
            {earned && earnedAt && (
              <p className="text-sm text-muted-foreground">
                Earned on {format(new Date(earnedAt), "MMMM d, yyyy")}
              </p>
            )}

            {!earned && threshold && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{currentProgress} / {threshold}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", `bg-gradient-to-r ${getCategoryColor()}`)}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {category && (
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground capitalize">
                {category} badge
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

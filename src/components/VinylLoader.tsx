import { cn } from "@/lib/utils";

interface VinylLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const VinylLoader = ({ size = "md", className }: VinylLoaderProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Vinyl Record */}
      <div className="absolute inset-0 rounded-full bg-vinyl-black animate-spin-vinyl shadow-glow">
        {/* Grooves */}
        <div className="absolute inset-[15%] rounded-full border border-vinyl-groove" />
        <div className="absolute inset-[25%] rounded-full border border-vinyl-groove" />
        <div className="absolute inset-[35%] rounded-full border border-vinyl-groove" />
        
        {/* Label */}
        <div className="absolute inset-[40%] rounded-full bg-primary flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      </div>
    </div>
  );
};

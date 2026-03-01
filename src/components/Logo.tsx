import { memo } from "react";
import logoImage from "@/assets/Adobe_Express_-_file.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 48, height: 48 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 120 },
};

export const Logo = memo(({ size = "md", showText = false }: LogoProps) => {
  const dimensions = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <img
        src={logoImage}
        alt="Remelic"
        width={dimensions.width}
        height={dimensions.height}
        className="flex-shrink-0"
      />

      {showText && (
        <span className="font-display font-bold text-lg sm:text-xl">
          <span className="text-primary">Remelic</span>
        </span>
      )}
    </div>
  );
});

Logo.displayName = "Logo";

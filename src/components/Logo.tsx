import { memo } from "react";
import { useTheme } from "@/hooks/useTheme";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const getThemeColors = (theme: string) => {
  const colorMap: Record<string, { circle: string; vinyl: string; needle: string; accent: string }> = {
    "navy-gold": {
      circle: "#1e3a5f",
      vinyl: "#000000",
      needle: "#9b8b6f",
      accent: "#d4af37"
    },
    "neon-purple": {
      circle: "#7c3aed",
      vinyl: "#1e1b4b",
      needle: "#a78bfa",
      accent: "#fbbf24"
    },
    "ocean-blue": {
      circle: "#0369a1",
      vinyl: "#082f49",
      needle: "#7dd3fc",
      accent: "#06b6d4"
    },
    "sunset": {
      circle: "#dc2626",
      vinyl: "#7c2d12",
      needle: "#fb923c",
      accent: "#fbbf24"
    },
    "mint": {
      circle: "#059669",
      vinyl: "#064e3b",
      needle: "#6ee7b7",
      accent: "#a7f3d0"
    },
    "rose": {
      circle: "#be185d",
      vinyl: "#500724",
      needle: "#f472b6",
      accent: "#fbcfe8"
    },
    "crimson": {
      circle: "#be123c",
      vinyl: "#4c0519",
      needle: "#f43f5e",
      accent: "#fda4af"
    },
    "lavender": {
      circle: "#6d28d9",
      vinyl: "#3730a3",
      needle: "#c4b5fd",
      accent: "#e0e7ff"
    },
    "teal": {
      circle: "#0d9488",
      vinyl: "#134e4a",
      needle: "#2dd4bf",
      accent: "#5eead4"
    },
    "amber": {
      circle: "#b45309",
      vinyl: "#78350f",
      needle: "#fcd34d",
      accent: "#fde047"
    },
    "light": {
      circle: "#6b7280",
      vinyl: "#1f2937",
      needle: "#d1d5db",
      accent: "#fbbf24"
    },
    "default": {
      circle: "#1e3a5f",
      vinyl: "#000000",
      needle: "#9b8b6f",
      accent: "#d4af37"
    }
  };

  return colorMap[theme] || colorMap["default"];
};

const sizeMap = {
  sm: { width: 32, height: 32, viewBox: "0 0 120 120" },
  md: { width: 40, height: 40, viewBox: "0 0 120 120" },
  lg: { width: 64, height: 64, viewBox: "0 0 120 120" },
};

export const Logo = memo(({ size = "md", showText = false }: LogoProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const dimensions = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={dimensions.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke={colors.circle}
          strokeWidth="8"
          fill="none"
        />

        {/* Vinyl record */}
        <circle cx="60" cy="60" r="40" fill={colors.vinyl} />

        {/* Vinyl grooves */}
        <circle cx="60" cy="60" r="30" stroke={colors.needle} strokeWidth="1" fill="none" opacity="0.3" />
        <circle cx="60" cy="60" r="20" stroke={colors.needle} strokeWidth="1" fill="none" opacity="0.3" />

        {/* Center label */}
        <circle cx="60" cy="60" r="12" fill={colors.circle} />

        {/* Needle arm */}
        <line x1="60" y1="60" x2="85" y2="35" stroke={colors.needle} strokeWidth="6" strokeLinecap="round" />

        {/* Needle head */}
        <circle cx="87" cy="33" r="6" fill={colors.needle} />

        {/* Accent highlight on vinyl */}
        <path
          d="M 45 65 Q 50 80 65 82"
          stroke={colors.accent}
          strokeWidth="2"
          fill="none"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <span className="font-display font-bold text-lg sm:text-xl">
          <span className="text-primary">Remelic</span>
        </span>
      )}
    </div>
  );
});

Logo.displayName = "Logo";

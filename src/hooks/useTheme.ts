import { useState, useEffect } from "react";

export type ColorTheme = "default" | "neon-purple" | "ocean-blue" | "sunset" | "mint";

const THEME_KEY = "ratethemusic-theme";

export const useTheme = () => {
  const [theme, setThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_KEY) as ColorTheme | null;
      return saved || "default";
    }
    return "default";
  });

  useEffect(() => {
    // Apply theme on mount
    applyTheme(theme);
  }, []);

  const applyTheme = (newTheme: ColorTheme) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "theme-neon-purple",
      "theme-ocean-blue",
      "theme-sunset",
      "theme-mint"
    );

    // Add new theme class if not default
    if (newTheme !== "default") {
      document.documentElement.classList.add(`theme-${newTheme}`);
    }
  };

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
};

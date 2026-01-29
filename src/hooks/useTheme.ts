import { useState, useEffect } from "react";

export type ColorTheme = 
  | "default" 
  | "neon-purple" 
  | "ocean-blue" 
  | "sunset" 
  | "mint"
  | "rose"
  | "crimson"
  | "lavender"
  | "teal"
  | "amber"
  | "light"
  | "navy-gold";

const THEME_KEY = "ratethemusic-theme";

const ALL_THEME_CLASSES = [
  "theme-neon-purple",
  "theme-ocean-blue",
  "theme-sunset",
  "theme-mint",
  "theme-rose",
  "theme-crimson",
  "theme-lavender",
  "theme-teal",
  "theme-amber",
  "theme-light",
  "theme-navy-gold",
];

export const useTheme = () => {
  const [theme, setThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_KEY) as ColorTheme | null;
      return saved || "navy-gold";
    }
    return "navy-gold";
  });

  useEffect(() => {
    // Apply theme on mount
    applyTheme(theme);
  }, []);

  const applyTheme = (newTheme: ColorTheme) => {
    // Remove all theme classes
    document.documentElement.classList.remove(...ALL_THEME_CLASSES);

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

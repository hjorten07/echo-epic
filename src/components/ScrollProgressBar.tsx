import { useState, useEffect, useCallback } from "react";

/**
 * A scroll progress bar that sits directly under the navbar.
 * Shows how far the user has scrolled down the page.
 * Color-matched to the active theme via the primary CSS variable.
 */
export const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setScrollProgress(0);
      return;
    }
    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    // Use passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (scrollProgress === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-[width] duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

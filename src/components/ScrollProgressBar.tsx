import { useEffect, useRef } from "react";

/**
 * Scroll progress bar using direct DOM manipulation
 * to avoid React re-renders on every scroll event.
 */
export const ScrollProgressBar = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        bar.style.width = "0%";
        return;
      }
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      bar.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-50 h-[2px] sm:h-[3px] bg-transparent pointer-events-none">
      <div
        ref={barRef}
        className="h-full bg-primary"
        style={{ width: "0%", transition: "width 75ms ease-out" }}
      />
    </div>
  );
};

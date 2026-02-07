import { useEffect, useRef, memo } from "react";

interface GridWaveEffectProps {
  className?: string;
}

/**
 * Interactive grid wave effect that responds to cursor movement.
 * Optimized: pauses when off-screen, disabled on mobile, caches CSS vars.
 */
export const GridWaveEffect = memo(({ className = "" }: GridWaveEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Skip entirely on mobile/tablet for performance
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;
    let animationFrameId: number;

    // Cache CSS vars (re-read only on theme change)
    let cachedH = "38", cachedS = "76%", cachedL = "55%";
    const readCssVars = () => {
      const style = getComputedStyle(document.documentElement);
      const parts = style.getPropertyValue("--primary").trim().split(/\s+/);
      cachedH = parts[0] || "38";
      cachedS = parts[1] || "76%";
      cachedL = parts[2] || "55%";
    };
    readCssVars();

    // Watch for theme changes
    const themeObserver = new MutationObserver(readCssVars);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Pause when not visible
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gridSize = 50;
    const waveSpeed = 120;
    const waveDuration = 800;
    const waveInterval = 150;

    const waves: Array<{ x: number; y: number; opacity: number; startTime: number }> = [];
    const mouse = { x: 0, y: 0, lastX: 0, lastY: 0 };
    let lastWaveTime = 0;
    let lastMoveTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 32) return;
      lastMoveTime = now;

      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      if (now - lastWaveTime > waveInterval) {
        const dx = mouse.x - mouse.lastX;
        const dy = mouse.y - mouse.lastY;
        if (dx * dx + dy * dy > 225) {
          waves.push({ x: mouse.x, y: mouse.y, opacity: 0.4, startTime: now });
          if (waves.length > 8) waves.shift();
          lastWaveTime = now;
          mouse.lastX = mouse.x;
          mouse.lastY = mouse.y;
        }
      }
    };
    document.addEventListener("mousemove", handleMouseMove);

    let lastFrameTime = 0;
    const frameInterval = 1000 / 30;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;
      if (currentTime - lastFrameTime < frameInterval) return;
      lastFrameTime = currentTime - ((currentTime - lastFrameTime) % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      ctx.globalCompositeOperation = "screen";

      for (let x = gridSize / 2; x < canvas.width; x += gridSize) {
        for (let y = gridSize / 2; y < canvas.height; y += gridSize) {
          let totalInfluence = 0;

          for (const wave of waves) {
            const age = now - wave.startTime;
            if (age > waveDuration) continue;

            const currentRadius = (age / 1000) * waveSpeed;
            const dx = x - wave.x;
            const dy = y - wave.y;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            const ringWidth = 25;
            const distFromRing = Math.abs(distFromCenter - currentRadius);

            if (distFromRing < ringWidth) {
              totalInfluence += (1 - distFromRing / ringWidth) * (1 - age / waveDuration) * wave.opacity;
            }
          }

          const opacity = Math.min(0.5, 0.06 + totalInfluence * 0.4);
          const size = 1.5 + totalInfluence * 2.5;

          ctx.fillStyle = `hsla(${cachedH}, ${cachedS}, ${cachedL}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();

          if (totalInfluence > 0.15) {
            ctx.shadowColor = `hsla(${cachedH}, ${cachedS}, ${cachedL}, ${totalInfluence * 0.3})`;
            ctx.shadowBlur = totalInfluence * 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.globalCompositeOperation = "source-over";
      for (const wave of waves) {
        const age = now - wave.startTime;
        if (age > waveDuration) continue;
        const currentRadius = (age / 1000) * waveSpeed;
        const timeFade = 1 - age / waveDuration;
        ctx.strokeStyle = `hsla(${cachedH}, ${cachedS}, ${cachedL}, ${timeFade * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Clean old waves
      let i = waves.length;
      while (i--) {
        if (now - waves[i].startTime > waveDuration) waves.splice(i, 1);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
});

GridWaveEffect.displayName = "GridWaveEffect";

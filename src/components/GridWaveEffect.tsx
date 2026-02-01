import { useEffect, useRef, memo } from "react";

interface GridWaveEffectProps {
  className?: string;
}

/**
 * Interactive grid wave effect that responds to cursor movement.
 * Creates music visualizer-like waves pulsing outward from cursor in a grid pattern.
 * Only active for Navy Gold theme.
 */
export const GridWaveEffect = memo(({ className = "" }: GridWaveEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wavesRef = useRef<Array<{
    x: number;
    y: number;
    radius: number;
    opacity: number;
    startTime: number;
  }>>([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });
  const lastWaveTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Effect is now available on all themes
    const checkTheme = () => {
      return true; // Enable for all color schemes
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Grid settings - optimized for performance
    const gridSize = 50; // Larger grid = fewer points to render
    const waveSpeed = 120; // Slightly slower for smoother animation
    const waveDuration = 800; // Shorter duration = fewer active waves
    const waveInterval = 150; // Less frequent waves

    let lastMoveTime = 0;
    const throttleMs = 32; // ~30fps for mouse tracking

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      
      // Throttle mouse move processing
      if (now - lastMoveTime < throttleMs) return;
      lastMoveTime = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      // Create new wave if enough time passed
      if (now - lastWaveTimeRef.current > waveInterval && checkTheme()) {
        // Calculate distance moved
        const dx = mouseRef.current.x - mouseRef.current.lastX;
        const dy = mouseRef.current.y - mouseRef.current.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 15) { // Require more movement
          wavesRef.current.push({
            x: mouseRef.current.x,
            y: mouseRef.current.y,
            radius: 0,
            opacity: 0.4, // Slightly lower opacity
            startTime: now,
          });
          
          // Limit waves array size - fewer concurrent waves
          if (wavesRef.current.length > 8) {
            wavesRef.current.shift();
          }
          
          lastWaveTimeRef.current = now;
          mouseRef.current.lastX = mouseRef.current.x;
          mouseRef.current.lastY = mouseRef.current.y;
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    let lastFrameTime = 0;
    const targetFps = 30; // Cap at 30fps for performance
    const frameInterval = 1000 / targetFps;

    const animate = (currentTime: number) => {
      if (!ctx || !canvas) return;
      
      // Throttle frame rate
      const elapsed = currentTime - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime - (elapsed % frameInterval);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // Get primary color from CSS (cache this)
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryHsl = computedStyle.getPropertyValue("--primary").trim();
      const hslParts = primaryHsl.split(/\s+/);
      const h = hslParts[0] || "38";
      const s = hslParts[1] || "76%";
      const l = hslParts[2] || "55%";

      // Draw grid points with wave influence
      ctx.globalCompositeOperation = "screen";
      
      for (let x = gridSize / 2; x < canvas.width; x += gridSize) {
        for (let y = gridSize / 2; y < canvas.height; y += gridSize) {
          let totalInfluence = 0;
          
          // Calculate influence from all active waves
          for (const wave of wavesRef.current) {
            const age = now - wave.startTime;
            if (age > waveDuration) continue;
            
            const currentRadius = (age / 1000) * waveSpeed;
            const dx = x - wave.x;
            const dy = y - wave.y;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            
            // Wave ring effect
            const ringWidth = 25;
            const distFromRing = Math.abs(distFromCenter - currentRadius);
            
            if (distFromRing < ringWidth) {
              const ringFade = 1 - (distFromRing / ringWidth);
              const timeFade = 1 - (age / waveDuration);
              totalInfluence += ringFade * timeFade * wave.opacity;
            }
          }

          // Draw grid point with influence
          const baseOpacity = 0.06;
          const opacity = Math.min(0.5, baseOpacity + totalInfluence * 0.4);
          const size = 1.5 + totalInfluence * 2.5;
          
          ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow for active points (simplified)
          if (totalInfluence > 0.15) {
            ctx.shadowColor = `hsla(${h}, ${s}, ${l}, ${totalInfluence * 0.3})`;
            ctx.shadowBlur = totalInfluence * 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw wave rings (simplified)
      ctx.globalCompositeOperation = "source-over";
      for (const wave of wavesRef.current) {
        const age = now - wave.startTime;
        if (age > waveDuration) continue;
        
        const currentRadius = (age / 1000) * waveSpeed;
        const timeFade = 1 - (age / waveDuration);
        
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${timeFade * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Clean up old waves
      wavesRef.current = wavesRef.current.filter(
        wave => now - wave.startTime < waveDuration
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
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

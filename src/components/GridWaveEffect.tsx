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

    // Grid settings
    const gridSize = 40;
    const waveSpeed = 150; // pixels per second
    const waveDuration = 1000; // ms
    const waveInterval = 100; // ms between waves

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      // Create new wave if enough time passed
      const now = Date.now();
      if (now - lastWaveTimeRef.current > waveInterval && checkTheme()) {
        // Calculate distance moved
        const dx = mouseRef.current.x - mouseRef.current.lastX;
        const dy = mouseRef.current.y - mouseRef.current.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
          wavesRef.current.push({
            x: mouseRef.current.x,
            y: mouseRef.current.y,
            radius: 0,
            opacity: 0.5,
            startTime: now,
          });
          
          // Limit waves array size
          if (wavesRef.current.length > 15) {
            wavesRef.current.shift();
          }
          
          lastWaveTimeRef.current = now;
          mouseRef.current.lastX = mouseRef.current.x;
          mouseRef.current.lastY = mouseRef.current.y;
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // Get primary color from CSS
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
            const ringWidth = 30;
            const distFromRing = Math.abs(distFromCenter - currentRadius);
            
            if (distFromRing < ringWidth) {
              const ringFade = 1 - (distFromRing / ringWidth);
              const timeFade = 1 - (age / waveDuration);
              totalInfluence += ringFade * timeFade * wave.opacity;
            }
          }

          // Draw grid point with influence
          const baseOpacity = 0.08;
          const opacity = Math.min(0.6, baseOpacity + totalInfluence * 0.5);
          const size = 2 + totalInfluence * 3;
          
          ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow for active points
          if (totalInfluence > 0.1) {
            ctx.shadowColor = `hsla(${h}, ${s}, ${l}, ${totalInfluence * 0.4})`;
            ctx.shadowBlur = totalInfluence * 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw wave rings
      ctx.globalCompositeOperation = "source-over";
      for (const wave of wavesRef.current) {
        const age = now - wave.startTime;
        if (age > waveDuration) continue;
        
        const currentRadius = (age / 1000) * waveSpeed;
        const timeFade = 1 - (age / waveDuration);
        
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${timeFade * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Clean up old waves
      wavesRef.current = wavesRef.current.filter(
        wave => now - wave.startTime < waveDuration
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

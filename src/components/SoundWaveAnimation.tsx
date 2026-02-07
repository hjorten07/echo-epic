import { useEffect, useRef, memo } from "react";

interface SoundWaveAnimationProps {
  className?: string;
}

/**
 * Sound wave animation bars.
 * Optimized: pauses when off-screen, disabled on mobile, caches CSS vars, 30fps cap.
 */
export const SoundWaveAnimation = memo(({ className = "" }: SoundWaveAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Skip on mobile for performance
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;
    let animationFrameId: number;

    // Cache CSS vars
    let cachedH = "25", cachedS = "100%", cachedL = "55%";
    const readCssVars = () => {
      const style = getComputedStyle(document.documentElement);
      const parts = style.getPropertyValue("--primary").trim().split(/\s+/);
      cachedH = parts[0] || "25";
      cachedS = parts[1] || "100%";
      cachedL = parts[2] || "55%";
    };
    readCssVars();

    const themeObserver = new MutationObserver(readCssVars);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = 140;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const mousePos = { x: 0, y: 0, active: false };
    let lastMoveTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 32) return;
      lastMoveTime = now;

      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      mousePos.active = true;
    };

    const handleMouseLeave = () => { mousePos.active = false; };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 30;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;
      if (currentTime - lastFrameTime < frameInterval) return;
      lastFrameTime = currentTime - ((currentTime - lastFrameTime) % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bars = 60;
      const barWidth = canvas.width / bars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;

        let influence = 0;
        if (mousePos.active) {
          const dx = x - mousePos.x;
          const dy = Math.abs(mousePos.y - centerY);
          influence = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 200);
        }

        const waveOffset = i * 0.12;
        const baseAmplitude = 6 + Math.sin(time * 0.025 + waveOffset) * 6;
        const secondaryWave = Math.sin(time * 0.04 + i * 0.18) * 5;
        const tertiaryWave = Math.sin(time * 0.015 + i * 0.35) * 3;
        const mouseAmplitude = influence * 50;

        const barHeight = Math.max(4, baseAmplitude + secondaryWave + tertiaryWave + mouseAmplitude);

        const baseOpacity = 0.2 + Math.sin(time * 0.018 + i * 0.08) * 0.1;
        const opacity = Math.min(0.9, baseOpacity + influence * 0.6);

        const barWidthActual = barWidth * 0.45;
        const radius = barWidthActual / 2;
        const left = x - barWidthActual / 2;
        const top = centerY - barHeight;
        const height = barHeight * 2;

        if (influence > 0.3) {
          ctx.shadowColor = `hsla(${cachedH}, ${cachedS}, ${cachedL}, ${influence * 0.5})`;
          ctx.shadowBlur = influence * 15;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `hsla(${cachedH}, ${cachedS}, ${cachedL}, ${opacity})`;
        ctx.beginPath();

        if (height > radius * 2) {
          ctx.roundRect(left, top, barWidthActual, height, radius);
        } else {
          ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      time++;
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[140px] ${className}`}
    />
  );
});

SoundWaveAnimation.displayName = "SoundWaveAnimation";

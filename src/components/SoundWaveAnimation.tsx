import { useEffect, useRef } from "react";

interface SoundWaveAnimationProps {
  className?: string;
}

export const SoundWaveAnimation = ({ className = "" }: SoundWaveAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = 140;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse globally on the entire document
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mousePos.current.active = false;
    };

    // Listen to mouse movement on the entire document
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get primary color from CSS variable
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryHsl = computedStyle.getPropertyValue("--primary").trim();
      
      const hslParts = primaryHsl.split(/\s+/);
      const h = hslParts[0] || "25";
      const s = hslParts[1] || "100%";
      const l = hslParts[2] || "55%";
      
      const bars = 60;
      const barWidth = canvas.width / bars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        
        // Calculate distance from mouse for interactive ripple effect
        let influence = 0;
        if (mousePos.current.active) {
          const dx = x - mousePos.current.x;
          const dy = Math.abs(mousePos.current.y - centerY);
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Larger influence radius for smoother tracking
          influence = Math.max(0, 1 - distance / 200);
        }

        // Create varied wave pattern with multiple frequencies
        const waveOffset = i * 0.12;
        const baseAmplitude = 6 + Math.sin(time * 0.025 + waveOffset) * 6;
        const secondaryWave = Math.sin(time * 0.04 + i * 0.18) * 5;
        const tertiaryWave = Math.sin(time * 0.015 + i * 0.35) * 3;
        
        // Mouse influence creates a ripple effect that spreads from cursor
        const mouseAmplitude = influence * 50;
        
        const barHeight = Math.max(4, baseAmplitude + secondaryWave + tertiaryWave + mouseAmplitude);
        
        // Opacity based on position and mouse influence
        const baseOpacity = 0.2 + Math.sin(time * 0.018 + i * 0.08) * 0.1;
        const opacity = Math.min(0.9, baseOpacity + influence * 0.6);
        
        // Draw bar with rounded caps (pill shape like reference image)
        const barWidthActual = barWidth * 0.45;
        const radius = barWidthActual / 2;
        const left = x - barWidthActual / 2;
        const top = centerY - barHeight;
        const height = barHeight * 2;
        
        // Add glow effect when mouse is near
        if (influence > 0.3) {
          ctx.shadowColor = `hsla(${h}, ${s}, ${l}, ${influence * 0.5})`;
          ctx.shadowBlur = influence * 15;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${opacity})`;
        ctx.beginPath();
        
        if (height > radius * 2) {
          ctx.roundRect(left, top, barWidthActual, height, radius);
        } else {
          ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[140px] ${className}`}
    />
  );
};

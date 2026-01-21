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
        canvas.height = 120; // Fixed height for the wave
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

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

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get primary color from CSS variable - parse HSL values properly
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryHsl = computedStyle.getPropertyValue("--primary").trim();
      
      // The value is like "25 100% 55%" - we need to parse it
      const hslParts = primaryHsl.split(/\s+/);
      const h = hslParts[0] || "25";
      const s = hslParts[1] || "100%";
      const l = hslParts[2] || "55%";
      
      const bars = 50;
      const barWidth = canvas.width / bars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        
        // Calculate distance from mouse for interactive effect
        let influence = 0;
        if (mousePos.current.active) {
          const dx = x - mousePos.current.x;
          const dy = centerY - mousePos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          influence = Math.max(0, 1 - distance / 150);
        }

        // Create varied wave pattern - different frequencies for different bars
        const waveOffset = i * 0.15;
        const baseAmplitude = 8 + Math.sin(time * 0.03 + waveOffset) * 8;
        const secondaryWave = Math.sin(time * 0.05 + i * 0.2) * 6;
        const tertiaryWave = Math.sin(time * 0.02 + i * 0.4) * 4;
        
        // Mouse influence adds extra height
        const mouseAmplitude = influence * 35;
        
        const barHeight = Math.max(4, baseAmplitude + secondaryWave + tertiaryWave + mouseAmplitude);
        
        // Calculate opacity based on position and mouse
        const baseOpacity = 0.15 + Math.sin(time * 0.02 + i * 0.1) * 0.1;
        const opacity = baseOpacity + influence * 0.5;
        
        // Draw bar with rounded caps (like the reference image)
        ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${opacity})`;
        ctx.beginPath();
        
        const barWidthActual = barWidth * 0.4;
        const radius = barWidthActual / 2;
        
        // Draw rounded rectangle (pill shape like the reference)
        const left = x - barWidthActual / 2;
        const top = centerY - barHeight;
        const bottom = centerY + barHeight;
        const height = barHeight * 2;
        
        if (height > radius * 2) {
          ctx.roundRect(left, top, barWidthActual, height, radius);
        } else {
          // For very small bars, just draw a circle
          ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[120px] cursor-crosshair ${className}`}
      style={{ opacity: 0.8 }}
    />
  );
};

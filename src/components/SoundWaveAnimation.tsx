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
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
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

      // Get primary color from CSS and convert to comma-separated format
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryHsl = computedStyle.getPropertyValue("--primary").trim();
      // Convert "25 100% 55%" to "25, 100%, 55%" for hsla()
      const primaryHslCommas = primaryHsl.replace(/\s+/g, ", ");
      
      const bars = 40;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        
        // Calculate distance from mouse
        let influence = 0;
        if (mousePos.current.active) {
          const dx = x - mousePos.current.x;
          const dy = canvas.height / 2 - mousePos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          influence = Math.max(0, 1 - distance / 200);
        }

        // Wave amplitude based on position and mouse influence
        const baseAmplitude = 10 + Math.sin(time * 0.02 + i * 0.3) * 10;
        const mouseAmplitude = influence * 40;
        const amplitude = baseAmplitude + mouseAmplitude;

        const barHeight = amplitude + Math.sin(time * 0.05 + i * 0.5) * 15;
        
        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, canvas.height / 2 - barHeight, x, canvas.height / 2 + barHeight);
        gradient.addColorStop(0, `hsla(${primaryHslCommas}, ${0.1 + influence * 0.4})`);
        gradient.addColorStop(0.5, `hsla(${primaryHslCommas}, ${0.2 + influence * 0.5})`);
        gradient.addColorStop(1, `hsla(${primaryHslCommas}, ${0.1 + influence * 0.4})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
          x - barWidth * 0.3,
          canvas.height / 2 - barHeight,
          barWidth * 0.6,
          barHeight * 2,
          3
        );
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
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ opacity: 0.3 }}
    />
  );
};

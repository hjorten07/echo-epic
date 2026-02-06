import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { cn, normalizeImageUrl } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  placeholderClassName?: string;
  /** Skip lazy loading — use for above-the-fold images */
  priority?: boolean;
}

/**
 * Optimized lazy loading image component with:
 * - Intersection Observer for viewport-based loading
 * - Immediate viewport check on mount (fixes first-image-not-loading)
 * - Priority prop to skip lazy loading for above-the-fold content
 * - HTTPS normalization for mixed-content prevention
 * - Fade-in animation on load
 * - Built-in error fallback
 * - Memoized to prevent unnecessary re-renders
 */
export const LazyImage = memo(forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, alt, className, fallback, placeholderClassName, priority, ...props }, ref) => {
    const normalizedSrc = normalizeImageUrl(src) || src;
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(!!priority);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (priority) return; // Skip observer for priority images

      const element = imgRef.current;
      if (!element) return;

      // Immediately check if already in viewport
      const rect = element.getBoundingClientRect();
      if (
        rect.top < window.innerHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < window.innerWidth + 100 &&
        rect.right > -100
      ) {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }, [priority]);

    // Reset state when src changes
    useEffect(() => {
      setIsLoaded(false);
      setHasError(false);
    }, [normalizedSrc]);

    if (!normalizedSrc || hasError) {
      return (
        <div 
          ref={imgRef}
          className={cn(
            "flex items-center justify-center bg-secondary",
            placeholderClassName || className
          )}
        >
          {fallback || (
            <span className="text-muted-foreground text-lg font-bold">
              {alt?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
      );
    }

    return (
      <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
        {/* Placeholder shown while loading */}
        {!isLoaded && (
          <div
            className={cn(
              "absolute inset-0 bg-secondary animate-pulse",
              placeholderClassName
            )}
          />
        )}
        
        {/* Only load image when in viewport */}
        {isInView && (
          <img
            ref={ref}
            src={normalizedSrc}
            alt={alt || ""}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            {...props}
          />
        )}
      </div>
    );
  }
));

LazyImage.displayName = "LazyImage";

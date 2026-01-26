import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  placeholderClassName?: string;
}

/**
 * Optimized lazy loading image component with:
 * - Intersection Observer for viewport-based loading
 * - Fade-in animation on load
 * - Built-in error fallback
 * - Memoized to prevent unnecessary re-renders
 */
export const LazyImage = memo(forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, alt, className, fallback, placeholderClassName, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "100px" } // Start loading 100px before entering viewport
      );

      const element = imgRef.current;
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }, []);

    // Reset state when src changes
    useEffect(() => {
      setIsLoaded(false);
      setHasError(false);
    }, [src]);

    if (!src || hasError) {
      return (
        <div 
          ref={imgRef as any}
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
            src={src}
            alt={alt || ""}
            loading="lazy"
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

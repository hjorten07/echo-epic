import { useState, useEffect, memo, useRef } from "react";
import { getCoverArt, getRecording } from "@/lib/musicbrainz";
import { coverArtCache, recordingReleaseCache } from "@/lib/coverArtCache";
import { cn } from "@/lib/utils";

interface RatingItemImageProps {
  itemId: string;
  itemType: "artist" | "album" | "song";
  itemImage: string | null;
  itemName: string;
  className?: string;
}

/**
 * Optimized rating item image component with:
 * - Global caching to prevent duplicate API calls
 * - Intersection observer for lazy loading
 * - Deduped in-flight requests
 * - Memoized to prevent re-renders
 */
export const RatingItemImage = memo(({
  itemId,
  itemType,
  itemImage,
  itemName,
  className = "w-10 h-10",
}: RatingItemImageProps) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(itemImage);
  const [loading, setLoading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // If we already have an image or it's not a song, use existing
    if (itemImage || itemType !== "song") {
      setCoverUrl(itemImage);
      return;
    }

    // Don't fetch until in view
    if (!isInView) return;

    const cacheKey = `song_${itemId}`;

    // Check cache first
    const cachedUrl = coverArtCache.get(cacheKey);
    if (cachedUrl !== undefined) {
      setCoverUrl(cachedUrl);
      return;
    }

    // Check if there's already a pending request
    const pendingRequest = coverArtCache.getPendingRequest(cacheKey);
    if (pendingRequest) {
      pendingRequest.then((url) => setCoverUrl(url));
      return;
    }

    // Fetch cover art for songs without images
    const fetchCoverArt = async (): Promise<string | null> => {
      try {
        // First check recording cache
        let releaseInfo = recordingReleaseCache.get(itemId);

        if (releaseInfo === undefined) {
          // Check for pending recording request
          const pendingRecording = recordingReleaseCache.getPendingRequest(itemId);
          if (pendingRecording) {
            releaseInfo = await pendingRecording;
          } else {
            // Fetch recording info
            const recordingPromise = (async () => {
              const recording = await getRecording(itemId);
              if (recording?.releases?.[0]) {
                const release = recording.releases[0];
                const releaseGroupId = release["release-group"]?.id;
                if (releaseGroupId) {
                  return { releaseGroupId, releaseId: release.id };
                }
              }
              return null;
            })();

            recordingReleaseCache.setPendingRequest(itemId, recordingPromise);
            releaseInfo = await recordingPromise;
            recordingReleaseCache.set(itemId, releaseInfo);
          }
        }

        if (releaseInfo) {
          const cover = await getCoverArt(releaseInfo.releaseGroupId, releaseInfo.releaseId);
          coverArtCache.set(cacheKey, cover);
          return cover;
        }

        coverArtCache.set(cacheKey, null);
        return null;
      } catch {
        coverArtCache.set(cacheKey, null);
        return null;
      }
    };

    setLoading(true);
    const promise = fetchCoverArt();
    coverArtCache.setPendingRequest(cacheKey, promise);
    promise.then((url) => {
      setCoverUrl(url);
      setLoading(false);
    });
  }, [itemId, itemType, itemImage, isInView]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "rounded bg-muted flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {loading ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : coverUrl ? (
        <img 
          src={coverUrl} 
          alt={itemName} 
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="text-xs font-bold text-muted-foreground">
          {itemName[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
});

RatingItemImage.displayName = "RatingItemImage";

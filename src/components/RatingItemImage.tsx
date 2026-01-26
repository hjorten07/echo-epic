import { useState, useEffect } from "react";
import { getCoverArt, getRecording } from "@/lib/musicbrainz";

// Global cache for cover art URLs
const coverArtCache = new Map<string, string | null>();

interface RatingItemImageProps {
  itemId: string;
  itemType: "artist" | "album" | "song";
  itemImage: string | null;
  itemName: string;
  className?: string;
}

export const RatingItemImage = ({
  itemId,
  itemType,
  itemImage,
  itemName,
  className = "w-10 h-10",
}: RatingItemImageProps) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(itemImage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we already have an image or it's not a song, use existing
    if (itemImage || itemType !== "song") {
      setCoverUrl(itemImage);
      return;
    }

    // Check cache first
    const cacheKey = `song_${itemId}`;
    if (coverArtCache.has(cacheKey)) {
      setCoverUrl(coverArtCache.get(cacheKey) || null);
      return;
    }

    // Fetch cover art for songs without images
    const fetchCoverArt = async () => {
      setLoading(true);
      try {
        const recording = await getRecording(itemId);
        if (recording?.releases?.[0]) {
          const release = recording.releases[0];
          const releaseGroupId = release["release-group"]?.id;
          if (releaseGroupId) {
            const cover = await getCoverArt(releaseGroupId, release.id);
            coverArtCache.set(cacheKey, cover);
            setCoverUrl(cover);
          } else {
            coverArtCache.set(cacheKey, null);
          }
        } else {
          coverArtCache.set(cacheKey, null);
        }
      } catch (error) {
        console.error("Error fetching cover art:", error);
        coverArtCache.set(cacheKey, null);
      }
      setLoading(false);
    };

    fetchCoverArt();
  }, [itemId, itemType, itemImage]);

  return (
    <div className={`${className} rounded bg-muted flex items-center justify-center overflow-hidden`}>
      {loading ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : coverUrl ? (
        <img 
          src={coverUrl} 
          alt={itemName} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xs font-bold text-muted-foreground">
          {itemName[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
};

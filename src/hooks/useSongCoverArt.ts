import { useState, useEffect, useRef } from "react";
import { getCoverArt, getRecording } from "@/lib/musicbrainz";
import { coverArtCache, recordingReleaseCache } from "@/lib/coverArtCache";

/**
 * Optimized hook for fetching song cover art with:
 * - Shared global cache
 * - Deduped in-flight requests
 * - Intersection observer support
 */
export const useSongCoverArt = (
  songId: string | undefined,
  existingImage: string | null | undefined
) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(existingImage || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we already have an image, use it
    if (existingImage) {
      setCoverUrl(existingImage);
      return;
    }

    // If no songId, skip
    if (!songId) return;

    const cacheKey = `song_${songId}`;

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

    const fetchCoverArt = async (): Promise<string | null> => {
      try {
        // First check recording cache
        let releaseInfo = recordingReleaseCache.get(songId);

        if (releaseInfo === undefined) {
          const recording = await getRecording(songId);
          if (recording?.releases?.[0]) {
            const release = recording.releases[0];
            const releaseGroupId = release["release-group"]?.id;
            if (releaseGroupId) {
              releaseInfo = { releaseGroupId, releaseId: release.id };
            }
          }
          recordingReleaseCache.set(songId, releaseInfo || null);
        }

        if (releaseInfo) {
          const cover = await getCoverArt(releaseInfo.releaseGroupId, releaseInfo.releaseId);
          coverArtCache.set(cacheKey, cover);
          return cover;
        }
        
        coverArtCache.set(cacheKey, null);
        return null;
      } catch (error) {
        console.error("Error fetching song cover art:", error);
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
  }, [songId, existingImage]);

  return { coverUrl, loading };
};

// Batch fetch cover art for multiple songs (optimized with shared cache)
export const batchFetchSongCoverArt = async (
  songs: Array<{ id: string; imageUrl?: string | null }>
): Promise<Map<string, string | null>> => {
  const results = new Map<string, string | null>();
  
  // Filter songs that need cover art (not already cached)
  const songsNeedingArt = songs.filter((song) => {
    const cacheKey = `song_${song.id}`;
    if (song.imageUrl) {
      results.set(song.id, song.imageUrl);
      return false;
    }
    const cached = coverArtCache.get(cacheKey);
    if (cached !== undefined) {
      results.set(song.id, cached);
      return false;
    }
    return true;
  });

  // Fetch in parallel batches of 5
  for (let i = 0; i < songsNeedingArt.length; i += 5) {
    const batch = songsNeedingArt.slice(i, i + 5);
    
    await Promise.all(
      batch.map(async (song) => {
        const cacheKey = `song_${song.id}`;
        try {
          let releaseInfo = recordingReleaseCache.get(song.id);
          
          if (releaseInfo === undefined) {
            const recording = await getRecording(song.id);
            if (recording?.releases?.[0]) {
              const release = recording.releases[0];
              const releaseGroupId = release["release-group"]?.id;
              if (releaseGroupId) {
                releaseInfo = { releaseGroupId, releaseId: release.id };
              }
            }
            recordingReleaseCache.set(song.id, releaseInfo || null);
          }

          if (releaseInfo) {
            const cover = await getCoverArt(releaseInfo.releaseGroupId, releaseInfo.releaseId);
            coverArtCache.set(cacheKey, cover);
            results.set(song.id, cover);
            return;
          }
          
          coverArtCache.set(cacheKey, null);
          results.set(song.id, null);
        } catch {
          coverArtCache.set(cacheKey, null);
          results.set(song.id, null);
        }
      })
    );
  }

  return results;
};

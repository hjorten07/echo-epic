import { useState, useEffect } from "react";
import { getCoverArt, getRecording } from "@/lib/musicbrainz";

// Cache for cover art URLs to avoid redundant API calls
const coverArtCache = new Map<string, string | null>();

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

    // Check cache first
    if (coverArtCache.has(songId)) {
      setCoverUrl(coverArtCache.get(songId) || null);
      return;
    }

    const fetchCoverArt = async () => {
      setLoading(true);
      try {
        // Fetch recording to get release info
        const recording = await getRecording(songId);
        if (recording?.releases?.[0]) {
          const release = recording.releases[0];
          const releaseGroupId = release["release-group"]?.id;
          if (releaseGroupId) {
            const cover = await getCoverArt(releaseGroupId, release.id);
            coverArtCache.set(songId, cover);
            setCoverUrl(cover);
          }
        }
      } catch (error) {
        console.error("Error fetching song cover art:", error);
      }
      setLoading(false);
    };

    fetchCoverArt();
  }, [songId, existingImage]);

  return { coverUrl, loading };
};

// Batch fetch cover art for multiple songs
export const batchFetchSongCoverArt = async (
  songs: Array<{ id: string; imageUrl?: string | null }>
): Promise<Map<string, string | null>> => {
  const results = new Map<string, string | null>();
  
  // Filter songs that need cover art
  const songsNeedingArt = songs.filter(
    (song) => !song.imageUrl && !coverArtCache.has(song.id)
  );

  // Return cached results for songs we already have
  songs.forEach((song) => {
    if (song.imageUrl) {
      results.set(song.id, song.imageUrl);
    } else if (coverArtCache.has(song.id)) {
      results.set(song.id, coverArtCache.get(song.id) || null);
    }
  });

  // Fetch in batches of 3 to respect rate limiting
  for (let i = 0; i < songsNeedingArt.length; i += 3) {
    const batch = songsNeedingArt.slice(i, i + 3);
    
    await Promise.all(
      batch.map(async (song) => {
        try {
          const recording = await getRecording(song.id);
          if (recording?.releases?.[0]) {
            const release = recording.releases[0];
            const releaseGroupId = release["release-group"]?.id;
            if (releaseGroupId) {
              const cover = await getCoverArt(releaseGroupId, release.id);
              coverArtCache.set(song.id, cover);
              results.set(song.id, cover);
              return;
            }
          }
          coverArtCache.set(song.id, null);
          results.set(song.id, null);
        } catch {
          coverArtCache.set(song.id, null);
          results.set(song.id, null);
        }
      })
    );
  }

  return results;
};

// ListenBrainz API Service
// API Documentation: https://listenbrainz.readthedocs.io/

const BASE_URL = "https://api.listenbrainz.org/1";

export interface PopularityStats {
  totalListenCount: number;
  listenerCount: number;
}

export interface RecommendedRecording {
  recording_mbid: string;
  recording_name?: string;
  artist_name?: string;
  release_name?: string;
  score?: number;
}

// Get popularity stats for a recording
export async function getRecordingPopularity(
  recordingMbid: string
): Promise<PopularityStats | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/popularity/recording/${recordingMbid}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      totalListenCount: data.total_listen_count || 0,
      listenerCount: data.total_user_count || 0,
    };
  } catch {
    return null;
  }
}

// Get popularity stats for an artist (by MBID)
export async function getArtistPopularity(
  artistMbid: string
): Promise<PopularityStats | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/popularity/artist/${artistMbid}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      totalListenCount: data.total_listen_count || 0,
      listenerCount: data.total_user_count || 0,
    };
  } catch {
    return null;
  }
}

// Get top recordings (globally popular)
export async function getTopRecordings(
  range: "week" | "month" | "year" | "all_time" = "week",
  count = 25
): Promise<RecommendedRecording[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/stats/sitewide/recordings?range=${range}&count=${count}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const recordings = data.payload?.recordings || [];
    
    return recordings.map((rec: any) => ({
      recording_mbid: rec.recording_mbid,
      recording_name: rec.track_name || rec.recording_name,
      artist_name: rec.artist_name,
      release_name: rec.release_name,
      score: rec.listen_count,
    }));
  } catch {
    return [];
  }
}

// Get top artists (globally popular)
export async function getTopArtists(
  range: "week" | "month" | "year" | "all_time" = "month",
  count = 25
): Promise<{ artist_mbid: string; artist_name: string; listen_count: number }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/stats/sitewide/artists?range=${range}&count=${count}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const artists = data.payload?.artists || [];
    
    return artists.map((artist: any) => ({
      artist_mbid: artist.artist_mbids?.[0] || "",
      artist_name: artist.artist_name,
      listen_count: artist.listen_count || 0,
    }));
  } catch {
    return [];
  }
}

// Get top release groups (albums) globally
export async function getTopReleaseGroups(
  range: "week" | "month" | "year" | "all_time" = "month",
  count = 25
): Promise<{ release_group_mbid: string; release_group_name: string; artist_name: string; listen_count: number }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/stats/sitewide/release-groups?range=${range}&count=${count}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const releaseGroups = data.payload?.release_groups || [];
    
    return releaseGroups.map((rg: any) => ({
      release_group_mbid: rg.release_group_mbid || "",
      release_group_name: rg.release_group_name,
      artist_name: rg.artist_name,
      listen_count: rg.listen_count || 0,
    }));
  } catch {
    return [];
  }
}

// Get similar artists based on an artist MBID
export async function getSimilarArtists(
  artistMbid: string,
  count = 10
): Promise<{ artist_mbid: string; artist_name: string; score: number }[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/similar/artists/${artistMbid}?algorithm=session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const similar = data.similar || [];
    
    return similar.slice(0, count).map((artist: any) => ({
      artist_mbid: artist.artist_mbid || "",
      artist_name: artist.artist_name || "",
      score: artist.score || 0,
    }));
  } catch {
    return [];
  }
}

// Get similar recordings based on a recording MBID
export async function getSimilarRecordings(
  recordingMbid: string,
  count = 10
): Promise<RecommendedRecording[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/similar/recordings/${recordingMbid}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const similar = data.similar || [];
    
    return similar.slice(0, count).map((rec: any) => ({
      recording_mbid: rec.recording_mbid || "",
      recording_name: rec.recording_name || "",
      artist_name: rec.artist_name || "",
      score: rec.score || 0,
    }));
  } catch {
    return [];
  }
}

// Batch get popularity for multiple recordings
export async function batchGetRecordingPopularity(
  recordingMbids: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  
  if (recordingMbids.length === 0) return results;
  
  // ListenBrainz has a bulk endpoint
  try {
    const response = await fetch(
      `${BASE_URL}/popularity/recording`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ recording_mbids: recordingMbids }),
      }
    );

    if (!response.ok) return results;

    const data = await response.json();
    
    // Map the results
    for (const mbid of recordingMbids) {
      const count = data[mbid]?.total_listen_count || 0;
      results.set(mbid, count);
    }
  } catch {
    // Fallback to 0 for all
    for (const mbid of recordingMbids) {
      results.set(mbid, 0);
    }
  }

  return results;
}

// Sort search results by ListenBrainz popularity
export function sortByPopularity<T extends { id: string }>(
  items: T[],
  popularityMap: Map<string, number>
): T[] {
  return [...items].sort((a, b) => {
    const popA = popularityMap.get(a.id) || 0;
    const popB = popularityMap.get(b.id) || 0;
    return popB - popA;
  });
}

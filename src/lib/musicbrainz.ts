// MusicBrainz API Service - CC0 Core Data Only
// API Documentation: https://musicbrainz.org/doc/MusicBrainz_API
// Cover Art Archive: https://coverartarchive.org (also CC0)

import { supabase } from "@/integrations/supabase/client";
import { batchGetRecordingPopularity, sortByPopularity } from "./listenbrainz";

const BASE_URL = "https://musicbrainz.org/ws/2";
const COVER_ART_URL = "https://coverartarchive.org";
const USER_AGENT = "RateTheMusic/1.0.0 (https://ratethemusic.app)";

// Rate limiting: MusicBrainz requires 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
  });
}

export interface MusicBrainzArtist {
  id: string;
  name: string;
  "sort-name": string;
  type?: string;
  country?: string;
  "life-span"?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  disambiguation?: string;
  tags?: Array<{ name: string; count: number }>;
  annotation?: string;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  "release-group"?: {
    id: string;
    "primary-type"?: string;
    title: string;
  };
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
  media?: Array<{
    tracks?: Array<{
      id: string;
      number: string;
      title: string;
      length?: number;
      recording: {
        id: string;
        title: string;
        length?: number;
      };
    }>;
  }>;
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number;
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
  releases?: MusicBrainzRelease[];
  tags?: Array<{ name: string; count: number }>;
}

export interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  "primary-type"?: string;
  "first-release-date"?: string;
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
  tags?: Array<{ name: string; count: number }>;
  annotation?: string;
}

export interface SearchResult {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  subtitle?: string;
  imageUrl?: string;
  popularity?: number;
}

// Image cache for cover art only
const imageCache = new Map<string, string | null>();

// Batch fetch cover art for albums from Cover Art Archive (CC0)
async function batchFetchCoverArt(ids: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  const uncachedIds = ids.filter(id => {
    const cacheKey = `album_${id}`;
    if (imageCache.has(cacheKey)) {
      results.set(id, imageCache.get(cacheKey) || null);
      return false;
    }
    return true;
  });
  
  if (uncachedIds.length === 0) return results;
  
  // Fetch in parallel chunks of 5
  const chunks: string[][] = [];
  for (let i = 0; i < uncachedIds.length; i += 5) {
    chunks.push(uncachedIds.slice(i, i + 5));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (id) => {
      try {
        const response = await fetch(
          `${COVER_ART_URL}/release-group/${id}`,
          { headers: { Accept: "application/json" } }
        );
        if (!response.ok) return { id, url: null };
        const data = await response.json();
        const front = data.images?.find((img: { front?: boolean }) => img.front);
        const url = front?.thumbnails?.small || front?.thumbnails?.["250"] || front?.image || data.images?.[0]?.thumbnails?.small || null;
        return { id, url };
      } catch {
        return { id, url: null };
      }
    });
    
    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(({ id, url }) => {
      imageCache.set(`album_${id}`, url);
      results.set(id, url);
    });
  }
  
  return results;
}

// Search for artists (including custom artists from database)
export async function searchArtists(query: string, limit = 25): Promise<SearchResult[]> {
  try {
    // Search MusicBrainz artists
    const response = await rateLimitedFetch(
      `${BASE_URL}/artist?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to search artists");
    
    const data = await response.json();
    const artists = (data.artists || []).slice(0, limit);
    
    const mbResults: SearchResult[] = artists.map((artist: MusicBrainzArtist) => ({
      id: artist.id,
      type: "artist" as const,
      name: artist.name,
      subtitle: artist.disambiguation || artist.country || artist.type,
      imageUrl: undefined, // No images for artists (CC0 compliance)
    }));

    // Also search custom artists from database
    const { data: customArtists } = await supabase
      .from("custom_artists")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(10);

    const customResults: SearchResult[] = (customArtists || []).map((artist) => ({
      id: `custom_${artist.id}`,
      type: "artist" as const,
      name: artist.name,
      subtitle: artist.type || "Custom Artist",
      imageUrl: artist.image_url || undefined,
    }));

    // Merge results, prioritizing custom artists at the top
    return [...customResults, ...mbResults].slice(0, limit);
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

// Search for releases (albums) - sorted by ListenBrainz popularity
export async function searchAlbums(query: string, limit = 25): Promise<SearchResult[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/release-group?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to search albums");
    
    const data = await response.json();
    const albums = (data["release-groups"] || []).slice(0, limit);
    
    // Batch fetch cover art from Cover Art Archive (CC0)
    const ids = albums.map((rg: MusicBrainzReleaseGroup) => rg.id);
    const images = await batchFetchCoverArt(ids);
    
    return albums.map((rg: MusicBrainzReleaseGroup) => ({
      id: rg.id,
      type: "album" as const,
      name: rg.title,
      subtitle: rg["artist-credit"]?.[0]?.artist?.name,
      imageUrl: images.get(rg.id) || undefined,
    }));
  } catch (error) {
    console.error("Error searching albums:", error);
    return [];
  }
}

// Search for recordings (songs) - sorted by ListenBrainz popularity
export async function searchSongs(query: string, limit = 25): Promise<SearchResult[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/recording?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to search songs");
    
    const data = await response.json();
    const songs = (data.recordings || []).slice(0, limit);
    
    // Get recording IDs for popularity lookup
    const recordingIds = songs.map((rec: MusicBrainzRecording) => rec.id);
    
    // Fetch popularity from ListenBrainz
    const popularityMap = await batchGetRecordingPopularity(recordingIds);
    
    const results: SearchResult[] = songs.map((rec: MusicBrainzRecording) => {
      const artistName = rec["artist-credit"]?.[0]?.artist?.name;
      return {
        id: rec.id,
        type: "song" as const,
        name: rec.title,
        subtitle: artistName,
        imageUrl: undefined, // No images for songs without album context
        popularity: popularityMap.get(rec.id) || 0,
      };
    });
    
    // Sort by popularity (most popular first)
    return sortByPopularity(results, popularityMap);
  } catch (error) {
    console.error("Error searching songs:", error);
    return [];
  }
}

// Combined search
export async function searchAll(query: string, limit = 10): Promise<SearchResult[]> {
  try {
    const [artists, albums, songs] = await Promise.all([
      searchArtists(query, limit),
      searchAlbums(query, limit),
      searchSongs(query, limit),
    ]);
    
    // Interleave results
    const results: SearchResult[] = [];
    const maxLen = Math.max(artists.length, albums.length, songs.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (artists[i]) results.push(artists[i]);
      if (albums[i]) results.push(albums[i]);
      if (songs[i]) results.push(songs[i]);
    }
    
    return results.slice(0, limit * 3);
  } catch (error) {
    console.error("Error in combined search:", error);
    return [];
  }
}

// Get artist details (CC0 core data only)
export async function getArtist(id: string): Promise<MusicBrainzArtist | null> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/artist/${id}?inc=tags+ratings&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get artist");
    
    return response.json();
  } catch (error) {
    console.error("Error getting artist:", error);
    return null;
  }
}

// Get artist's release groups (albums)
export async function getArtistReleaseGroups(artistId: string): Promise<MusicBrainzReleaseGroup[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/release-group?artist=${artistId}&type=album|ep&limit=100&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get artist releases");
    
    const data = await response.json();
    return data["release-groups"] || [];
  } catch (error) {
    console.error("Error getting artist releases:", error);
    return [];
  }
}

// Get release group (album) details
export async function getReleaseGroup(id: string): Promise<MusicBrainzReleaseGroup | null> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/release-group/${id}?inc=artists+tags+ratings&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get release group");
    
    return response.json();
  } catch (error) {
    console.error("Error getting release group:", error);
    return null;
  }
}

// Get releases for a release group (to get tracks)
export async function getReleasesForGroup(releaseGroupId: string): Promise<MusicBrainzRelease[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/release?release-group=${releaseGroupId}&inc=recordings+artist-credits&limit=1&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get releases");
    
    const data = await response.json();
    return data.releases || [];
  } catch (error) {
    console.error("Error getting releases:", error);
    return [];
  }
}

// Get recording (song) details
export async function getRecording(id: string): Promise<MusicBrainzRecording | null> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/recording/${id}?inc=artists+releases+release-groups+tags+ratings&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get recording");
    
    return response.json();
  } catch (error) {
    console.error("Error getting recording:", error);
    return null;
  }
}

// Get cover art for a release group (CC0 from Cover Art Archive)
export async function getCoverArt(releaseGroupId: string, releaseId?: string): Promise<string | null> {
  try {
    // First try release-group
    const response = await fetch(
      `${COVER_ART_URL}/release-group/${releaseGroupId}`,
      { headers: { Accept: "application/json" } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const front = data.images?.find((img: { front?: boolean }) => img.front);
      const url = front?.thumbnails?.small || front?.image || data.images?.[0]?.thumbnails?.small || null;
      if (url) return url;
    }
    
    // Fallback: try release directly if release-group has no art
    if (releaseId) {
      const releaseResponse = await fetch(
        `${COVER_ART_URL}/release/${releaseId}`,
        { headers: { Accept: "application/json" } }
      );
      
      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        const front = releaseData.images?.find((img: { front?: boolean }) => img.front);
        return front?.thumbnails?.small || front?.image || releaseData.images?.[0]?.thumbnails?.small || null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Format duration from milliseconds
export function formatDuration(ms?: number): string {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

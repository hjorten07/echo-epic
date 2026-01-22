// MusicBrainz API Service
// API Documentation: https://musicbrainz.org/doc/MusicBrainz_API

import { supabase } from "@/integrations/supabase/client";

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
}

export interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  "primary-type"?: string;
  "first-release-date"?: string;
  "artist-credit"?: Array<{
    artist: MusicBrainzArtist;
  }>;
}

export interface SearchResult {
  id: string;
  type: "artist" | "album" | "song";
  name: string;
  subtitle?: string;
  imageUrl?: string;
}

// Image cache to avoid refetching
const imageCache = new Map<string, string | null>();

// Batch fetch Wikipedia images for multiple names
async function batchFetchWikipediaImages(names: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  // Check cache first
  const uncachedNames = names.filter(name => {
    if (imageCache.has(name)) {
      results.set(name, imageCache.get(name) || null);
      return false;
    }
    return true;
  });
  
  if (uncachedNames.length === 0) return results;
  
  // Fetch images in parallel (limit to 5 concurrent)
  const chunks: string[][] = [];
  for (let i = 0; i < uncachedNames.length; i += 5) {
    chunks.push(uncachedNames.slice(i, i + 5));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (name) => {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
          { headers: { Accept: "application/json" } }
        );
        if (!response.ok) return { name, url: null };
        const data = await response.json();
        const url = data.thumbnail?.source || null;
        return { name, url };
      } catch {
        return { name, url: null };
      }
    });
    
    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(({ name, url }) => {
      imageCache.set(name, url);
      results.set(name, url);
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
    
    // Batch fetch images for all artists
    const names = artists.map((a: MusicBrainzArtist) => a.name);
    const images = await batchFetchWikipediaImages(names);
    
    const mbResults: SearchResult[] = artists.map((artist: MusicBrainzArtist) => ({
      id: artist.id,
      type: "artist" as const,
      name: artist.name,
      subtitle: artist.disambiguation || artist.country || artist.type,
      imageUrl: images.get(artist.name) || undefined,
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

// Batch fetch cover art for albums
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
          `https://coverartarchive.org/release-group/${id}`,
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

// Search for releases (albums)
export async function searchAlbums(query: string, limit = 25): Promise<SearchResult[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/release-group?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to search albums");
    
    const data = await response.json();
    const albums = (data["release-groups"] || []).slice(0, limit);
    
    // Batch fetch cover art
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

// Search for recordings (songs)
export async function searchSongs(query: string, limit = 25): Promise<SearchResult[]> {
  try {
    const response = await rateLimitedFetch(
      `${BASE_URL}/recording?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to search songs");
    
    const data = await response.json();
    const songs = (data.recordings || []).slice(0, limit);
    
    // Songs use artist images - fetch in parallel
    const artistNames = [...new Set(songs.map((rec: MusicBrainzRecording) => rec["artist-credit"]?.[0]?.artist?.name).filter(Boolean))] as string[];
    const images = await batchFetchWikipediaImages(artistNames);
    
    return songs.map((rec: MusicBrainzRecording) => {
      const artistName = rec["artist-credit"]?.[0]?.artist?.name;
      return {
        id: rec.id,
        type: "song" as const,
        name: rec.title,
        subtitle: artistName,
        imageUrl: artistName ? images.get(artistName) || undefined : undefined,
      };
    });
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

// Get artist details
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
      `${BASE_URL}/recording/${id}?inc=artists+releases+tags+ratings&fmt=json`
    );
    
    if (!response.ok) throw new Error("Failed to get recording");
    
    return response.json();
  } catch (error) {
    console.error("Error getting recording:", error);
    return null;
  }
}

// Get cover art for a release group
export async function getCoverArt(releaseGroupId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${COVER_ART_URL}/release-group/${releaseGroupId}`,
      { headers: { Accept: "application/json" } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const front = data.images?.find((img: { front?: boolean }) => img.front);
    return front?.thumbnails?.small || front?.image || data.images?.[0]?.thumbnails?.small || null;
  } catch {
    return null;
  }
}

// Get Wikipedia summary for an artist
export async function getWikipediaSummary(artistName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`,
      { headers: { Accept: "application/json" } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

// Get Wikipedia image
export async function getWikipediaImage(name: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { Accept: "application/json" } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
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

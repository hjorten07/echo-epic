/**
 * Global cover art cache with expiration
 * Prevents redundant API calls across the application
 */

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<string | null>>();

export const coverArtCache = {
  get(key: string): string | null | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return undefined;
    }
    
    return entry.url;
  },

  set(key: string, url: string | null): void {
    cache.set(key, { url, timestamp: Date.now() });
  },

  has(key: string): boolean {
    return this.get(key) !== undefined;
  },

  // Prevent duplicate in-flight requests
  getPendingRequest(key: string): Promise<string | null> | undefined {
    return pendingRequests.get(key);
  },

  setPendingRequest(key: string, promise: Promise<string | null>): void {
    pendingRequests.set(key, promise);
    promise.finally(() => pendingRequests.delete(key));
  },

  clear(): void {
    cache.clear();
    pendingRequests.clear();
  },

  size(): number {
    return cache.size;
  },
};

// Recording to release-group mapping cache
const recordingCache = new Map<string, { releaseGroupId: string; releaseId: string } | null>();
const pendingRecordingRequests = new Map<string, Promise<{ releaseGroupId: string; releaseId: string } | null>>();

export const recordingReleaseCache = {
  get(recordingId: string) {
    return recordingCache.get(recordingId);
  },

  set(recordingId: string, data: { releaseGroupId: string; releaseId: string } | null) {
    recordingCache.set(recordingId, data);
  },

  has(recordingId: string): boolean {
    return recordingCache.has(recordingId);
  },

  getPendingRequest(recordingId: string) {
    return pendingRecordingRequests.get(recordingId);
  },

  setPendingRequest(recordingId: string, promise: Promise<{ releaseGroupId: string; releaseId: string } | null>) {
    pendingRecordingRequests.set(recordingId, promise);
    promise.finally(() => pendingRecordingRequests.delete(recordingId));
  },
};

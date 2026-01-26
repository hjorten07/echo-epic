/**
 * Global cover art cache with expiration and size limits
 * Prevents redundant API calls and memory leaks
 */

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500; // Prevent unbounded growth
const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<string | null>>();

// LRU-style eviction: remove oldest entries when cache is full
const evictOldEntries = () => {
  if (cache.size <= MAX_CACHE_SIZE) return;
  
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Remove oldest 20% of entries
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
  }
};

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
    evictOldEntries();
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

// Recording to release-group mapping cache with size limits
const MAX_RECORDING_CACHE_SIZE = 500;
const recordingCache = new Map<string, { releaseGroupId: string; releaseId: string } | null>();
const pendingRecordingRequests = new Map<string, Promise<{ releaseGroupId: string; releaseId: string } | null>>();

const evictOldRecordingEntries = () => {
  if (recordingCache.size <= MAX_RECORDING_CACHE_SIZE) return;
  const keys = Array.from(recordingCache.keys());
  const toRemove = Math.floor(keys.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    recordingCache.delete(keys[i]);
  }
};

export const recordingReleaseCache = {
  get(recordingId: string) {
    return recordingCache.get(recordingId);
  },

  set(recordingId: string, data: { releaseGroupId: string; releaseId: string } | null) {
    evictOldRecordingEntries();
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

  clear(): void {
    recordingCache.clear();
    pendingRecordingRequests.clear();
  },
};

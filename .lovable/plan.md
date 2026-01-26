
# Fix: Album Covers Not Appearing on Songs

## Problem Analysis

When viewing a song page, the album cover art is not loading. After investigating the codebase, I found the root cause:

### Current Flow

1. `Song.tsx` calls `getRecording(id)` to fetch song data
2. It then tries to get cover art using `getCoverArt(recordingData.releases[0]["release-group"]?.id)`
3. The Cover Art Archive requires a **release-group ID** to fetch album artwork

### The Bug

In `src/lib/musicbrainz.ts`, the `getRecording` function uses this API call:

```
/recording/{id}?inc=artists+releases+tags+ratings&fmt=json
```

According to MusicBrainz API documentation, recordings can include **two** sub-queries:
- `releases` - the releases the recording appears on
- `release-groups` - the release groups for those releases

**The `release-groups` parameter is missing!** Without it, the `release-group` object inside each release is not populated, so `recordingData.releases[0]["release-group"]?.id` returns `undefined`.

---

## Solution

### File: `src/lib/musicbrainz.ts`

**Change:** Add `release-groups` to the inc parameter in the `getRecording` function.

**Before (line 367):**
```typescript
`${BASE_URL}/recording/${id}?inc=artists+releases+tags+ratings&fmt=json`
```

**After:**
```typescript
`${BASE_URL}/recording/${id}?inc=artists+releases+release-groups+tags+ratings&fmt=json`
```

---

## Why This Works

1. Adding `release-groups` tells MusicBrainz to include full release-group data within each release object
2. This populates `recordingData.releases[0]["release-group"].id` with the actual release-group ID
3. The `getCoverArt()` function can then use this ID to fetch the album cover from Cover Art Archive
4. Songs will now display their parent album's cover art

---

## Technical Details

- **API Documentation Reference**: MusicBrainz API shows `/ws/2/recording` supports `releases, release-groups` as inc subqueries
- **No additional API calls needed** - we're just requesting more data in the existing call
- **No rate limiting impact** - still a single request per song lookup
- **Backward compatible** - no changes to interfaces or data flow

---

## Affected Files

| File | Change |
|------|--------|
| `src/lib/musicbrainz.ts` | Add `release-groups` to inc parameter on line 367 |

This is a one-line fix that resolves the missing cover art issue for all song pages.

// Wikipedia API Service for artist bios and images
// Uses Wikipedia REST API and Wikimedia Commons

const WIKIPEDIA_API = "https://en.wikipedia.org/api/rest_v1";
const WIKIPEDIA_ACTION_API = "https://en.wikipedia.org/w/api.php";

// Cache for Wikipedia data
const wikiCache = new Map<string, { bio: string | null; imageUrl: string | null }>();

export interface WikipediaData {
  bio: string | null;
  imageUrl: string | null;
}

// Fetch artist bio and image from Wikipedia
export async function getWikipediaData(artistName: string): Promise<WikipediaData> {
  const cacheKey = artistName.toLowerCase();
  
  if (wikiCache.has(cacheKey)) {
    return wikiCache.get(cacheKey)!;
  }
  
  try {
    // First, search for the artist page
    const searchUrl = `${WIKIPEDIA_ACTION_API}?action=query&list=search&srsearch=${encodeURIComponent(artistName + " musician OR singer OR band")}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return { bio: null, imageUrl: null };
    }
    
    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];
    
    if (searchResults.length === 0) {
      wikiCache.set(cacheKey, { bio: null, imageUrl: null });
      return { bio: null, imageUrl: null };
    }
    
    // Get the first result's title
    const pageTitle = searchResults[0].title;
    
    // Fetch the summary and image
    const summaryUrl = `${WIKIPEDIA_API}/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryResponse = await fetch(summaryUrl);
    
    if (!summaryResponse.ok) {
      wikiCache.set(cacheKey, { bio: null, imageUrl: null });
      return { bio: null, imageUrl: null };
    }
    
    const summaryData = await summaryResponse.json();
    
    const result: WikipediaData = {
      bio: summaryData.extract || null,
      imageUrl: summaryData.thumbnail?.source || summaryData.originalimage?.source || null,
    };
    
    wikiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching Wikipedia data:", error);
    return { bio: null, imageUrl: null };
  }
}

// Get just the artist image from Wikipedia/Wikimedia Commons
export async function getArtistImage(artistName: string): Promise<string | null> {
  try {
    const data = await getWikipediaData(artistName);
    return data.imageUrl;
  } catch {
    return null;
  }
}

// Get just the artist bio from Wikipedia
export async function getArtistBio(artistName: string): Promise<string | null> {
  try {
    const data = await getWikipediaData(artistName);
    return data.bio;
  } catch {
    return null;
  }
}

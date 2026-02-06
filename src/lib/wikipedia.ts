// Wikipedia API Service for artist bios and images
// Uses Wikipedia REST API and Wikimedia Commons

const WIKIPEDIA_API = "https://en.wikipedia.org/api/rest_v1";
const WIKIPEDIA_ACTION_API = "https://en.wikipedia.org/w/api.php";

// Cache for Wikipedia data
const wikiCache = new Map<string, { bio: string | null; imageUrl: string | null; articleUrl: string | null }>();

export interface WikipediaData {
  bio: string | null;
  imageUrl: string | null;
  articleUrl: string | null;
}

// Fetch artist bio and image from Wikipedia with better artist matching
export async function getWikipediaData(artistName: string): Promise<WikipediaData> {
  const cacheKey = artistName.toLowerCase();
  
  if (wikiCache.has(cacheKey)) {
    return wikiCache.get(cacheKey)!;
  }
  
  try {
    // Search for the artist with a focused query first - avoid multiple sequential calls
    const searchQueries = [
      `${artistName} musician`,
      artistName,
    ];
    
    let bestResult: { title: string; score: number } | null = null;
    
    for (const query of searchQueries) {
      const searchUrl = `${WIKIPEDIA_ACTION_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) continue;
      
      const searchData = await searchResponse.json();
      const searchResults = searchData.query?.search || [];
      
      for (const result of searchResults) {
        const title = result.title.toLowerCase();
        const name = artistName.toLowerCase();
        
        let score = 0;
        
        if (title === name || title.startsWith(name + " ")) {
          score = 100;
        } else if (title.includes(name)) {
          score = 50;
        }
        
        if (result.snippet?.toLowerCase().match(/musician|singer|rapper|dj|producer|band|songwriter/)) {
          score += 30;
        }
        
        if (title.includes("(disambiguation)")) {
          score -= 100;
        }
        
        if (!bestResult || score > bestResult.score) {
          bestResult = { title: result.title, score };
        }
      }
      
      // If we found a good match, stop searching immediately
      if (bestResult && bestResult.score >= 80) {
        break;
      }
    }
    
    if (!bestResult || bestResult.score < 20) {
      wikiCache.set(cacheKey, { bio: null, imageUrl: null, articleUrl: null });
      return { bio: null, imageUrl: null, articleUrl: null };
    }
    
    const pageTitle = bestResult.title;
    const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
    
    // Fetch the summary and image
    const summaryUrl = `${WIKIPEDIA_API}/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryResponse = await fetch(summaryUrl);
    
    if (!summaryResponse.ok) {
      wikiCache.set(cacheKey, { bio: null, imageUrl: null, articleUrl: null });
      return { bio: null, imageUrl: null, articleUrl: null };
    }
    
    const summaryData = await summaryResponse.json();
    
    // Validate that the summary is about the right person
    // Check if the artist name appears in the extract
    const extract = summaryData.extract || "";
    const extractLower = extract.toLowerCase();
    const artistNameLower = artistName.toLowerCase();
    
    // Split artist name into parts to check
    const nameParts = artistNameLower.split(" ");
    const hasNameMatch = nameParts.some(part => 
      part.length > 2 && extractLower.includes(part)
    );
    
    if (!hasNameMatch && !extractLower.includes(artistNameLower)) {
      // The extract doesn't mention the artist name, might be wrong article
      wikiCache.set(cacheKey, { bio: null, imageUrl: null, articleUrl: null });
      return { bio: null, imageUrl: null, articleUrl: null };
    }
    
    const result: WikipediaData = {
      bio: summaryData.extract || null,
      imageUrl: summaryData.thumbnail?.source || summaryData.originalimage?.source || null,
      articleUrl,
    };
    
    wikiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching Wikipedia data:", error);
    return { bio: null, imageUrl: null, articleUrl: null };
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

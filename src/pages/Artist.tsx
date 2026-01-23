import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Disc3, Calendar, MapPin, Loader2, ArrowUpDown, Trophy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VinylLoader } from "@/components/VinylLoader";
import { ItemRatingSection } from "@/components/ItemRatingSection";
import { CommentSection } from "@/components/CommentSection";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getArtist,
  getArtistReleaseGroups,
  getCoverArt,
  MusicBrainzArtist,
  MusicBrainzReleaseGroup,
} from "@/lib/musicbrainz";
import { getWikipediaData } from "@/lib/wikipedia";
import { supabase } from "@/integrations/supabase/client";

interface AlbumWithCover extends MusicBrainzReleaseGroup {
  coverUrl?: string;
}

interface TopRatedItem {
  item_id: string;
  item_type: string;
  item_name: string;
  item_image: string | null;
  item_subtitle: string | null;
  avg_rating: number;
}

const Artist = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<MusicBrainzArtist | null>(null);
  const [customArtist, setCustomArtist] = useState<any>(null);
  const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
  const [bio, setBio] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [topFilter, setTopFilter] = useState<"songs" | "albums">("songs");
  const [artistTopSongs, setArtistTopSongs] = useState<TopRatedItem[]>([]);
  const [artistTopAlbums, setArtistTopAlbums] = useState<TopRatedItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchArtist = async () => {
      setLoading(true);
      
      // Check if this is a custom artist
      if (id.startsWith("custom_")) {
        const customId = id.replace("custom_", "");
        const { data: customData } = await supabase
          .from("custom_artists")
          .select("*")
          .eq("id", customId)
          .maybeSingle();
        
        if (customData) {
          setCustomArtist(customData);
          setBio(customData.bio);
          setImageUrl(customData.image_url);
          setLoadingAlbums(false);
          
          // Fetch top rated items by this custom artist
          const fetchArtistTopRatings = async () => {
            const { data: songs } = await supabase
              .from("item_ratings")
              .select("*")
              .eq("item_type", "song")
              .ilike("item_subtitle", `%${customData.name}%`)
              .order("avg_rating", { ascending: false })
              .limit(10);
            
            if (songs) setArtistTopSongs(songs as TopRatedItem[]);
            
            const { data: albumRatings } = await supabase
              .from("item_ratings")
              .select("*")
              .eq("item_type", "album")
              .ilike("item_subtitle", `%${customData.name}%`)
              .order("avg_rating", { ascending: false })
              .limit(10);
            
            if (albumRatings) setArtistTopAlbums(albumRatings as TopRatedItem[]);
          };
          
          fetchArtistTopRatings();
          setLoading(false);
          return;
        }
      }
      
      const artistData = await getArtist(id);
      setArtist(artistData);

      if (artistData) {
        // Fetch bio and image from Wikipedia
        const wikiData = await getWikipediaData(artistData.name);
        if (wikiData.bio) {
          setBio(wikiData.bio);
        } else if (artistData.disambiguation) {
          // Fallback to MusicBrainz disambiguation
          setBio(artistData.disambiguation);
        }
        if (wikiData.imageUrl) {
          setImageUrl(wikiData.imageUrl);
        }
        
        // Fetch top rated songs/albums by this artist from the database
        const fetchArtistTopRatings = async () => {
          // Fetch songs by this artist
          const { data: songs } = await supabase
            .from("item_ratings")
            .select("*")
            .eq("item_type", "song")
            .ilike("item_subtitle", `%${artistData.name}%`)
            .order("avg_rating", { ascending: false })
            .limit(10);
          
          if (songs) {
            setArtistTopSongs(songs as TopRatedItem[]);
          }
          
          // Fetch albums by this artist
          const { data: albumRatings } = await supabase
            .from("item_ratings")
            .select("*")
            .eq("item_type", "album")
            .ilike("item_subtitle", `%${artistData.name}%`)
            .order("avg_rating", { ascending: false })
            .limit(10);
          
          if (albumRatings) {
            setArtistTopAlbums(albumRatings as TopRatedItem[]);
          }
        };
        
        fetchArtistTopRatings();
      }

      setLoading(false);
    };

    const fetchAlbums = async () => {
      setLoadingAlbums(true);
      const releaseGroups = await getArtistReleaseGroups(id);
      
      // Sort by date (newest first by default)
      const sorted = releaseGroups.sort((a, b) => {
        const dateA = a["first-release-date"] || "";
        const dateB = b["first-release-date"] || "";
        return dateB.localeCompare(dateA);
      });

      setAlbums(sorted);
      setLoadingAlbums(false);

      // Load cover art in the background
      for (const album of sorted) {
        const cover = await getCoverArt(album.id);
        if (cover) {
          setAlbums(prev =>
            prev.map(a => (a.id === album.id ? { ...a, coverUrl: cover } : a))
          );
        }
      }
    };

    fetchArtist();
    fetchAlbums();
  }, [id]);

  const sortedAlbums = [...albums].sort((a, b) => {
    const dateA = a["first-release-date"] || "";
    const dateB = b["first-release-date"] || "";
    return sortOrder === "newest" 
      ? dateB.localeCompare(dateA) 
      : dateA.localeCompare(dateB);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <VinylLoader />
        </div>
      </div>
    );
  }

  // For custom artists, render a custom profile
  if (customArtist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            {/* Artist Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="shrink-0">
                <div className="w-64 h-64 rounded-2xl overflow-hidden bg-secondary mx-auto md:mx-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt={customArtist.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-display font-bold text-muted-foreground/30">
                      {customArtist.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full mb-3">
                  {customArtist.type || "Artist"}
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{customArtist.name}</h1>

                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-muted-foreground mb-6">
                  {customArtist.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {customArtist.country}
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <ItemRatingSection
                    itemType="artist"
                    itemId={id!}
                    itemName={customArtist.name}
                    itemImage={imageUrl || undefined}
                  />
                </div>

                {customArtist.tags && customArtist.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {customArtist.tags.slice(0, 8).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 text-sm bg-secondary rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {bio && (
              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold mb-4">About</h2>
                <div className="glass-card rounded-xl p-6">
                  <p className="text-muted-foreground leading-relaxed">{bio}</p>
                </div>
              </section>
            )}

            {/* Top 10 Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">Top 10</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant={topFilter === "songs" ? "default" : "outline"} size="sm" onClick={() => setTopFilter("songs")} className={topFilter === "songs" ? "bg-primary text-primary-foreground" : ""}>Songs</Button>
                  <Button variant={topFilter === "albums" ? "default" : "outline"} size="sm" onClick={() => setTopFilter("albums")} className={topFilter === "albums" ? "bg-primary text-primary-foreground" : ""}>Albums</Button>
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                {(topFilter === "songs" ? artistTopSongs : artistTopAlbums)?.length ? (
                  <div className="divide-y divide-border">
                    {(topFilter === "songs" ? artistTopSongs : artistTopAlbums)?.slice(0, 10).map((item, index) => (
                      <Link key={item.item_id} to={`/${item.item_type}/${item.item_id}`} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors">
                        <span className={cn("w-8 text-center font-bold", index < 3 ? "text-primary" : "text-muted-foreground")}>{index + 1}</span>
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                          {item.item_image ? (
                            <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-6 h-6 text-muted-foreground/30" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.item_name}</p>
                          {item.item_subtitle && <p className="text-sm text-muted-foreground truncate">{item.item_subtitle}</p>}
                        </div>
                        <span className="font-semibold text-primary">{Number(item.avg_rating).toFixed(1)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No ratings yet. Be the first to rate!</div>
                )}
              </div>
            </section>

            <CommentSection itemType="artist" itemId={id!} />
          </div>
        </main>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-display font-bold mb-2">Artist Not Found</h1>
          <p className="text-muted-foreground">The artist you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Artist Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Image */}
            <div className="shrink-0">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-secondary mx-auto md:mx-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-display font-bold text-muted-foreground/30">
                    {artist.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full mb-3">
                Artist
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {artist.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-muted-foreground mb-6">
                {artist.type && (
                  <span className="flex items-center gap-1">
                    {artist.type}
                  </span>
                )}
                {artist.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {artist.country}
                  </span>
                )}
                {artist["life-span"]?.begin && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {artist["life-span"].begin}
                    {artist["life-span"].ended && artist["life-span"].end
                      ? ` – ${artist["life-span"].end}`
                      : " – Present"}
                  </span>
                )}
              </div>

              {/* Rating Section */}
              <div className="mb-6">
                <ItemRatingSection
                  itemType="artist"
                  itemId={id!}
                  itemName={artist.name}
                  itemImage={imageUrl || undefined}
                />
              </div>

              {/* Tags */}
              {artist.tags && artist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {artist.tags.slice(0, 8).map((tag) => (
                    <span
                      key={tag.name}
                      className="px-3 py-1 text-sm bg-secondary rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bio - from Wikipedia */}
          {bio && (
            <section className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-4">About</h2>
              <div className="glass-card rounded-xl p-6">
                <p className="text-muted-foreground leading-relaxed">{bio}</p>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Source: Wikipedia
                </p>
              </div>
            </section>
          )}

          {/* Top 10 Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-bold">Top 10</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={topFilter === "songs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTopFilter("songs")}
                  className={topFilter === "songs" ? "bg-primary text-primary-foreground" : ""}
                >
                  Songs
                </Button>
                <Button
                  variant={topFilter === "albums" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTopFilter("albums")}
                  className={topFilter === "albums" ? "bg-primary text-primary-foreground" : ""}
                >
                  Albums
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              {(topFilter === "songs" ? artistTopSongs : artistTopAlbums)?.length ? (
                <div className="divide-y divide-border">
                  {(topFilter === "songs" ? artistTopSongs : artistTopAlbums)?.slice(0, 10).map((item, index) => (
                    <Link
                      key={item.item_id}
                      to={`/${item.item_type}/${item.item_id}`}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <span className={cn(
                        "w-8 text-center font-bold",
                        index < 3 ? "text-primary" : "text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                        {item.item_image ? (
                          <img
                            src={item.item_image}
                            alt={item.item_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.item_name}</p>
                        {item.item_subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.item_subtitle}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-primary">
                        {Number(item.avg_rating).toFixed(1)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No ratings yet. Be the first to rate!
                </div>
              )}
            </div>
          </section>

          {/* Discography */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">Discography</h2>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                <SelectTrigger className="w-36">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingAlbums ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedAlbums.length === 0 ? (
              <p className="text-muted-foreground">No albums found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedAlbums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/album/${album.id}`}
                    className="group glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="aspect-square bg-secondary overflow-hidden">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {album["first-release-date"]?.slice(0, 4) || "Unknown year"}
                        {album["primary-type"] && ` • ${album["primary-type"]}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Comments Section */}
          <CommentSection itemType="artist" itemId={id!} />
        </div>
      </main>
    </div>
  );
};

export default Artist;

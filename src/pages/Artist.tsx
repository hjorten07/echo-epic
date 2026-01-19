import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Disc3, Calendar, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { VinylLoader } from "@/components/VinylLoader";
import {
  getArtist,
  getArtistReleaseGroups,
  getWikipediaSummary,
  getWikipediaImage,
  getCoverArt,
  MusicBrainzArtist,
  MusicBrainzReleaseGroup,
} from "@/lib/musicbrainz";

interface AlbumWithCover extends MusicBrainzReleaseGroup {
  coverUrl?: string;
}

const Artist = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<MusicBrainzArtist | null>(null);
  const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
  const [bio, setBio] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchArtist = async () => {
      setLoading(true);
      const artistData = await getArtist(id);
      setArtist(artistData);

      if (artistData) {
        // Fetch bio and image from Wikipedia
        const [summary, image] = await Promise.all([
          getWikipediaSummary(artistData.name),
          getWikipediaImage(artistData.name),
        ]);
        setBio(summary);
        setImageUrl(image);
      }

      setLoading(false);
    };

    const fetchAlbums = async () => {
      setLoadingAlbums(true);
      const releaseGroups = await getArtistReleaseGroups(id);
      
      // Sort by date
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

              {/* Rating Section - No fake ratings */}
              <div className="mb-6">
                <StarRating size="lg" showValue />
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to rate this artist!
                </p>
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

          {/* Bio */}
          {bio && (
            <section className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-4">About</h2>
              <div className="glass-card rounded-xl p-6">
                <p className="text-muted-foreground leading-relaxed">{bio}</p>
                <p className="text-xs text-muted-foreground/60 mt-4 flex items-center gap-1">
                  Source:{" "}
                  <a
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(artist.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Wikipedia <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </section>
          )}

          {/* Discography */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-6">Discography</h2>

            {loadingAlbums ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : albums.length === 0 ? (
              <p className="text-muted-foreground">No albums found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albums.map((album) => (
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
        </div>
      </main>
    </div>
  );
};

export default Artist;

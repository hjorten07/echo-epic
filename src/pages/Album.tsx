import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Calendar, ExternalLink, Loader2, Music2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { VinylLoader } from "@/components/VinylLoader";
import {
  getReleaseGroup,
  getReleasesForGroup,
  getCoverArt,
  getWikipediaSummary,
  formatDuration,
  MusicBrainzReleaseGroup,
  MusicBrainzRelease,
} from "@/lib/musicbrainz";

interface Track {
  id: string;
  number: string;
  title: string;
  duration?: number;
}

const Album = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<MusicBrainzReleaseGroup | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAlbum = async () => {
      setLoading(true);
      const [albumData, cover] = await Promise.all([
        getReleaseGroup(id),
        getCoverArt(id),
      ]);
      
      setAlbum(albumData);
      setCoverUrl(cover);

      if (albumData) {
        const artistName = albumData["artist-credit"]?.[0]?.artist?.name;
        if (artistName) {
          const summary = await getWikipediaSummary(`${albumData.title} (album)`);
          if (!summary) {
            const artistSummary = await getWikipediaSummary(artistName);
            setBio(artistSummary);
          } else {
            setBio(summary);
          }
        }
      }

      setLoading(false);
    };

    const fetchTracks = async () => {
      setLoadingTracks(true);
      const releases = await getReleasesForGroup(id);
      
      if (releases.length > 0) {
        const release = releases[0];
        const allTracks: Track[] = [];
        
        release.media?.forEach((medium) => {
          medium.tracks?.forEach((track) => {
            allTracks.push({
              id: track.recording.id,
              number: track.number,
              title: track.title || track.recording.title,
              duration: track.length || track.recording.length,
            });
          });
        });
        
        setTracks(allTracks);
      }
      
      setLoadingTracks(false);
    };

    fetchAlbum();
    fetchTracks();
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

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-display font-bold mb-2">Album Not Found</h1>
          <p className="text-muted-foreground">The album you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const artistName = album["artist-credit"]?.[0]?.artist?.name;
  const artistId = album["artist-credit"]?.[0]?.artist?.id;
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Album Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Cover Art */}
            <div className="shrink-0">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-secondary mx-auto md:mx-0 shadow-2xl">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-display font-bold text-muted-foreground/30">
                    {album.title[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full mb-3">
                {album["primary-type"] || "Album"}
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                {album.title}
              </h1>

              {artistName && (
                <p className="text-xl text-muted-foreground mb-4">
                  by{" "}
                  {artistId ? (
                    <Link
                      to={`/artist/${artistId}`}
                      className="text-primary hover:underline"
                    >
                      {artistName}
                    </Link>
                  ) : (
                    artistName
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-muted-foreground mb-6">
                {album["first-release-date"] && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {album["first-release-date"]}
                  </span>
                )}
                {tracks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Music2 className="w-4 h-4" />
                    {tracks.length} tracks
                  </span>
                )}
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
              </div>

              {/* Rating Section */}
              <div className="mb-6">
                <StarRating size="lg" showValue />
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to rate this album!
                </p>
              </div>
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
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(album.title)}`}
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

          {/* Track List */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-6">Tracklist</h2>

            {loadingTracks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tracks.length === 0 ? (
              <p className="text-muted-foreground">No tracks available.</p>
            ) : (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {tracks.map((track) => (
                    <Link
                      key={track.id}
                      to={`/song/${track.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors group"
                    >
                      <span className="w-8 text-center text-muted-foreground font-mono text-sm">
                        {track.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {track.title}
                        </h3>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(track.duration)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Album;

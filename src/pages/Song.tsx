import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Disc3 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { VinylLoader } from "@/components/VinylLoader";
import {
  getRecording,
  getCoverArt,
  formatDuration,
  MusicBrainzRecording,
} from "@/lib/musicbrainz";

const Song = () => {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<MusicBrainzRecording | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchSong = async () => {
      setLoading(true);
      const recordingData = await getRecording(id);
      setSong(recordingData);

      // Try to get cover art from the first release's release group
      if (recordingData?.releases?.[0]?.["release-group"]?.id) {
        const cover = await getCoverArt(recordingData.releases[0]["release-group"].id);
        setCoverUrl(cover);
      }

      setLoading(false);
    };

    fetchSong();
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

  if (!song) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-display font-bold mb-2">Song Not Found</h1>
          <p className="text-muted-foreground">The song you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const artistName = song["artist-credit"]?.[0]?.artist?.name;
  const artistId = song["artist-credit"]?.[0]?.artist?.id;
  const album = song.releases?.[0];
  const albumId = album?.["release-group"]?.id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Song Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Cover Art */}
            <div className="shrink-0">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-secondary mx-auto md:mx-0 shadow-2xl">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-24 h-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full mb-3">
                Song
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
                {song.title}
              </h1>

              {artistName && (
                <p className="text-xl text-muted-foreground mb-2">
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

              {album && (
                <p className="text-muted-foreground mb-4">
                  from{" "}
                  {albumId ? (
                    <Link
                      to={`/album/${albumId}`}
                      className="text-primary hover:underline"
                    >
                      {album.title || album["release-group"]?.title}
                    </Link>
                  ) : (
                    album.title
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-muted-foreground mb-6">
                {song.length && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(song.length)}
                  </span>
                )}
              </div>

              {/* Rating Section */}
              <div className="mb-6">
                <StarRating size="lg" showValue />
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to rate this song!
                </p>
              </div>
            </div>
          </div>

          {/* Other Releases */}
          {song.releases && song.releases.length > 1 && (
            <section>
              <h2 className="font-display text-2xl font-bold mb-6">
                Also appears on
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {song.releases.slice(1, 5).map((release) => (
                  <Link
                    key={release.id}
                    to={`/album/${release["release-group"]?.id || release.id}`}
                    className="flex items-center gap-4 p-4 glass-card rounded-xl hover:border-primary/30 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Disc3 className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                        {release.title}
                      </h3>
                      {release.date && (
                        <p className="text-sm text-muted-foreground">
                          {release.date}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Song;

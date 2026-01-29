import { memo } from "react";
import { Music } from "lucide-react";
import { useSongCoverArt } from "@/hooks/useSongCoverArt";

interface PlaylistSongImageProps {
  songId: string;
  songImage: string | null;
  songName: string;
  className?: string;
}

/**
 * Component that displays playlist song cover art.
 * If no image is provided, it fetches from MusicBrainz/Cover Art Archive.
 */
export const PlaylistSongImage = memo(({ songId, songImage, songName, className = "" }: PlaylistSongImageProps) => {
  const { coverUrl, loading } = useSongCoverArt(songId, songImage);

  if (loading) {
    return (
      <div className={`bg-muted flex items-center justify-center animate-pulse ${className}`}>
        <Music className="w-5 h-5 text-muted-foreground/30" />
      </div>
    );
  }

  if (coverUrl) {
    return (
      <img 
        src={coverUrl} 
        alt={songName} 
        className={`w-full h-full object-cover ${className}`} 
        loading="lazy"
      />
    );
  }

  return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <Music className="w-5 h-5 text-muted-foreground" />
    </div>
  );
});

PlaylistSongImage.displayName = "PlaylistSongImage";

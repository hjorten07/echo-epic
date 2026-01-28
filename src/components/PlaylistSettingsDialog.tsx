import { useState, useRef } from "react";
import { Loader2, Upload, Globe, Lock, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdatePlaylist, type Playlist } from "@/hooks/usePlaylists";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlaylistSettingsDialogProps {
  playlist: Playlist & { cover_image?: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistSettingsDialog = ({
  playlist,
  open,
  onOpenChange,
}: PlaylistSettingsDialogProps) => {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const [coverImage, setCoverImage] = useState<string | null>(playlist.cover_image || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePlaylist = useUpdatePlaylist();

  const handleSave = async () => {
    try {
      await updatePlaylist.mutateAsync({
        id: playlist.id,
        name: name.trim() || playlist.name,
        description: description.trim() || undefined,
        isPublic,
      });
      
      // Update cover image separately if changed
      if (coverImage !== playlist.cover_image) {
        await supabase
          .from("playlists")
          .update({ cover_image: coverImage })
          .eq("id", playlist.id);
      }
      
      toast.success("Playlist updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update playlist");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `playlists/${fileName}`;

      const { error } = await supabase.storage
        .from("artist-images")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("artist-images")
        .getPublicUrl(filePath);

      setCoverImage(publicUrl);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Playlist Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Image
                </Button>
                {coverImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverImage(null)}
                    className="w-full text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Name</Label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="playlist-desc">Description</Label>
            <Textarea
              id="playlist-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
              rows={3}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{isPublic ? "Public" : "Private"}</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone can see this playlist"
                    : "Only you can see this playlist"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={updatePlaylist.isPending}
            className="w-full"
          >
            {updatePlaylist.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

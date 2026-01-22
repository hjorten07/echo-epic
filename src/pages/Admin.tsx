import { useState, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Star, 
  Eye, 
  Plus, 
  Flag, 
  Loader2,
  Check,
  X,
  Trash2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useIsAdmin,
  useTotalStats,
  useReports,
  useUpdateReportStatus,
  useCreateCustomArtist,
  useCustomArtists,
  useDeleteCustomArtist,
  useDeleteUser,
} from "@/hooks/useAdmin";

import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const isAdmin = useIsAdmin();
  const [timeRange, setTimeRange] = useState("30");
  const [newArtist, setNewArtist] = useState({
    name: "",
    bio: "",
    imageUrl: "",
    country: "",
    type: "Artist",
    tags: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: totalStats, isLoading: statsLoading } = useTotalStats();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: customArtists } = useCustomArtists();
  const updateReportStatus = useUpdateReportStatus();
  const createCustomArtist = useCreateCustomArtist();
  const deleteCustomArtist = useDeleteCustomArtist();
  const deleteUser = useDeleteUser();

  if (!isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setNewArtist(prev => ({ ...prev, imageUrl: "" }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `artists/${fileName}`;

    const { error } = await supabase.storage
      .from('artist-images')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('artist-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  if (!isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.name.trim()) {
      toast.error("Artist name is required");
      return;
    }

    try {
      setIsUploadingImage(true);
      let finalImageUrl = newArtist.imageUrl.trim() || undefined;

      // Upload image if file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      await createCustomArtist.mutateAsync({
        name: newArtist.name.trim(),
        bio: newArtist.bio.trim() || undefined,
        imageUrl: finalImageUrl,
        country: newArtist.country.trim() || undefined,
        type: newArtist.type,
        tags: newArtist.tags ? newArtist.tags.split(",").map(t => t.trim()) : undefined,
      });
      toast.success("Artist created successfully!");
      setNewArtist({ name: "", bio: "", imageUrl: "", country: "", type: "Artist", tags: "" });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Failed to create artist");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleReportAction = async (reportId: string, status: string) => {
    try {
      await updateReportStatus.mutateAsync({ reportId, status });
      toast.success(`Report ${status}`);
    } catch (error) {
      toast.error("Failed to update report");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUser.mutateAsync(userId);
      toast.success("User deleted");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const timeRangeOptions = [
    { value: "30", label: "Past 30 Days" },
    { value: "60", label: "Past 60 Days" },
    { value: "180", label: "Past 180 Days" },
    { value: "365", label: "Past Year" },
    { value: "9999", label: "All Time" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <h1 className="font-display text-3xl font-bold text-destructive">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your platform</p>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Site Analytics</h2>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Page Views</span>
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {/* Views will come from site_stats when populated */}
                      0
                    </p>
                  </div>

                  <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Total Ratings</span>
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {totalStats?.totalRatings?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">Total Users</span>
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {totalStats?.totalUsers?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart placeholder */}
              <div className="glass-card rounded-xl p-6 h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Analytics charts will populate as usage data is collected
                </p>
              </div>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-6">
              <h2 className="font-display text-xl font-bold">Create Custom Artist</h2>
              <p className="text-muted-foreground">
                Add artists that are not available in MusicBrainz
              </p>

              <form onSubmit={handleCreateArtist} className="glass-card rounded-xl p-6 space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="artist-name">Artist Name *</Label>
                  <Input
                    id="artist-name"
                    value={newArtist.name}
                    onChange={(e) => setNewArtist(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter artist name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist-bio">Bio</Label>
                  <Textarea
                    id="artist-bio"
                    value={newArtist.bio}
                    onChange={(e) => setNewArtist(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Artist biography..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Artist Image</Label>
                  <div className="flex gap-4 items-start">
                    {/* Image Preview */}
                    <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : newArtist.imageUrl ? (
                        <img src={newArtist.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {/* File upload */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="artist-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                      
                      {/* Or URL input */}
                      <div className="relative">
                        <span className="text-xs text-muted-foreground">Or enter URL:</span>
                        <Input
                          id="artist-image"
                          value={newArtist.imageUrl}
                          onChange={(e) => {
                            setNewArtist(prev => ({ ...prev, imageUrl: e.target.value }));
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          placeholder="https://..."
                          type="url"
                          className="mt-1"
                          disabled={!!imageFile}
                        />
                      </div>
                      
                      {imageFile && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate">{imageFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="h-6 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artist-country">Country</Label>
                    <Input
                      id="artist-country"
                      value={newArtist.country}
                      onChange={(e) => setNewArtist(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="e.g. US, UK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-type">Type</Label>
                    <Select
                      value={newArtist.type}
                      onValueChange={(value) => setNewArtist(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Artist">Artist</SelectItem>
                        <SelectItem value="Group">Group</SelectItem>
                        <SelectItem value="Band">Band</SelectItem>
                        <SelectItem value="Orchestra">Orchestra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist-tags">Tags (comma separated)</Label>
                  <Input
                    id="artist-tags"
                    value={newArtist.tags}
                    onChange={(e) => setNewArtist(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="pop, rock, electronic"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createCustomArtist.isPending || isUploadingImage}>
                  {(createCustomArtist.isPending || isUploadingImage) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isUploadingImage ? "Uploading Image..." : "Create Artist"}
                </Button>
              </form>

              {/* List of custom artists */}
              {customArtists && customArtists.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg font-bold mb-4">Custom Artists ({customArtists.length})</h3>
                  <div className="space-y-2">
                    {customArtists.map((artist) => (
                      <div key={artist.id} className="glass-card rounded-lg p-4 flex items-center gap-4">
                        {artist.image_url ? (
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                            <span className="font-bold text-muted-foreground">
                              {artist.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{artist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {artist.type} {artist.country && `• ${artist.country}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(artist.created_at), "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete artist "${artist.name}"? This cannot be undone.`)) {
                              deleteCustomArtist.mutate(artist.id, {
                                onSuccess: () => toast.success("Artist deleted"),
                                onError: () => toast.error("Failed to delete artist"),
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <h2 className="font-display text-xl font-bold">User Reports</h2>

              {reportsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div
                      key={report.id}
                      className={cn(
                        "glass-card rounded-xl p-6",
                        report.status === "pending" && "border-l-4 border-l-destructive"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded-full",
                              report.status === "pending" && "bg-destructive/10 text-destructive",
                              report.status === "reviewed" && "bg-yellow-500/10 text-yellow-500",
                              report.status === "resolved" && "bg-green-500/10 text-green-500",
                              report.status === "dismissed" && "bg-muted text-muted-foreground"
                            )}>
                              {report.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>

                          <p className="font-medium">
                            Reported by: {report.reporter?.username || "Unknown"}
                          </p>
                          {report.reported_user && (
                            <p className="text-sm text-muted-foreground">
                              User: {report.reported_user.username}
                            </p>
                          )}
                          {report.reported_comment && (
                            <div className="text-sm bg-secondary/50 p-3 rounded-lg">
                              <p className="text-muted-foreground mb-1">Comment:</p>
                              <p>{report.reported_comment.content}</p>
                            </div>
                          )}
                          <p className="text-sm">
                            <span className="text-muted-foreground">Reason:</span> {report.reason}
                          </p>
                        </div>

                        {report.status === "pending" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReportAction(report.id, "dismissed")}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReportAction(report.id, "resolved")}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
                            {report.reported_user_id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(report.reported_user_id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Ban User
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Flag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reports yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;

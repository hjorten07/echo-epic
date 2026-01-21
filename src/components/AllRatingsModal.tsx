import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, Search, Trash2, Music2, Disc3, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Rating {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  item_image: string | null;
  item_subtitle: string | null;
  rating: number;
  created_at: string;
}

interface AllRatingsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AllRatingsModal = ({ userId, isOpen, onClose }: AllRatingsModalProps) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "song" | "album" | "artist">("all");

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchRatings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("ratings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRatings(data || []);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
      setLoading(false);
    };

    fetchRatings();
  }, [isOpen, userId]);

  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm("Are you sure you want to delete this rating?")) return;

    try {
      const { error } = await supabase
        .from("ratings")
        .delete()
        .eq("id", ratingId);

      if (error) throw error;

      setRatings((prev) => prev.filter((r) => r.id !== ratingId));
      toast.success("Rating deleted");
    } catch (error) {
      toast.error("Failed to delete rating");
    }
  };

  const filteredRatings = ratings.filter((r) => {
    const matchesSearch = r.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || r.item_type === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { value: "all" as const, label: "All", icon: null },
    { value: "song" as const, label: "Songs", icon: Music2 },
    { value: "album" as const, label: "Albums", icon: Disc3 },
    { value: "artist" as const, label: "Artists", icon: Mic2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">All Ratings</DialogTitle>
        </DialogHeader>

        {/* Search & Filters */}
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ratings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f.icon && <f.icon className="w-4 h-4" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ratings List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No ratings match your search" : "No ratings yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <Link
                    to={`/${rating.item_type}/${rating.item_id}`}
                    onClick={onClose}
                    className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0"
                  >
                    {rating.item_image ? (
                      <img
                        src={rating.item_image}
                        alt={rating.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {rating.item_name[0]}
                      </div>
                    )}
                  </Link>
                  <Link
                    to={`/${rating.item_type}/${rating.item_id}`}
                    onClick={onClose}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium truncate hover:text-primary transition-colors">
                      {rating.item_name}
                    </p>
                    {rating.item_subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {rating.item_subtitle}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground capitalize">
                      {rating.item_type}
                    </span>
                  </Link>
                  <StarRating rating={rating.rating} readonly size="sm" showValue />
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRating(rating.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
          {filteredRatings.length} rating{filteredRatings.length !== 1 ? "s" : ""}
        </div>
      </DialogContent>
    </Dialog>
  );
};

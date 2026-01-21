import { useState } from "react";
import { Plus, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserBadges, useUserStreak, useUpdateDisplayedBadges } from "@/hooks/useBadges";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BadgesSectionProps {
  userId: string;
}

export const BadgesSection = ({ userId }: BadgesSectionProps) => {
  const { user } = useAuth();
  const { data: userBadges, isLoading } = useUserBadges(userId);
  const { data: streak } = useUserStreak(userId);
  const updateDisplayed = useUpdateDisplayedBadges();
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showEditBadges, setShowEditBadges] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  const isOwnProfile = user?.id === userId;

  // Get displayed badges (max 5)
  const displayedBadges = userBadges
    ?.filter((ub) => ub.displayed)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, 5);

  // If no explicitly displayed badges, show the most recent ones
  const badgesToShow = displayedBadges?.length
    ? displayedBadges
    : userBadges?.slice(0, 5);

  const handleEditBadges = () => {
    setSelectedBadges(displayedBadges?.map((b) => b.badge_id) || []);
    setShowEditBadges(true);
  };

  const toggleBadgeSelection = (badgeId: string) => {
    setSelectedBadges((prev) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      }
      if (prev.length >= 5) {
        toast.error("You can only display 5 badges");
        return prev;
      }
      return [...prev, badgeId];
    });
  };

  const handleSaveDisplayed = async () => {
    try {
      await updateDisplayed.mutateAsync(selectedBadges);
      toast.success("Badges updated");
      setShowEditBadges(false);
    } catch (error) {
      toast.error("Failed to update badges");
    }
  };

  if (isLoading || !userBadges || userBadges.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold">Badges</h2>
        {isOwnProfile && userBadges.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleEditBadges}>
            <Settings2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {/* Streak Badge */}
      {streak && streak.longest_streak > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-medium text-primary">
              {streak.current_streak} day streak
            </p>
            <p className="text-sm text-muted-foreground">
              Best: {streak.longest_streak} days
            </p>
          </div>
        </div>
      )}

      {/* Displayed Badges */}
      <div className="flex flex-wrap gap-3 items-center">
        {badgesToShow?.map((ub) => (
          <div
            key={ub.id}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-default"
            title={ub.badge?.description}
          >
            <span className="text-xl">{ub.badge?.icon}</span>
            <span className="text-sm font-medium">{ub.badge?.name}</span>
          </div>
        ))}

        {/* View All Button */}
        {userBadges.length > 5 && (
          <button
            onClick={() => setShowAllBadges(true)}
            className="w-14 h-14 rounded-xl bg-secondary/50 border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* All Badges Modal */}
      <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">All Badges</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {userBadges.map((ub) => (
              <div
                key={ub.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border"
                title={ub.badge?.description}
              >
                <span className="text-2xl">{ub.badge?.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ub.badge?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ub.badge?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Displayed Badges Modal */}
      <Dialog open={showEditBadges} onOpenChange={setShowEditBadges}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Choose Displayed Badges (max 5)
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {userBadges.map((ub) => (
              <button
                key={ub.id}
                onClick={() => toggleBadgeSelection(ub.badge_id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  selectedBadges.includes(ub.badge_id)
                    ? "bg-primary/10 border-primary"
                    : "bg-secondary/50 border-border hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{ub.badge?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ub.badge?.name}</p>
                </div>
                {selectedBadges.includes(ub.badge_id) && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditBadges(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDisplayed} disabled={updateDisplayed.isPending}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

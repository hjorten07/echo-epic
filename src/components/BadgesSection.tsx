import { useState } from "react";
import { Plus, Settings2, Check, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserBadges, useUserStreak, useUpdateDisplayedBadges, useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DuolingoBadge } from "./DuolingoBadge";

interface BadgesSectionProps {
  userId: string;
  canView?: boolean;
  totalRatings?: number;
}

export const BadgesSection = ({ userId, canView = true, totalRatings = 0 }: BadgesSectionProps) => {
  const { user } = useAuth();
  const { data: userBadges, isLoading } = useUserBadges(userId);
  const { data: allBadges } = useBadges();
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

  // Create a set of earned badge IDs for quick lookup
  const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

  if (isLoading || !canView) {
    return null;
  }

  // Always show badges section, even if empty (shows "No badges yet")
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Badges</h2>
        </div>
        {isOwnProfile && userBadges && userBadges.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleEditBadges}>
            <Settings2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {/* Streak Badge */}
      {streak && (streak.current_streak > 0 || streak.longest_streak > 0) && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="font-display font-bold text-lg text-foreground">
              {streak.current_streak} day streak
            </p>
            <p className="text-sm text-muted-foreground">
              Highest: {streak.longest_streak} days
            </p>
          </div>
        </div>
      )}

      {/* Displayed Badges - Duolingo Style */}
      {badgesToShow && badgesToShow.length > 0 ? (
        <div className="flex flex-wrap gap-4 items-center">
          {badgesToShow.map((ub) => (
            <DuolingoBadge
              key={ub.id}
              icon={ub.badge?.icon || "🎵"}
              name={ub.badge?.name || "Badge"}
              description={ub.badge?.description || ""}
              earnedAt={ub.earned_at}
              category={ub.badge?.category}
              threshold={ub.badge?.threshold}
              currentProgress={totalRatings}
              earned={true}
              size="md"
            />
          ))}

          {/* View All Button */}
          {(userBadges?.length || 0) > 5 && (
            <button
              onClick={() => setShowAllBadges(true)}
              className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No badges yet</p>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground mt-1">
              Start rating music to earn badges!
            </p>
          )}
        </div>
      )}

      {/* All Badges Modal */}
      <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">All Badges</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto py-4">
            {allBadges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const userBadge = userBadges?.find((ub) => ub.badge_id === badge.id);
              return (
                <div key={badge.id} className="flex flex-col items-center gap-2">
                  <DuolingoBadge
                    icon={badge.icon}
                    name={badge.name}
                    description={badge.description}
                    earnedAt={userBadge?.earned_at}
                    category={badge.category}
                    threshold={badge.threshold}
                    currentProgress={totalRatings}
                    earned={isEarned}
                    size="sm"
                  />
                  <span className={cn(
                    "text-xs text-center truncate w-full",
                    isEarned ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Displayed Badges Modal */}
      <Dialog open={showEditBadges} onOpenChange={setShowEditBadges}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">
              Choose Displayed Badges (max 5)
            </DialogTitle>
          </DialogHeader>
          
          {/* Streak display */}
          {streak && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div className="text-sm">
                <span className="font-medium">Current: {streak.current_streak} days</span>
                <span className="text-muted-foreground mx-2">•</span>
                <span className="text-muted-foreground">Highest: {streak.longest_streak} days</span>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-3 gap-4 py-4">
              {/* Show ALL available badges, with earned ones selectable and unearned greyed out */}
              {allBadges?.map((badge) => {
                const isEarned = earnedBadgeIds.has(badge.id);
                const isSelected = selectedBadges.includes(badge.id);
                
                if (!isEarned) {
                  // Show unearned badges as greyed out (not clickable)
                  return (
                    <div
                      key={badge.id}
                      className="relative flex flex-col items-center gap-2 p-3 rounded-xl border bg-secondary/20 border-border opacity-40"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl grayscale">{badge.icon}</span>
                      </div>
                      <span className="text-xs text-center truncate w-full text-muted-foreground">{badge.name}</span>
                    </div>
                  );
                }
                
                // Earned badges are selectable
                return (
                  <button
                    key={badge.id}
                    onClick={() => toggleBadgeSelection(badge.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary/50 border-border hover:border-primary/50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                    <span className="text-xs text-center truncate w-full">{badge.name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
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

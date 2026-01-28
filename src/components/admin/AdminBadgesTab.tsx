import { Loader2, Award } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { cn } from "@/lib/utils";

export const AdminBadgesTab = () => {
  const { data: badges, isLoading } = useBadges();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group badges by category
  const groupedBadges = badges?.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">All Badges</h2>
      <p className="text-muted-foreground">
        Overview of all badges available in the system
      </p>

      {groupedBadges && Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category} className="space-y-4">
          <h3 className="font-semibold capitalize text-lg border-b pb-2">
            {category} Badges ({categoryBadges?.length || 0})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBadges?.map((badge) => (
              <div
                key={badge.id}
                className="glass-card rounded-xl p-4 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">{badge.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{badge.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {badge.description}
                  </p>
                  {badge.threshold && (
                    <p className="text-xs text-primary mt-2">
                      Threshold: {badge.threshold}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!badges || badges.length === 0) && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No badges configured</p>
        </div>
      )}
    </div>
  );
};

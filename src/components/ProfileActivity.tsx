import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Flame, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProfileActivityProps {
  userId: string;
}

export const ProfileActivity = ({ userId }: ProfileActivityProps) => {
  const [activeTab, setActiveTab] = useState<"wall" | "takes">("wall");

  const { data: wallPosts, isLoading: wallLoading } = useQuery({
    queryKey: ["user-wall-posts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wall_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: hotTakes, isLoading: takesLoading } = useQuery({
    queryKey: ["user-hot-takes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hot_takes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = activeTab === "wall" ? wallLoading : takesLoading;
  const items = activeTab === "wall" ? wallPosts : hotTakes;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Activity
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("wall")}
            className={cn(
              "px-3 py-1 text-sm rounded-lg transition-colors",
              activeTab === "wall"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Wall Posts
          </button>
          <button
            onClick={() => setActiveTab("takes")}
            className={cn(
              "px-3 py-1 text-sm rounded-lg transition-colors",
              activeTab === "takes"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Hot Takes
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-2 mb-2">
                {activeTab === "takes" && (
                  <Flame className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground rounded-xl bg-secondary/30">
          {activeTab === "wall" ? (
            <>
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No wall posts yet</p>
            </>
          ) : (
            <>
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hot takes yet</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

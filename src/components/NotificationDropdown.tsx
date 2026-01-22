import { Link, useNavigate } from "react-router-dom";
import { Music, Bell, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Get related user profiles for follow notifications
  const relatedUserIds = notifications
    ?.filter((n) => (n.type === "follow" || n.type === "follow_request" || n.type === "new_follower") && n.related_item_id)
    .map((n) => n.related_item_id)
    .filter(Boolean) as string[] || [];

  const { data: relatedProfiles } = useQuery({
    queryKey: ["notification-profiles", relatedUserIds],
    queryFn: async () => {
      if (relatedUserIds.length === 0) return {};
      
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", relatedUserIds);
      
      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      data?.forEach((p) => {
        profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
      });
      return profileMap;
    },
    enabled: relatedUserIds.length > 0,
  });

  const handleNotificationClick = (notification: {
    id: string;
    read: boolean;
    type: string;
    related_item_id: string | null;
    related_item_type: string | null;
  }) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    
    // Navigate based on notification type
    if ((notification.type === "follow" || notification.type === "new_follower" || notification.type === "follow_request") && notification.related_item_id) {
      navigate(`/user/${notification.related_item_id}`);
    } else if (notification.type === "welcome") {
      // Welcome notifications don't need navigation
    } else if (notification.related_item_type && notification.related_item_id) {
      navigate(`/${notification.related_item_type}/${notification.related_item_id}`);
    }
  };

  const getNotificationAvatar = (notification: {
    type: string;
    related_item_id: string | null;
  }) => {
    if ((notification.type === "follow" || notification.type === "new_follower" || notification.type === "follow_request") && notification.related_item_id) {
      const profile = relatedProfiles?.[notification.related_item_id];
      if (profile) {
        return profile.avatar_url;
      }
    }
    return null;
  };

  const getNotificationInitial = (notification: {
    type: string;
    related_item_id: string | null;
    title: string;
  }) => {
    if ((notification.type === "follow" || notification.type === "new_follower" || notification.type === "follow_request") && notification.related_item_id) {
      const profile = relatedProfiles?.[notification.related_item_id];
      if (profile) {
        return profile.username[0]?.toUpperCase() || "?";
      }
    }
    if (notification.type === "welcome") return "🎵";
    if (notification.type === "badge") return "🏆";
    return "📢";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Music className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const avatarUrl = getNotificationAvatar(notification);
            const initial = getNotificationInitial(notification);
            
            return (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Avatar/Icon */}
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm">
                        {initial}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                    </div>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link to="/notifications" className="text-primary text-sm font-medium">
                View All
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
